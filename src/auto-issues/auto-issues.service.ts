import { BoardsService } from './../monday/services/boards.service';
import { ConfigVariableRepository } from 'src/config-variable/repository/config-variable.repository';
import { Injectable } from '@nestjs/common';
import { AutoIssuesRepository } from './repository/auto-issues.repository';
import * as moment from 'moment-timezone';
import * as _ from 'lodash';
import { Cron } from '@nestjs/schedule';
import { AutoIssues } from './entity/auto-issues.entity';
import { InboundCallActivities } from 'src/data-ics/entity/inbound-call.entity';

@Injectable()
export class AutoIssuesService {
  constructor(
    private readonly _autoIssuesRepository: AutoIssuesRepository,
    private readonly _configVariableRepository: ConfigVariableRepository,
    private readonly _boardService: BoardsService
    
  ) {
    //TODO: testing
    setTimeout(async () => {
      // const toDay = moment().add(7, 'hours').toDate();
      // const dateTo = moment().toISOString();
      // const dateFrom = moment().subtract(1, 'days').toISOString();
      // this._autoImportIC('2021-11-11T02:00:00.138Z', '2021-11-12T04:00:00.138Z');
      // this._autoImportIC(dateFrom, dateTo);
    }, 2000);
    
  }
  @Cron(`00 00 ${process.env.TIME_AUTO_ISSUE} * * *`) //same 11h vn-time, 20h us-time
  async handleCron() {
    const dateTo = moment().toISOString();
    const dateFrom = moment().subtract(1, 'days').toISOString();
    await this._autoImportIC(dateFrom, dateTo);
  }
  

  private async _autoImportIC(dateFrom, dateTo) {
    //TODO: need get for 3 board IC- Health, Life, Tax Dept ; IC- Personal Dept ; IC- Commercial Dept
    //TODO: id 1483255419 ; 1483261623 ; 1483259420
    const arrayIds = [1483255419, 1483261623, 1483259420]
    for(let i = 0; i < arrayIds.length; i++){
      let pageIndex = 1;
      const responseActivity: any = await this._boardService.getActivities(arrayIds[i], dateFrom, dateTo, pageIndex);
      let activityLogs: any[] = responseActivity.boards[0].activity_logs;
      while (activityLogs.length === 1000*pageIndex) {
        pageIndex = pageIndex + 1;
        const nextResponseActivity: any = await this._boardService.getActivities(arrayIds[i], dateFrom, dateTo, pageIndex);
        activityLogs = activityLogs.concat(nextResponseActivity.boards[0].activity_logs)
      }

      const activityLogsEnhanced = activityLogs
        .filter((log) => log.event === 'update_column_value')
        .map((log) => {
          let data = JSON.parse(log.data);
          data = {
            ...data,
            created_at: moment(new Date(parseInt(log.created_at) / 1e4))
              .tz('America/Los_Angeles')
              .format('YYYY-MM-DD hh:mm:ss A'),
          };
          return data;
        });
      const autoIssues = await this._newDetectICIssues(activityLogsEnhanced);
      console.log(autoIssues.length);
      await this._importICData(activityLogsEnhanced, autoIssues);
    }
  }

  public async _newDetectICIssues (activityLogs) {
    try {
      const autoIssues = [];

      const startWork = await this._configVariableRepository.findOne({
        key: 'startWork',
      });

      const startWorkTime = moment(startWork.value, 'HH:mm:ss');

      const itemsGroup = _.groupBy(activityLogs, 'pulse_id');
      for (const itemId in itemsGroup) {
        const listActivitySameItem:any[] = itemsGroup[itemId];

        if(listActivitySameItem.length > 1) {
          listActivitySameItem.sort((item1, item2) => {
            const compareTime = new Date(item1['created_at']).getTime() - new Date(item2['created_at']).getTime();
            return compareTime;
          });

          let ignoreCheckIssue = false; 
          // let phoneNumber = '';

          for (let index = 0; index < listActivitySameItem.length; index++) {
            const activity = listActivitySameItem[index];
            
            //* loai bo task tao dau ngay hoac task cu => task truoc
            const time = moment(
              moment(new Date(activity['created_at'])).format('HH:mm:ss'),
              'HH:mm:ss',
            );
            // if(activity['column_title'] === 'Phone'){
            //   // console.log(listActivitySameItem[i])
            //   if(activity['value']['phone']){
            //     phoneNumber = activity['value']['phone'];
            //   }
            // }

            if (
              time.isBefore(startWorkTime) ||
              activity?.pulse_name
                ?.toString()
                .toLowerCase()
                .indexOf('new call') > -1 ||
                activity?.pulse_name
                ?.toString()
                .toLowerCase()
                .indexOf('new voice') > -1 ||
                activity?.pulse_name
                ?.toString()
                .toLowerCase()
                .indexOf('[') === 0 ||
                activity?.pulse_name
                ?.toString()
                .toLowerCase()
                .indexOf('(') === 0
            ) {
              ignoreCheckIssue = true;
              activity['error'] = 'error';
              break;
            }
          }

          if(!ignoreCheckIssue) {
            //* Client waiting || Need to call back || Urgent call back
            const numberStep1 = listActivitySameItem.filter(activity => {
              if(activity['column_title'] === 'Client Status') {
                if(activity['value'] &&
                (activity['value']['label']['text'] === 'Need to call back' ||
                activity['value']['label']['text'] === 'Urgent call back')){
                  return true;
                }else{
                  return false;
                }
              }
            }).length;

            if(numberStep1 === 0) {
              let isComplete = false;
              let phone = "";
              let assignTo = "";
              const creationTime = moment(moment(new Date(listActivitySameItem[0]['created_at'])).format('HH:mm:ss'),'HH:mm:ss',);
              
              listActivitySameItem.map(activity => {
                if(activity['column_title'] === 'Phone'){
                  phone = activity['value']['phone']
                }
                if(activity['column_title'] === 'Requested Agent'){
                  assignTo = activity['textual_value']
                }
                
                if(activity['column_title'] === 'Worked By'
                || (activity['column_title'] === 'Client Status' && activity['value'] && activity['value']['label']['text'] === 'Served')) {
                  const completedTime = moment(moment(new Date(activity['created_at'])).format('HH:mm:ss'),'HH:mm:ss',);

                  const returnTime  = completedTime.diff(
                    creationTime,
                    'seconds',
                  );
                  if(!isComplete){
                    activity['waitingTime'] = returnTime;                      
                    activity['type'] = 'Answered';
                    this._importAnswered(autoIssues, activity, listActivitySameItem[0]['created_at'], phone, assignTo);
                  }
                  isComplete = true;
                }
               
              });
            }else if(numberStep1 > 0) {
              let isComplete = false;
              let step1Activity = null;
              let step1ActivityTime = null;
              let numberStep1Count = 0;
              let phone = "";
              let assignTo = "";
              let services = "";

              const createActivity = listActivitySameItem[0];
              const startTime = listActivitySameItem[0]['created_at'];
              listActivitySameItem.forEach(item => {
                
                if(item['column_title'] === 'Phone'){
                  phone = item['value']['phone']
                }
                if(item['column_title'] === 'Requested Agent'){
                  assignTo = item['textual_value']
                }
                if(item['column_title'] === 'Service(s)'){
                  // console.log(listActivitySameItem[i])
                  if(item['textual_value']){
                    services = item['textual_value'];
                  }
                }
              })
              listActivitySameItem.map((activity, index) => {
                
                if(activity['value'] && activity['value']['label'] && (
                  activity['value']['label']['text'] === 'Need to call back' 
                || activity['value']['label']['text'] === 'Urgent call back')) {
                  //* last Client waiting || Need to call back || Urgent call back
                  if (numberStep1Count + 1 === numberStep1){
                    step1Activity = activity;
                    step1ActivityTime = moment(moment(new Date(activity['created_at'])).format('YYYY-MM-DD HH:mm:ss'),'YYYY-MM-DD HH:mm:ss',);
                    numberStep1Count += 1
                  }else {
                    numberStep1Count += 1;
                  }
                }

                //* Case 1
                if(activity['column_title'] === 'Worked By'
                || (activity['column_title'] === 'Client Status' && activity['value'] && activity['value']['label']['text'] === 'Served')) {
                  if(numberStep1Count === numberStep1 && !isComplete) {
                    isComplete = true;
                    const completedActivity = moment(moment(new Date(activity['created_at'])).format('YYYY-MM-DD HH:mm:ss'),'YYYY-MM-DD HH:mm:ss',);

                    const returnTime = completedActivity.diff(
                      step1ActivityTime,
                      'seconds',
                    );
                    activity['returnTime'] = returnTime;
                    activity['type'] = 'CallBack';
                    //* 1 hours
                    if (returnTime >= 60*60) {
                      this._importLongTimeCallBack(
                        autoIssues,
                        step1Activity,
                        listActivitySameItem,
                        returnTime,
                        startTime,
                        phone,
                        assignTo,
                        services
                      );
                    } else {
                      this._importCallBack(autoIssues, activity, startTime, phone, assignTo);
                    }
                  }
                }

                //* Case 2
                if(index === listActivitySameItem.length - 1 && !isComplete) {
                  activity['type'] = 'NotCallBack';
                  this._importNotCallBack(
                    autoIssues,
                    createActivity,
                    listActivitySameItem,
                    phone,
                    assignTo,
                    services
                  );
                }
              });
            }
          }
        }
      }
      if(autoIssues.length > 0){
        for(let i = 0; i< autoIssues.length; i++){
          const newAutoIssue = new AutoIssues();
          newAutoIssue.category = autoIssues[i].category;
          newAutoIssue.type = autoIssues[i].type;
          newAutoIssue.description = autoIssues[i].description;
          newAutoIssue.pulseId = autoIssues[i].pulseId;
          newAutoIssue.waitingTime = autoIssues[i].waitingTime;
          newAutoIssue.returnTime = autoIssues[i].returnTime;
          newAutoIssue.clientName = autoIssues[i].clientName;
          newAutoIssue.issueDate = autoIssues[i].issueDate;
          newAutoIssue.team = autoIssues[i].team;
          newAutoIssue.phone = autoIssues[i].phone;
          newAutoIssue.assignTo = autoIssues[i].assignTo;
          await newAutoIssue.save();
        }
      }
      return autoIssues;
      // console.log(autoIssues);
    } catch (err) {
      console.log(err)
    }
  }

  //!previous version
  public async detectICIssues(data): Promise<any[]> {
    const autoIssues = [];

    const startWork = await this._configVariableRepository.findOne({
      key: 'startWork',
    });

    const startWorkTime = moment(startWork.value, 'HH:mm:ss');

    const arrayData = [...data];
    const grpTeam = _.groupBy(arrayData, 'team');

    for (const team in grpTeam) {
      if (Object.prototype.hasOwnProperty.call(grpTeam, team)) {
        const lstReportInboundCall = grpTeam[team];

        const grpTaskId = _.groupBy(lstReportInboundCall, 'taskId');

        // for (const taskId in grpTaskId) {
        //   try {
        //     if (Object.prototype.hasOwnProperty.call(grpTaskId, taskId)) {
        //       //* start

        //       const lstRowSameTaskId = grpTaskId[taskId];

        //       let ignoreCheckIssue = true;

        //       for (let index = 0; index < lstRowSameTaskId.length; index++) {
        //         const row = lstRowSameTaskId[index];
        //         //* loai bo task tao dau ngay hoac task cu => task truoc
        //         const time = moment(
        //           moment(new Date(row.dateTimeIC)).format('HH:mm:ss'),
        //           'HH:mm:ss',
        //         );

        //         if (
        //           time.isBefore(startWorkTime) ||
        //           row?.taskName
        //             ?.toString()
        //             .toLowerCase()
        //             .indexOf('new call') > -1 ||
        //           row?.taskName
        //             ?.toString()
        //             .toLowerCase()
        //             .indexOf('new voice') > -1 ||
        //           row?.taskName
        //             ?.toString()
        //             .toLowerCase()
        //             .indexOf('[') === 0 ||
        //           row?.taskName
        //             ?.toString()
        //             .toLowerCase()
        //             .indexOf('(') === 0
        //         ) {
        //           ignoreCheckIssue = false;
        //           row['error'] = 'error';
        //           break;
        //         }
        //       }

        //       if (ignoreCheckIssue) {
        //         try {
        //           const yellowRowNumber = lstRowSameTaskId.filter(
        //             item => item.color?.toString().trim().toLowerCase() === 'yellow',
        //           ).length;
                  
        //           if(yellowRowNumber == 0) {
        //             let creationTime = null;

        //             lstRowSameTaskId.map((row) => {
        //               if(row.action?.toString().toLowerCase() === 'create') {
        //                 row['type'] = 'Answered';
        //                 creationTime = moment(moment(new Date(row.dateTimeIC)).format('HH:mm:ss'),'HH:mm:ss',);
        //               }

        //               if(row.color?.toString().toLowerCase() === 'violet' || row.isCompleted?.toLowerCase().trim() === 'yes') {
        //                 if(creationTime !== null) {
        //                   const rowCreationTime = moment(moment(new Date(row.dateTimeIC)).format('HH:mm:ss'),'HH:mm:ss',);
        //                   const returnTime  = rowCreationTime.diff(
        //                     creationTime,
        //                     'minutes',
        //                   );
        //                   row['waitingTime'] = returnTime;
        //                 }
        //               }
        //             });
        //           } else if(yellowRowNumber > 0) {
        //             let createRow = null;
        //             let yellowRowTime = null;
        //             let yellowCount = 0;
        //             let isComplete = false;
        //             let yellowRow = null;

        //             lstRowSameTaskId.map((row, index) => {
        //               if(row.action?.toString().toLowerCase() === 'create') {
        //                 // row['type'] = 'TaskYellow';
        //                 createRow = row;
        //               }

        //               if(row.color?.toString().toLowerCase() === 'yellow') {
        //                 if (yellowCount + 1 === yellowRowNumber){
        //                   yellowRow = row;
        //                   yellowRowTime = moment(moment(new Date(row.dateTimeIC)).format('HH:mm:ss'),'HH:mm:ss',);
        //                   yellowCount += 1
        //                 }else {
        //                   yellowCount += 1;
        //                 }
        //               }

        //               if(row.color?.toString().toLowerCase() === 'violet' || row.isCompleted?.toLowerCase().trim() === 'yes') {
        //                 if(yellowCount === yellowRowNumber && !isComplete) {
        //                   const rowCreationTime = moment(moment(new Date(row.dateTimeIC)).format('HH:mm:ss'),'HH:mm:ss',);

        //                   const returnTime = rowCreationTime.diff(
        //                     yellowRowTime,
        //                     'minutes',
        //                   );
        //                   row['returnTime'] = returnTime;
        //                   row['type'] = 'CallBack';
        //                   isComplete = true;

        //                   //* 1 hours
        //                   if (returnTime >= 60) {
        //                     this._importLongTimeCallBack(
        //                       autoIssues,
        //                       yellowRow,
        //                       lstRowSameTaskId,
        //                       returnTime,
        //                       yellowRowTime,
        //                       "",
        //                       ""
        //                     );
        //                   }
        //                 }
        //               }

        //               if(index === lstRowSameTaskId.length - 1 && !isComplete) {
        //                 row['type'] = 'NotCallBack';
        //                 this._importNotCallBack(
        //                   autoIssues,
        //                   createRow,
        //                   lstRowSameTaskId,
        //                   "",
        //                   ""
        //                 );
        //               }
        //             });
        //           }

        //           if (yellowRowNumber === 0 && violetRowNumber === 1) {
        //             const redRow = lstRowSameTaskId.find(
        //               item =>
        //                 item.action?.toString().toLowerCase() === 'create',
        //             );
        //             const violetRow = lstRowSameTaskId.find(
        //               item => item.color?.toString().toLowerCase() === 'violet',
        //             );

        //             const redRowTime = moment(
        //               moment(new Date(redRow.dateTimeIC)).format('HH:mm:ss'),
        //               'HH:mm:ss',
        //             );
        //             const violetRowTime = moment(
        //               moment(new Date(violetRow.dateTimeIC)).format('HH:mm:ss'),
        //               'HH:mm:ss',
        //             );

        //             const completedRow = lstRowSameTaskId.find(
        //               item => item.isCompleted?.toLowerCase().trim() === 'yes',
        //             );

        //             violetRow['type'] = 'Answered';
        //             if (completedRow !== null && completedRow !== undefined) {
        //               const completedRowTime = moment(
        //                 moment(new Date(completedRow.dateTimeIC)).format('HH:mm:ss'),
        //                 'HH:mm:ss',
        //               );

        //               //* complete before change color
        //               if (completedRowTime.isSameOrBefore(violetRowTime)) {
        //                 if (redRowTime.isSameOrBefore(completedRowTime)) {
        //                   redRow['waitingTime'] = completedRowTime.diff(
        //                     redRowTime,
        //                     'minutes',
        //                   );
        //                 } else if (redRowTime.isSameOrBefore(violetRowTime)) {
        //                   redRow['waitingTime'] = violetRowTime.diff(
        //                     redRowTime,
        //                     'minutes',
        //                   );
        //                 } else {
        //                   const createRow = lstRowSameTaskId.find(
        //                     item =>
        //                       item.action?.toString().toLowerCase() ===
        //                       'create',
        //                   );
        //                   createRow['error'] = 'error';
        //                 }

        //                 //* change color before complete
        //               } else if (
        //                 violetRowTime.isSameOrBefore(completedRowTime)
        //               ) {
        //                 if (redRowTime.isSameOrBefore(violetRowTime)) {
        //                   redRow['waitingTime'] = violetRowTime.diff(
        //                     redRowTime,
        //                     'minutes',
        //                   );
        //                 } else if (
        //                   redRowTime.isSameOrBefore(completedRowTime)
        //                 ) {
        //                   redRow['waitingTime'] = completedRowTime.diff(
        //                     redRowTime,
        //                     'minutes',
        //                   );
        //                 } else {
        //                   const createRow = lstRowSameTaskId.find(
        //                     item =>
        //                       item.action?.toString().toLowerCase() ===
        //                       'create',
        //                   );
        //                   createRow['error'] = 'error';
        //                 }
        //               }
        //             } else {
        //               //* khong co row nao complete
        //               if (redRowTime.isSameOrBefore(violetRowTime)) {
        //                 redRow['waitingTime'] = violetRowTime.diff(
        //                   redRowTime,
        //                   'minutes',
        //                 );
        //               } else {
        //                 const createRow = lstRowSameTaskId.find(
        //                   item =>
        //                     item.action?.toString().toLowerCase() === 'create',
        //                 );
        //                 createRow['error'] = 'error';
        //               }
        //             }
        //           } else if (yellowRowNumber === 1 && violetRowNumber === 1) {
        //             const yellowRow = lstRowSameTaskId.find(
        //               item => item.color?.toString().toLowerCase() === 'yellow',
        //             );
        //             const violetRow = lstRowSameTaskId.find(
        //               item => item.color?.toString().toLowerCase() === 'violet',
        //             );

        //             const yellowRowTime = moment(
        //               moment(new Date(yellowRow.dateTimeIC)).format('HH:mm:ss'),
        //               'HH:mm:ss',
        //             );
        //             const violetRowTime = moment(
        //               moment(new Date(violetRow.dateTimeIC)).format('HH:mm:ss'),
        //               'HH:mm:ss',
        //             );

        //             const completedRow = lstRowSameTaskId.find(
        //               item => item.isCompleted?.toLowerCase().trim() === 'yes',
        //             );

        //             violetRow['type'] = 'CallBack';

        //             if (completedRow !== null && completedRow !== undefined) {
        //               const completedRowTime = moment(
        //                 moment(new Date(completedRow.dateTimeIC)).format('HH:mm:ss'),
        //                 'HH:mm:ss',
        //               );

        //               if (completedRowTime.isSameOrBefore(violetRowTime)) {
        //                 if (yellowRowTime.isSameOrBefore(completedRowTime)) {
        //                   const returnTime = completedRowTime.diff(
        //                     yellowRowTime,
        //                     'minutes',
        //                   );
        //                   yellowRow['returnTime'] = returnTime;

        //                   //* 1 hours
        //                   if (returnTime >= 60) {
        //                     this._importLongTimeCallBack(
        //                       autoIssues,
        //                       yellowRow,
        //                       lstRowSameTaskId,
        //                       returnTime,
        //                     );
        //                   }
        //                 } else if (
        //                   yellowRowTime.isSameOrBefore(violetRowTime)
        //                 ) {
        //                   const returnTime = violetRowTime.diff(
        //                     yellowRowTime,
        //                     'minutes',
        //                   );
        //                   //* 1 hours
        //                   if (returnTime >= 60) {
        //                     this._importLongTimeCallBack(
        //                       autoIssues,
        //                       yellowRow,
        //                       lstRowSameTaskId,
        //                       returnTime,
        //                     );
        //                   }
        //                 } else {
        //                   const createRow = lstRowSameTaskId.find(
        //                     item =>
        //                       item.action?.toString().toLowerCase() ===
        //                       'create',
        //                   );
        //                   createRow['error'] = 'error';
        //                 }
        //               } else {
        //                 if (yellowRowTime.isSameOrBefore(violetRowTime)) {
        //                   const returnTime = violetRowTime.diff(
        //                     yellowRowTime,
        //                     'minutes',
        //                   );
        //                   yellowRow['returnTime'] = returnTime;
        //                   if (returnTime >= 60) {
        //                     this._importLongTimeCallBack(
        //                       autoIssues,
        //                       yellowRow,
        //                       lstRowSameTaskId,
        //                       returnTime,
        //                     );
        //                   }
        //                 } else if (
        //                   yellowRowTime.isSameOrBefore(completedRowTime)
        //                 ) {
        //                   const returnTime = completedRowTime.diff(
        //                     yellowRowTime,
        //                     'minutes',
        //                   );
        //                   yellowRow['returnTime'] = returnTime;

        //                   if (returnTime >= 60) {
        //                     this._importLongTimeCallBack(
        //                       autoIssues,
        //                       yellowRow,
        //                       lstRowSameTaskId,
        //                       returnTime,
        //                     );
        //                   }
        //                 } else {
        //                   const createRow = lstRowSameTaskId.find(
        //                     item =>
        //                       item.action?.toString().toLowerCase() ===
        //                       'create',
        //                   );
        //                   createRow['error'] = 'error';
        //                 }
        //               }
        //             } else {
        //               //* completed row is null
        //               if (yellowRowTime.isSameOrBefore(violetRowTime)) {
        //                 const returnTime = yellowRowTime.diff(
        //                   violetRow,
        //                   'minutes',
        //                 );
        //                 yellowRow['returnTime'] = returnTime;
        //                 if (returnTime >= 60) {
        //                   this._importLongTimeCallBack(
        //                     autoIssues,
        //                     yellowRow,
        //                     lstRowSameTaskId,
        //                     returnTime,
        //                   );
        //                 }
        //               } else {
        //                 const createRow = lstRowSameTaskId.find(
        //                   item =>
        //                     item.action?.toString().toLowerCase() === 'create',
        //                 );
        //                 createRow['error'] = 'error';
        //               }
        //             }
        //           } else if (yellowRowNumber === 0 && violetRowNumber === 0) {
        //             const redRow = lstRowSameTaskId.find(
        //               item =>
        //                 item.action?.toString().toLowerCase() === 'create',
        //             );
        //             const completedRow = lstRowSameTaskId.find(
        //               item => item.isCompleted?.toLowerCase().trim() === 'yes',
        //             );
        //             redRow['type'] = 'NotCallBack';
        //             if (completedRow === undefined || completedRow === null) {
        //               this._importNotCallBack(
        //                 autoIssues,
        //                 redRow,
        //                 lstRowSameTaskId,
        //               );
        //             }
        //           } else if (yellowRowNumber === 1 && violetRowNumber === 0) {
        //             const yellowRow = lstRowSameTaskId.find(
        //               item => item.color?.toString().toLowerCase() === 'yellow',
        //             );
        //             const completedRow = lstRowSameTaskId.find(
        //               item => item.isCompleted?.toLowerCase().trim() === 'yes',
        //             );

        //             yellowRow['type'] = 'NotCallBack';
        //             if (completedRow === undefined || completedRow === null) {
        //               this._importNotCallBack(
        //                 autoIssues,
        //                 yellowRow,
        //                 lstRowSameTaskId,
        //               );
        //             }
        //           } else {
        //             const createRow = lstRowSameTaskId.find(
        //               item =>
        //                 item.action?.toString().toLowerCase() === 'create',
        //             );
        //             createRow['error'] = 'error';
        //             const completedRow = lstRowSameTaskId.find(
        //               item => item.isCompleted?.toLowerCase().trim() === 'yes',
        //             );

        //             const violetRowNumber = lstRowSameTaskId.filter(
        //               item => item.color?.toString().toLowerCase() === 'violet',
        //             ).length;
        //             const yellowRowNumber = lstRowSameTaskId.filter(
        //               item => item.color?.toString().toLowerCase() === 'yellow',
        //             ).length;

        //             if (yellowRowNumber > 0 && violetRowNumber > 0) {
        //               createRow['type'] = 'CallBack';
        //             } else if (yellowRowNumber > 0 && violetRowNumber === 0) {
        //               createRow['type'] = 'NotCallBack';
        //               if (completedRow === undefined || completedRow === null) {
        //                 this._importNotCallBack(
        //                   autoIssues,
        //                   createRow,
        //                   lstRowSameTaskId,
        //                 );
        //               }
        //             } else if (yellowRowNumber < 0 && violetRowNumber > 0) {
        //               createRow['type'] = 'Answered';
        //             }
        //           }

        //         }catch(error) {
        //           continue;
        //         }
        //       }
        //     }
        //   } catch (error) {
        //     throw new Error(JSON.stringify(error));
        //   }
        // }

        const allCase = Object.keys(_.groupBy(lstReportInboundCall, 'taskId'))
          .length;
        const errorCase = lstReportInboundCall.filter(
          item => item['error'] === 'error',
        ).length;
        const totalCase = allCase - errorCase;
        const countAnsweredCase = lstReportInboundCall.filter(
          item => item['type'] === 'Answered',
        ).length;
        const takeMessCase = totalCase - countAnsweredCase;

        if (takeMessCase > totalCase / 2) {
          this._importTookMessage(
            autoIssues,
            lstReportInboundCall[lstReportInboundCall.length - 1],
            takeMessCase,
            totalCase,
            team,
          );
        }

        //* end
      }
    }

    return autoIssues;
  }

  private _importLongTimeCallBack(
    autoIssues: any[],
    yellowRaw: any,
    lstRowSameTaskId: any[],
    returnTime: any,
    startTime: any,
    phone: any,
    assignTo: any,
    services: any
  ) {
    // console.log(lstRowSameTaskId);
    let category = null;
    let issueDate = null;
    let type = null;
    let description = null;
    let boardName = "";
    if(yellowRaw['board_id'] === 1483255419){
      boardName = "hlt";
    }
    if(yellowRaw['board_id'] === 1483261623){
      boardName = "personal";
    }
    if(yellowRaw['board_id'] === 1483259420){
      boardName = "commercial";
    }
    const managerReply = '';
    //*Format phone number
    let phoneFormat = '';
    if(phone.length === 11){
      phoneFormat = `(${phone.slice(1,4)}) ${phone.slice(4,7)}-${phone.slice(7)}`
    }
    if(phone.length === 10){
      phoneFormat = `(${phone.slice(0,3)}) ${phone.slice(3,6)}-${phone.slice(6)}`
    }
    if(phone.length !== 10 && phone.length !== 11){
      phoneFormat = phone
    }

    category = 'Inbound Call & Ringcentral';
    issueDate = startTime;
    type = 'Long time call back';

    const creationUserId = yellowRaw['creationUserId'];
    const lastModifiedUserId = yellowRaw['lastModifiedUserId'];

    const timeCalled = moment(
      new Date(lstRowSameTaskId[0]['created_at']),
    ).format('h:mm A');

    const agentRequestedRaw = lstRowSameTaskId.find(
      item => item.assignTo !== '' && item.assignTo !== null,
    );

    if (agentRequestedRaw !== null && agentRequestedRaw !== undefined) {
      description =
        yellowRaw['pulse_name'] + ' - ' +
        (phone ? phoneFormat : '') +
        (assignTo ? ' - req ' +
        assignTo : '') +
        (services ? ' - Service ' +
        services : '') +
        ' - called at ' +
        timeCalled +
        ' - called after ' +
        Math.floor(returnTime / 3600) +
        ' hours ' +
        Math.floor((returnTime % 3600)/60) +
        ' mins.\r\n Reason: ';
    } else {
      description =
        yellowRaw['clientName'] + ' - ' +
        (phone ? phoneFormat : '') +
        (services ? ' - Service ' +
        services : '') +
        ' - called at ' +
        timeCalled +
        ' - called after ' +
        Math.floor(returnTime / 3600) +
        ' hours ' +
        Math.floor((returnTime % 3600)/60) +
        ' mins.\r\n Reason: ';
    }

    autoIssues.push({
      team: boardName,
      category: category,
      issueDate: issueDate,
      agent: null,
      type: type,
      description: description,
      managerReply: managerReply,
      creationUserId: creationUserId,
      lastModifiedUserId: lastModifiedUserId,
      pulseId: yellowRaw['pulse_id'],
      waitingTime: yellowRaw['waitingTime'],
      returnTime: returnTime,
      clientName: yellowRaw['pulse_name'],
      phone: phone,
      assignTo: assignTo
    });
  }

  private _importNotCallBack(
    autoIssues: any[],
    raw: any,
    lstRowSameTaskId: any[],
    phone: any,
    assignTo: any,
    services: any
  ) {
    // console.log(lstRowSameTaskId);
    let category = null;
    let issueDate = null;
    let type = null;
    let description = null;
    const managerReply = '';
    let boardName = "";
    if(raw['board_id'] === 1483255419){
      boardName = "hlt";
    }
    if(raw['board_id'] === 1483261623){
      boardName = "personal";
    }
    if(raw['board_id'] === 1483259420){
      boardName = "commercial";
    }

    category = 'Inbound Call & Ringcentral';
    issueDate = raw['created_at'];

    type = 'Not call back';

    const creationUserId = raw['creationUserId'];
    const lastModifiedUserId = raw['lastModifiedUserId'];

    const timeCalled = moment(
      new Date(lstRowSameTaskId[0]['created_at']),
    ).format('h:mm A');

    const agentRequestedRaw = lstRowSameTaskId.find(
      item => item.assignTo !== '' && item.assignTo !== null,
    );

    //*Format phone number
    let phoneFormat = '';
    if(phone.length === 11){
      phoneFormat = `(${phone.slice(1,4)}) ${phone.slice(4,7)}-${phone.slice(7)}`
    }
    if(phone.length === 10){
      phoneFormat = `(${phone.slice(0,3)}) ${phone.slice(3,6)}-${phone.slice(6)}`
    }
    if(phone.length !== 10 && phone.length !== 11){
      phoneFormat = phone
    }

    if (agentRequestedRaw !== null && agentRequestedRaw !== undefined) {
      description =
        raw['pulse_name'] + ' - ' +
        (phone ? phoneFormat : '') +
        (assignTo ? ' - req ' +
        assignTo : '' ) +
        (services ? ' - Service ' +
        services : '') +
        ' - called at ' +
        timeCalled +
        ' - not call back.\r\n Reason: ';
    } else {
      description =
        raw['pulse_name'] + ' - ' +
        (phone ? phoneFormat: '') +
        (services ? ' - Service ' +
        services : '') +
        ' - called at ' +
        timeCalled +
        ' - not call back.\r\n Reason: ';
    }

    autoIssues.push({
      team: boardName,
      category: category,
      issueDate: issueDate,
      agent: null,
      type: type,
      description: description,
      managerReply: managerReply,
      creationUserId: creationUserId,
      lastModifiedUserId: lastModifiedUserId,
      pulseId: raw['pulse_id'],
      waitingTime: null,
      returnTime: null,
      clientName: raw['pulse_name'],
      phone: phone,
      assignTo: assignTo
    });
  }

  private _importTookMessage(
    autoIssues: any[],
    raw: any,
    takeMessage: number,
    totalCase: number,
    team: string,
  ) {
    let category = null;
    let issueDate = null;
    let type = null;
    let description = null;
    const managerReply = '';

    category = 'Inbound Call & Ringcentral';
    issueDate = raw['dateTimeIC'];
    type = 'Take message much';

    const creationUserId = raw['creationUserId'];
    const lastModifiedUserId = raw['lastModifiedUserId'];

    let teamDesc = '';
    if (team.toLowerCase().includes('health')) {
      teamDesc = 'Health';
    } else if (team.toLowerCase().includes('life')) {
      teamDesc = 'Life';
    } else if (team.toLowerCase().includes('tax')) {
      teamDesc = 'Tax';
    } else if (team.toLowerCase().includes('personal')) {
      teamDesc = 'Personal';
    } else if (team.toLowerCase().includes('commercial')) {
      teamDesc = 'Commercial';
    }

    description =
      teamDesc +
      ' Department takes message: ' +
      takeMessage +
      ' / ' +
      totalCase;

    autoIssues.push({
      team: raw['team'],
      category: category,
      issueDate: issueDate,
      agent: null,
      type: type,
      description: description,
      managerReply: managerReply,
      creationUserId: creationUserId,
      lastModifiedUserId: lastModifiedUserId,
    });
  }

  private _importAnswered(
    autoIssues: any[],
    raw: any,
    creationTime: any,
    phone: any,
    assignTo: any
  ) {
    // console.log(raw);
    let boardName = "";
    if(raw['board_id'] === 1483255419){
      boardName = "hlt";
    }
    if(raw['board_id'] === 1483261623){
      boardName = "personal";
    }
    if(raw['board_id'] === 1483259420){
      boardName = "commercial";
    }
    autoIssues.push({
      team: boardName,
      category: '',
      issueDate: creationTime,
      agent: null,
      type: raw['type'],
      description: '',
      managerReply: '',
      creationUserId: '',
      lastModifiedUserId: '',
      pulseId: raw['pulse_id'],
      waitingTime: raw['waitingTime'],
      returnTime: null,
      clientName: raw['pulse_name'],
      phone: phone,
      assignTo: assignTo
    });
  }

  private _importCallBack(
    autoIssues: any[],
    raw: any,
    startTime: any,
    phone: any,
    assignTo: any
  ) {
    // console.log(raw['pulse_id']);
    let boardName = "";
    if(raw['board_id'] === 1483255419){
      boardName = "hlt";
    }
    if(raw['board_id'] === 1483261623){
      boardName = "personal";
    }
    if(raw['board_id'] === 1483259420){
      boardName = "commercial";
    }
    autoIssues.push({
      team: boardName,
      category: '',
      issueDate: startTime,
      agent: null,
      type: raw['type'],
      description: '',
      managerReply: '',
      creationUserId: '',
      lastModifiedUserId: '',
      pulseId: raw['pulse_id'],
      waitingTime: null,
      returnTime: raw['returnTime'],
      clientName: raw['pulse_name'],
      phone: phone,
      assignTo: assignTo
    });
  }

  public async detectGlipIssues(data): Promise<any[]> {
    const autoIssues: any[] = [];

    for (const key in data) {
      if (Object.prototype.hasOwnProperty.call(data, key)) {   
        const element = data[key];
        //*Converse created time
        let converseTime = '';
        if(element['createdTime']){
          converseTime = moment(element['createdTime'],'HH:mm:ss').format('hh:mm:ss A');
        }
        

        //* glip element's column
        const dateGlipMaster: string = element['dateGlipMaster'].add(7, 'hours');
        const createdTime = element['createdTime'];
        const servedTime = element['servedTime'];
        const completedTime = element['completedTime'];
        const finalStatus = element['finalStatus'];
        const team: string = element['team'];
        const rate: string = element['rate'];
        const serviceNeeded: string = element['serviceNeeded'];
        const services: string = element['services'];
        const address: string = element['address'];
        const needFollowUp: string = element['needFollowUp'];
        const phone: string = element['phone'];
        const clientSign: string = element['clientSign'];
        const agentId = element['agent'];
        const creationUserId = element['creationUserId'];
        const lastModifiedUserId = element['lastModifiedUserId'];
        const sheet = element['sheet'];
        let agentName = '';

        if (agentId !== null && agentId !== '') {
          agentName = element['agentName'];
        }

        //* waiting time
        //* minutes
        let waitingTime = null;

        //* serve duration
        //* minutes
        let servedDuration = null;

        //* issue
        let issue = '';

        if (team !== '') {
          //* start compare data
          const teamLowerCase: string = team.toString().toLowerCase();
          if (
            teamLowerCase.includes('health') ||
            teamLowerCase.includes('life') ||
            teamLowerCase.includes('tax') ||
            teamLowerCase.includes('personal') ||
            teamLowerCase.includes('commercial')
          ) {
            //* 0 1 1
            if (
              (createdTime === '' || createdTime === null) &&
              !(servedTime === '' || servedTime === null) &&
              !(completedTime === '' || completedTime === null)
            ) {
              servedDuration = moment(completedTime, ['HH:mm:ss']).diff(
                moment(servedTime, ['HH:mm:ss']),
                'minutes',
              );

              if (servedDuration > 120) {
                //* 2 hours
                issue += 'IN102';
              }
            }
            //* 1 0 0
            else if (
              !(createdTime === '' || createdTime === null) &&
              (servedTime === '' || servedTime === null) &&
              (completedTime === '' || completedTime === null)
            ) {
              issue += 'IN107';
            }
            //* 1 1 *
            else if (
              !(createdTime === '' || createdTime === null) &&
              !(servedTime === '' || servedTime === null)
            ) {
              waitingTime =
                moment(servedTime, ['HH:mm:ss']).diff(
                  moment(createdTime, ['HH:mm:ss']),
                  'seconds',
                ) / 60;
              const lateTime = Math.floor(waitingTime/1);
              if (lateTime >= 15) {
                //* 15 minute
                issue += 'IN101';
              }

              //* 1 1 1
              if (!(completedTime === '' || completedTime === null)) {
                const servedDurationNext = moment(completedTime, [
                  'HH:mm:ss',
                ]).diff(moment(servedTime, ['HH:mm:ss']), 'minutes');

                if (servedDurationNext > 120) {
                  //* 2 hours
                  issue += 'IN102';
                }
              }
            }

            if (finalStatus === '') {
              issue += 'IN103';
            }

            if (
              teamLowerCase.includes('health') ||
              teamLowerCase.includes('life') ||
              teamLowerCase.includes('tax')
            ) {
              if (rate.trim() === '1' || rate.trim() === '2') {
                issue += 'IN104';
              }

              if (rate.toLowerCase().includes('not rate')) {
                issue += 'IN105';
              }

              if (
                (serviceNeeded === '' || serviceNeeded === null) &&
                (address === '' || address === null) &&
                (phone === '' || phone === null) &&
                (needFollowUp === '' || needFollowUp === null) &&
                (rate === '' || rate === null) &&
                (clientSign === '' || clientSign === null)
              ) {
                issue += 'IN106';
              }
            }

            //* start prepare issue
            const category = 'Front Desk & Transfer';

            if (issue.includes('IN101')) {
              if (
                teamLowerCase.includes('health') ||
                teamLowerCase.includes('life') ||
                teamLowerCase.includes('tax')
              ) {
                const type = 'Client wait long time';
                const managerReply = '';
                //* description
                let timeString = '';
                if (waitingTime !== null) {
                  const hours = Math.floor(waitingTime / 60);
                  const minutes = Math.floor(waitingTime / 1) % 60;

                  if (hours !== 0) {
                    timeString = hours + ' hours ' + minutes + ' mins';
                  } else {
                    timeString = minutes + ' mins';
                  }
                }

                const description =
                  element['name'] +
                  ' - came at ' +
                  converseTime +
                  ' - ' +
                  services +
                  ' - ' +
                  agentName +
                  ' helped' +
                  ' - Status: ' +
                  finalStatus +
                  ' - waited ' +
                  timeString +
                  '.\r\n Reason: ';

                autoIssues.push({
                  team: team,
                  category: category,
                  issueDate: dateGlipMaster,
                  assignTo: agentName,
                  type: type,
                  description: description,
                  managerReply: managerReply,
                  creationUserId: creationUserId,
                  lastModifiedUserId: lastModifiedUserId,
                  sheet: sheet
                });
              }
            }

            if (issue.includes('IN102')) {
              const type = 'No status after 2 hours';
              const managerReply = '';

              //* description
              let timeString = '';
              if (servedDuration === null) {
                const hours = Math.floor(servedDuration / 60);
                const minutes = servedDuration % 60;

                if (hours !== 0) {
                  timeString = hours + ' hours ' + minutes + ' mins';
                } else {
                  timeString = minutes + ' mins';
                }
              }

              const description =
                element['name'] +
                ' - came at ' +
                converseTime +
                ' - ' +
                services +
                ' - ' +
                agentName +
                ' helped' +
                ' - Status: ' +
                finalStatus +
                ' - Updated status after ' +
                timeString +
                '.\r\n Reason: ';

              autoIssues.push({
                team: team,
                category: category,
                issueDate: dateGlipMaster,
                assignTo: agentName,
                type: type,
                description: description,
                managerReply: managerReply,
                creationUserId: creationUserId,
                lastModifiedUserId: lastModifiedUserId,
                sheet: sheet
              });
            }

            if (issue.includes('IN103')) {
              const type = 'Not update final status';
              const managerReply = '';

              //* description
              const description =
                element['name'] +
                ' - came at ' +
                converseTime +
                ' - ' +
                services +
                ' - ' +
                agentName +
                ' served - Not update final status.\r\n Reason: ';

              autoIssues.push({
                team: team,
                category: category,
                issueDate: dateGlipMaster,
                assignTo: agentName,
                type: type,
                description: description,
                managerReply: managerReply,
                creationUserId: creationUserId,
                lastModifiedUserId: lastModifiedUserId,
                sheet: sheet
              });
            }

            if (issue.includes('IN104')) {
              const type = 'Rate ' + rate;
              const managerReply = '';

              //* description
              const description =
                element['name'] +
                ' - came at ' +
                converseTime +
                ' - ' +
                services +
                ' - ' +
                agentName +
                ' served - Rate: ' +
                rate +
                '.\r\n Reason: ';

              autoIssues.push({
                team: team,
                category: category,
                issueDate: dateGlipMaster,
                assignTo: agentName,
                type: type,
                description: description,
                managerReply: managerReply,
                creationUserId: creationUserId,
                lastModifiedUserId: lastModifiedUserId,
                sheet: sheet
              });
            }

            if (issue.includes('IN105')) {
              const type = 'Client not rate CSA Form';
              const managerReply = '';

              //* description
              const description =
                element['name'] +
                ' - came at ' +
                converseTime +
                ' - ' +
                services +
                ' - ' +
                agentName +
                ' served. Status: ' +
                finalStatus +
                '.\r\n Reason: ';

              autoIssues.push({
                team: team,
                category: category,
                issueDate: dateGlipMaster,
                assignTo: agentName,
                type: type,
                description: description,
                managerReply: managerReply,
                creationUserId: creationUserId,
                lastModifiedUserId: lastModifiedUserId,
                sheet: sheet
              });
            }

            if (issue.includes('IN106')) {
              const type = 'No Form CSA';
              const managerReply = '';

              //* description
              const description =
                element['name'] +
                ' - came at ' +
                converseTime +
                ' - ' +
                services +
                ' - ' +
                agentName +
                ' served. Status: ' +
                finalStatus +
                '.\r\n Reason: ';

              autoIssues.push({
                team: team,
                category: category,
                issueDate: dateGlipMaster,
                assignTo: agentName,
                type: type,
                description: description,
                managerReply: managerReply,
                creationUserId: creationUserId,
                lastModifiedUserId: lastModifiedUserId,
                sheet: sheet
              });
            }

            if (issue.includes('IN107')) {
              const type = 'Client Left';
              const managerReply = '';

              //* description
              const description =
                element['name'] +
                ' - came at ' +
                converseTime +
                ' - ' +
                services +
                ' - Client left.\r\n Reason: ';

              autoIssues.push({
                team: team,
                category: category,
                issueDate: dateGlipMaster,
                assignTo: agentName,
                type: type,
                description: description,
                managerReply: managerReply,
                creationUserId: creationUserId,
                lastModifiedUserId: lastModifiedUserId,
                sheet: sheet
              });
            }
          }
        } else {
          continue;
        }
      }
    }

    return autoIssues;
  }

  public async _importICData(data, dataIssue) {
    const autoIssues = [];

    const itemsGroup = _.groupBy(data, 'pulse_id');

    for (const itemId in itemsGroup){
      const listActivitySameItem:any[] = itemsGroup[itemId];
      let durationChecked = false;
      let issueItem;
      dataIssue.forEach(element => {
        if(itemsGroup[itemId][0]['pulse_id'] === element.pulseId){
          issueItem = element;
        }
      });

      if(listActivitySameItem.length > 1) {
        listActivitySameItem.sort((item1, item2) => {
          const compareTime = new Date(item1['created_at']).getTime() - new Date(item2['created_at']).getTime();
          return compareTime;
        });
      }
      for(let i = 0; i< listActivitySameItem.length; i++){
        let boardName = "";
        if(listActivitySameItem[i]['board_id'] === 1483255419){
          boardName = "hlt";
        }
        if(listActivitySameItem[i]['board_id'] === 1483261623){
          boardName = "personal";
        }
        if(listActivitySameItem[i]['board_id'] === 1483259420){
          boardName = "commercial";
        }

        if(listActivitySameItem[i]['column_title'] === 'Timer'){
          // console.log(listActivitySameItem[i])
          if(listActivitySameItem[i]['value'] && listActivitySameItem[i]['value']['duration']){
            autoIssues.push({
              boardName: boardName,
              pulseId: listActivitySameItem[i]['pulse_id'],
              taskName: listActivitySameItem[i]['pulse_name'],
              clientStatus: '',
              phone: '',
              service: '',
              line: '',
              description: '',
              requestedAgent: '',
              timer: listActivitySameItem[i]['value']['duration'],
              workBy: '',
              alertDepartment: '',
              lastUpdate: '',
              creationLog: '',
              iCDate: listActivitySameItem[i]['created_at'],
              duration: ''
            })
          }
        }
        if(listActivitySameItem[i]['column_title'] === 'Worked By'){
          // console.log(listActivitySameItem[i])
          if(listActivitySameItem[i]['textual_value']){
            autoIssues.push({
              boardName: boardName,
              pulseId: listActivitySameItem[i]['pulse_id'],
              taskName: listActivitySameItem[i]['pulse_name'],
              clientStatus: '',
              phone: '',
              service: '',
              line: '',
              description: '',
              requestedAgent: '',
              timer: '',
              workBy: listActivitySameItem[i]['textual_value'],
              alertDepartment: '',
              lastUpdate: '',
              creationLog: '',
              iCDate: listActivitySameItem[i]['created_at'],
              duration: ''
            })
          }
          
        }
        if(listActivitySameItem[i]['column_title'] === 'Client Status'){
          // console.log(listActivitySameItem[i])
          if(listActivitySameItem[i]['value'] && listActivitySameItem[i]['value']['label'] && listActivitySameItem[i]['value']['label']['text']){
            if(issueItem && !durationChecked){
              if(issueItem.type === 'CallBack'){
                durationChecked = true;
                autoIssues.push({
                  boardName: boardName,
                  pulseId: listActivitySameItem[i]['pulse_id'],
                  taskName: listActivitySameItem[i]['pulse_name'],
                  clientStatus: listActivitySameItem[i]['value']['label']['text'],
                  phone: '',
                  service: '',
                  line: '',
                  description: '',
                  requestedAgent: '',
                  timer: '',
                  workBy: '',
                  alertDepartment: '',
                  lastUpdate: '',
                  creationLog: '',
                  iCDate: listActivitySameItem[i]['created_at'],
                  duration: issueItem.returnTime
                })
              }
              if(issueItem.type === 'Answered'){
                durationChecked = true;
                autoIssues.push({
                  boardName: boardName,
                  pulseId: listActivitySameItem[i]['pulse_id'],
                  taskName: listActivitySameItem[i]['pulse_name'],
                  clientStatus: listActivitySameItem[i]['value']['label']['text'],
                  phone: '',
                  service: '',
                  line: '',
                  description: '',
                  requestedAgent: '',
                  timer: '',
                  workBy: '',
                  alertDepartment: '',
                  lastUpdate: '',
                  creationLog: '',
                  iCDate: listActivitySameItem[i]['created_at'],
                  duration: issueItem.waitingTime
                })
              }
              if(issueItem.type === 'Long time call back'){
                durationChecked = true;
                autoIssues.push({
                  boardName: boardName,
                  pulseId: listActivitySameItem[i]['pulse_id'],
                  taskName: listActivitySameItem[i]['pulse_name'],
                  clientStatus: listActivitySameItem[i]['value']['label']['text'],
                  phone: '',
                  service: '',
                  line: '',
                  description: '',
                  requestedAgent: '',
                  timer: '',
                  workBy: '',
                  alertDepartment: '',
                  lastUpdate: '',
                  creationLog: '',
                  iCDate: listActivitySameItem[i]['created_at'],
                  duration: issueItem.returnTime
                })
              }
              if(issueItem.type !== 'Long time call back' &&
              issueItem.type !== 'Answered' &&
              issueItem.type !== 'CallBack'){
                autoIssues.push({
                  boardName: boardName,
                  pulseId: listActivitySameItem[i]['pulse_id'],
                  taskName: listActivitySameItem[i]['pulse_name'],
                  clientStatus: listActivitySameItem[i]['value']['label']['text'],
                  phone: '',
                  service: '',
                  line: '',
                  description: '',
                  requestedAgent: '',
                  timer: '',
                  workBy: '',
                  alertDepartment: '',
                  lastUpdate: '',
                  creationLog: '',
                  iCDate: listActivitySameItem[i]['created_at'],
                  duration: ''
                })
              }
            }else{
              autoIssues.push({
                boardName: boardName,
                pulseId: listActivitySameItem[i]['pulse_id'],
                taskName: listActivitySameItem[i]['pulse_name'],
                clientStatus: listActivitySameItem[i]['value']['label']['text'],
                phone: '',
                service: '',
                line: '',
                description: '',
                requestedAgent: '',
                timer: '',
                workBy: '',
                alertDepartment: '',
                lastUpdate: '',
                creationLog: '',
                iCDate: listActivitySameItem[i]['created_at'],
                duration: ''
              })
            }
          };
        }
        if(listActivitySameItem[i]['column_title'] === 'Line'){
          // console.log(listActivitySameItem[i])
          if(listActivitySameItem[i]['value'] && listActivitySameItem[i]['value']['value']){
            autoIssues.push({
              boardName: boardName,
              pulseId: listActivitySameItem[i]['pulse_id'],
              taskName: listActivitySameItem[i]['pulse_name'],
              clientStatus: '',
              phone: '',
              service: '',
              line: listActivitySameItem[i]['value']['value'],
              description: '',
              requestedAgent: '',
              timer: '',
              workBy: '',
              alertDepartment: '',
              lastUpdate: '',
              creationLog: '',
              iCDate: listActivitySameItem[i]['created_at'],
              duration: ''
            })
          }
        }
        if(listActivitySameItem[i]['column_title'] === 'Alert Deparment'){
          // console.log(listActivitySameItem[i])
          if(listActivitySameItem[i]['textual_value']){
            autoIssues.push({
              boardName: boardName,
              pulseId: listActivitySameItem[i]['pulse_id'],
              taskName: listActivitySameItem[i]['pulse_name'],
              clientStatus: '',
              phone: '',
              service: '',
              line: '',
              description: '',
              requestedAgent: '',
              timer: '',
              workBy: '',
              alertDepartment: listActivitySameItem[i]['textual_value'],
              lastUpdate: '',
              creationLog: '',
              iCDate: listActivitySameItem[i]['created_at'],
              duration: ''
            })
          }
          
        }
        if(listActivitySameItem[i]['column_title'] === 'Requested Agent'){
          // console.log(listActivitySameItem[i])
          if(listActivitySameItem[i]['textual_value']){
            autoIssues.push({
              boardName: boardName,
              pulseId: listActivitySameItem[i]['pulse_id'],
              taskName: listActivitySameItem[i]['pulse_name'],
              clientStatus: '',
              phone: '',
              service: '',
              line: '',
              description: '',
              requestedAgent: listActivitySameItem[i]['textual_value'],
              timer: '',
              workBy: '',
              alertDepartment: '',
              lastUpdate: '',
              creationLog: '',
              iCDate: listActivitySameItem[i]['created_at'],
              duration: ''
            })
          }
          
        }
        if(listActivitySameItem[i]['column_title'] === 'Phone'){
          // console.log(listActivitySameItem[i])
          if(listActivitySameItem[i]['value']['phone']){
            autoIssues.push({
              boardName: boardName,
              pulseId: listActivitySameItem[i]['pulse_id'],
              taskName: listActivitySameItem[i]['pulse_name'],
              clientStatus: '',
              phone: listActivitySameItem[i]['value']['phone'],
              service: '',
              line: '',
              description: '',
              requestedAgent: '',
              timer: '',
              workBy: '',
              alertDepartment: '',
              lastUpdate: '',
              creationLog: '',
              iCDate: listActivitySameItem[i]['created_at'],
              duration: ''
            })
          }
          
        }
        if(listActivitySameItem[i]['column_title'] === 'Service(s)'){
          // console.log(listActivitySameItem[i])
          if(listActivitySameItem[i]['textual_value']){
            autoIssues.push({
              boardName: boardName,
              pulseId: listActivitySameItem[i]['pulse_id'],
              taskName: listActivitySameItem[i]['pulse_name'],
              clientStatus: '',
              phone: '',
              service: listActivitySameItem[i]['textual_value'],
              line: '',
              description: '',
              requestedAgent: '',
              timer: '',
              workBy: '',
              alertDepartment: '',
              lastUpdate: '',
              creationLog: '',
              iCDate: listActivitySameItem[i]['created_at'],
              duration: ''
            })
          }
        }
        if(listActivitySameItem[i]['column_title'] === 'Description'){
          // console.log(listActivitySameItem[i])
          if(listActivitySameItem[i]['textual_value']){
            autoIssues.push({
              boardName: boardName,
              pulseId: listActivitySameItem[i]['pulse_id'],
              taskName: listActivitySameItem[i]['pulse_name'],
              clientStatus: '',
              phone: '',
              service: '',
              line: '',
              description: listActivitySameItem[i]['textual_value'],
              requestedAgent: '',
              timer: '',
              workBy: '',
              alertDepartment: '',
              lastUpdate: '',
              creationLog: '',
              iCDate: listActivitySameItem[i]['created_at'],
              duration: ''
            })
          }
        }
        else{
          if(listActivitySameItem[i]['column_title'] !== 'Description'
          && listActivitySameItem[i]['column_title'] !== 'Service(s)'
          && listActivitySameItem[i]['column_title'] !== 'Phone'
          && listActivitySameItem[i]['column_title'] !== 'Requested Agent'
          && listActivitySameItem[i]['column_title'] !== 'Alert Deparment'
          && listActivitySameItem[i]['column_title'] !== 'Line'
          && listActivitySameItem[i]['column_title'] !== 'Worked By'
          && listActivitySameItem[i]['column_title'] !== 'Client Status'
          && listActivitySameItem[i]['column_title'] !== 'Timer'){
            console.log(listActivitySameItem[i]);
          }
        }
      }
      // console.log(listActivitySameItem);
    }
    if(autoIssues.length > 0){
      for(let i = 0; i< autoIssues.length; i++){
        const newAutoIssue = new InboundCallActivities();
        newAutoIssue.pulseId = autoIssues[i].pulseId;
        newAutoIssue.taskName = autoIssues[i].taskName;
        newAutoIssue.phone = autoIssues[i].phone;
        newAutoIssue.clientStatus = autoIssues[i].clientStatus;
        newAutoIssue.description = autoIssues[i].description;
        newAutoIssue.pulseId = autoIssues[i].pulseId;
        newAutoIssue.service = autoIssues[i].service;
        newAutoIssue.line = autoIssues[i].line;
        newAutoIssue.requestedAgent = autoIssues[i].requestedAgent;
        newAutoIssue.timer = autoIssues[i].timer;
        newAutoIssue.workBy = autoIssues[i].workBy;
        newAutoIssue.alertDepartment = autoIssues[i].alertDepartment;
        newAutoIssue.lastUpdate = autoIssues[i].lastUpdate;
        newAutoIssue.creationLog = autoIssues[i].creationLog;
        newAutoIssue.iCDate = autoIssues[i].iCDate;
        newAutoIssue.boardName = autoIssues[i].boardName;
        newAutoIssue.duration = autoIssues[i].duration;
        await newAutoIssue.save();
      }
    }
  }
}
