import {
    Injectable, NotFoundException,
  } from '@nestjs/common';
import { EntityStatus } from 'src/utils/entity-status';
import * as Excel from 'exceljs';
import * as fs from 'fs';
import * as _ from 'lodash';
import * as moment from 'moment-timezone';
import { BoardsService } from './services/boards.service';
  
@Injectable()
export class MondayService {
constructor(
    // private readonly _configVariableRepository: ConfigVariableRepository,
    private readonly _boardService: BoardsService
    
    ) {
        //TODO: testing
        // setTimeout(() => {
            // const toDay = moment().add(7, 'hours').toDate();
            // const dateTo = moment().toISOString();
            // const dateFrom = moment().subtract(18, 'hours').toISOString();
            // this._autoImportIC(dateFrom, dateTo);
        // }, 2000);
    }

    public async _autoImportIC(queries) {
        let pageIndex = 1;
        const dateTo = moment(queries.to, 'MM-DD-YYYY').add(31, 'hours').toISOString();
        const dateFrom = moment(queries.from, 'MM-DD-YYYY').add(8, 'hours').toISOString();
        // const dateTo = moment().toISOString();
        // const dateFrom = moment().subtract(3, 'days').toISOString();
        //TODO: need get for 3 board IC- Health, Life, Tax Dept ; IC- Personal Dept ; IC- Commercial Dept
        //TODO: id 1483255419 ; 1483261623 ; 1483259420
        const responseActivity: any = await this._boardService.getActivities(1630124360, dateFrom, dateTo, pageIndex);
        let activityLogs: any[] = responseActivity.boards[0].activity_logs;
        while (activityLogs.length === 1000*pageIndex) {
            pageIndex = pageIndex + 1;
            const nextResponseActivity: any = await this._boardService.getActivities(1630124360, dateFrom, dateTo, pageIndex);
            activityLogs = activityLogs.concat(nextResponseActivity.boards[0].activity_logs)
        }

        const activityLogsEnhanced = activityLogs
        // .filter((log) => log.event === 'update_column_value')
        .map((log) => {
            let data = JSON.parse(log.data);
            data = {
            ...data,
            event: log.event,
            created_at: moment(new Date(parseInt(log.created_at) / 1e4))
                .tz('America/Los_Angeles')
                .format('YYYY-MM-DD hh:mm:ss A'),
            };
            return data;
        });
        
        // const data = activityLogsEnhanced.slice(0, 20)
        // console.log(activityLogsEnhanced.length);
        const dataActivities = await this._setUpDataIC(activityLogsEnhanced);
        // return dataActivities.data;
        const downloadUrl = await this.writeReport(dataActivities, '30-8-2021');
        if(downloadUrl){
            return downloadUrl;
        }else{
            throw new NotFoundException(`Save data failed !!`);
        }
    }

    private async _setUpDataIC(data){
        const autoIssues = [];

        const itemsGroup = _.groupBy(data, 'pulse_id');
        const listHeader = [];

        for (const itemId in itemsGroup){
            const listActivitySameItem:any[] = itemsGroup[itemId];

            if(listActivitySameItem.length > 1) {
                listActivitySameItem.sort((item1, item2) => {
                    const compareTime = new Date(item1['created_at']).getTime() - new Date(item2['created_at']).getTime();
                    return compareTime;
                });
            }
            for(let i = 0; i< listActivitySameItem.length; i++){
                if(listActivitySameItem[i]['column_type'] === 'color'){
                    if(!listHeader.includes(listActivitySameItem[i]['column_title'])){
                        listHeader.push(listActivitySameItem[i]['column_title'])
                    }
                    if(listActivitySameItem[i]['value'] && listActivitySameItem[i]['value']['label']){
                        autoIssues.push({
                            [listActivitySameItem[i]['column_title']]: listActivitySameItem[i]['value']['label']['text'],
                            title:listActivitySameItem[i]['column_title'],
                            value: listActivitySameItem[i]['value'],
                            previousValue: listActivitySameItem[i]['previous_value'],
                            date: listActivitySameItem[i]['created_at'],
                            pulseName: listActivitySameItem[i]['pulse_name'],
                            pulseId: listActivitySameItem[i]['pulse_id'],
                            type: listActivitySameItem[i]['column_type'],
                            event: listActivitySameItem[i]['event']
                        })
                    }else{
                        // console.log(listActivitySameItem[i]);
                        autoIssues.push({
                            [listActivitySameItem[i]['column_title']]: "Undefined",
                            title:listActivitySameItem[i]['column_title'],
                            value: null,
                            previousValue: listActivitySameItem[i]['previous_value'],
                            date: listActivitySameItem[i]['created_at'],
                            pulseName: listActivitySameItem[i]['pulse_name'],
                            pulseId: listActivitySameItem[i]['pulse_id'],
                            type: listActivitySameItem[i]['column_type'],
                            event: listActivitySameItem[i]['event']
                        })
                    }
                }
                if(listActivitySameItem[i]['column_type'] === 'text'){
                    if(!listHeader.includes(listActivitySameItem[i]['column_title'])){
                        listHeader.push(listActivitySameItem[i]['column_title'])
                    }
                    if(listActivitySameItem[i]['value'] && listActivitySameItem[i]['value']['value']){
                        autoIssues.push({
                            [listActivitySameItem[i]['column_title']]: listActivitySameItem[i]['value']['value'],
                            title:listActivitySameItem[i]['column_title'],
                            value: listActivitySameItem[i]['value'],
                            previousValue: listActivitySameItem[i]['previous_value'],
                            date: listActivitySameItem[i]['created_at'],
                            pulseName: listActivitySameItem[i]['pulse_name'],
                            pulseId: listActivitySameItem[i]['pulse_id'],
                            type: listActivitySameItem[i]['column_type'],
                            event: listActivitySameItem[i]['event']
                        })
                    }else{
                        // console.log(listActivitySameItem[i]);
                        autoIssues.push({
                            [listActivitySameItem[i]['column_title']]: "Undefined",
                            title:listActivitySameItem[i]['column_title'],
                            value: listActivitySameItem[i]['value'],
                            previousValue: listActivitySameItem[i]['previous_value'],
                            date: listActivitySameItem[i]['created_at'],
                            pulseName: listActivitySameItem[i]['pulse_name'],
                            pulseId: listActivitySameItem[i]['pulse_id'],
                            type: listActivitySameItem[i]['column_type'],
                            event: listActivitySameItem[i]['event']
                        })
                    }
                }
                if(listActivitySameItem[i]['column_type'] === 'multiple-person'){
                    if(!listHeader.includes(listActivitySameItem[i]['column_title'])){
                        listHeader.push(listActivitySameItem[i]['column_title'])
                    }
                    if(listActivitySameItem[i]['textual_value']){
                        autoIssues.push({
                            [listActivitySameItem[i]['column_title']]: listActivitySameItem[i]['textual_value'],
                            title:listActivitySameItem[i]['column_title'],
                            value: listActivitySameItem[i]['textual_value'],
                            previousValue: listActivitySameItem[i]['previous_textual_value'],
                            date: listActivitySameItem[i]['created_at'],
                            pulseName: listActivitySameItem[i]['pulse_name'],
                            pulseId: listActivitySameItem[i]['pulse_id'],
                            type: listActivitySameItem[i]['column_type'],
                            event: listActivitySameItem[i]['event']
                        })
                    }else{
                        // console.log(listActivitySameItem[i]);
                        autoIssues.push({
                            [listActivitySameItem[i]['column_title']]: "Undefined",
                            title:listActivitySameItem[i]['column_title'],
                            value: listActivitySameItem[i]['textual_value'],
                            previousValue: listActivitySameItem[i]['previous_textual_value'],
                            date: listActivitySameItem[i]['created_at'],
                            pulseName: listActivitySameItem[i]['pulse_name'],
                            pulseId: listActivitySameItem[i]['pulse_id'],
                            type: listActivitySameItem[i]['column_type'],
                            event: listActivitySameItem[i]['event']
                        })
                    }
                }
                if(listActivitySameItem[i]['column_type'] === 'numeric'){
                    if(!listHeader.includes(listActivitySameItem[i]['column_title'])){
                        listHeader.push(listActivitySameItem[i]['column_title'])
                    }
                    if(listActivitySameItem[i]['value'] && listActivitySameItem[i]['value']['value']){
                        autoIssues.push({
                            [listActivitySameItem[i]['column_title']]: listActivitySameItem[i]['value']['value'],
                            title:listActivitySameItem[i]['column_title'],
                            value: listActivitySameItem[i]['value'],
                            previousValue: listActivitySameItem[i]['previous_value'],
                            date: listActivitySameItem[i]['created_at'],
                            pulseName: listActivitySameItem[i]['pulse_name'],
                            pulseId: listActivitySameItem[i]['pulse_id'],
                            type: listActivitySameItem[i]['column_type'],
                            event: listActivitySameItem[i]['event']
                        })
                    }else{
                        // console.log(listActivitySameItem[i]);
                        autoIssues.push({
                            [listActivitySameItem[i]['column_title']]: "Undefined",
                            title:listActivitySameItem[i]['column_title'],
                            value: listActivitySameItem[i]['value'],
                            previousValue: listActivitySameItem[i]['previous_value'],
                            date: listActivitySameItem[i]['created_at'],
                            pulseName: listActivitySameItem[i]['pulse_name'],
                            pulseId: listActivitySameItem[i]['pulse_id'],
                            type: listActivitySameItem[i]['column_type'],
                            event: listActivitySameItem[i]['event']
                        })
                    }
                }
                if(listActivitySameItem[i]['column_type'] === 'date'){
                    if(!listHeader.includes(listActivitySameItem[i]['column_title'])){
                        listHeader.push(listActivitySameItem[i]['column_title'])
                    }
                    if(listActivitySameItem[i]['value'] && listActivitySameItem[i]['value']['date']){
                        autoIssues.push({
                            [listActivitySameItem[i]['column_title']]: listActivitySameItem[i]['value']['date'],
                            title:listActivitySameItem[i]['column_title'],
                            value: listActivitySameItem[i]['value'],
                            previousValue: listActivitySameItem[i]['previous_value'],
                            date: listActivitySameItem[i]['created_at'],
                            pulseName: listActivitySameItem[i]['pulse_name'],
                            pulseId: listActivitySameItem[i]['pulse_id'],
                            type: listActivitySameItem[i]['column_type'],
                            event: listActivitySameItem[i]['event']
                        })
                    }else{
                        // console.log(listActivitySameItem[i]);
                        autoIssues.push({
                            [listActivitySameItem[i]['column_title']]: "Undefined",
                            title:listActivitySameItem[i]['column_title'],
                            value: listActivitySameItem[i]['value'],
                            previousValue: listActivitySameItem[i]['previous_value'],
                            date: listActivitySameItem[i]['created_at'],
                            pulseName: listActivitySameItem[i]['pulse_name'],
                            pulseId: listActivitySameItem[i]['pulse_id'],
                            type: listActivitySameItem[i]['column_type'],
                            event: listActivitySameItem[i]['event']
                        })
                    }
                }
                if(listActivitySameItem[i]['column_type'] === 'dropdown'){
                    if(!listHeader.includes(listActivitySameItem[i]['column_title'])){
                        listHeader.push(listActivitySameItem[i]['column_title'])
                    }
                    if(listActivitySameItem[i]['textual_value']){
                        autoIssues.push({
                            [listActivitySameItem[i]['column_title']]: listActivitySameItem[i]['textual_value'],
                            title:listActivitySameItem[i]['column_title'],
                            value: listActivitySameItem[i]['textual_value'],
                            previousValue: listActivitySameItem[i]['previous_textual_value'],
                            date: listActivitySameItem[i]['created_at'],
                            pulseName: listActivitySameItem[i]['pulse_name'],
                            pulseId: listActivitySameItem[i]['pulse_id'],
                            type: listActivitySameItem[i]['column_type'],
                            event: listActivitySameItem[i]['event']
                        })
                    }else{
                        // console.log(listActivitySameItem[i]);
                        autoIssues.push({
                            [listActivitySameItem[i]['column_title']]: "Undefined",
                            title:listActivitySameItem[i]['column_title'],
                            value: listActivitySameItem[i]['textual_value'],
                            previousValue: listActivitySameItem[i]['previous_textual_value'],
                            date: listActivitySameItem[i]['created_at'],
                            pulseName: listActivitySameItem[i]['pulse_name'],
                            pulseId: listActivitySameItem[i]['pulse_id'],
                            type: listActivitySameItem[i]['column_type'],
                            event: listActivitySameItem[i]['event']
                        })
                    }
                }
                if(listActivitySameItem[i]['column_type'] === 'timerange'){
                    if(!listHeader.includes(listActivitySameItem[i]['column_title'])){
                        listHeader.push(listActivitySameItem[i]['column_title'])
                    }
                    if(listActivitySameItem[i]['value']){
                        autoIssues.push({
                            [listActivitySameItem[i]['column_title']]: `${listActivitySameItem[i]['value']['from']} - ${listActivitySameItem[i]['value']['to']}`,
                            title:listActivitySameItem[i]['column_title'],
                            value: listActivitySameItem[i]['value'],
                            previousValue: listActivitySameItem[i]['previous_value'],
                            date: listActivitySameItem[i]['created_at'],
                            pulseName: listActivitySameItem[i]['pulse_name'],
                            pulseId: listActivitySameItem[i]['pulse_id'],
                            type: listActivitySameItem[i]['column_type'],
                            event: listActivitySameItem[i]['event']
                        })
                    }else{
                        // console.log(listActivitySameItem[i]);
                        autoIssues.push({
                            [listActivitySameItem[i]['column_title']]: "Undefined",
                            title:listActivitySameItem[i]['column_title'],
                            value: listActivitySameItem[i]['value'],
                            previousValue: listActivitySameItem[i]['previous_value'],
                            date: listActivitySameItem[i]['created_at'],
                            pulseName: listActivitySameItem[i]['pulse_name'],
                            pulseId: listActivitySameItem[i]['pulse_id'],
                            type: listActivitySameItem[i]['column_type'],
                            event: listActivitySameItem[i]['event']
                        })
                    }
                }
                if(listActivitySameItem[i]['column_type'] === 'tag'){
                    if(!listHeader.includes(listActivitySameItem[i]['column_title'])){
                        listHeader.push(listActivitySameItem[i]['column_title'])
                    }
                    if(listActivitySameItem[i]['value'] && listActivitySameItem[i]['value']['tags']){
                        let listTags = '';
                        if(listActivitySameItem[i]['value']['tags'].length > 0){
                            listActivitySameItem[i]['value']['tags'].forEach(item => {
                                if(listTags === ''){
                                    listTags = `${item.name}`
                                }else{
                                    listTags = `${listTags}, ${item.name}`
                                }
                            });
                        }
                        autoIssues.push({
                            [listActivitySameItem[i]['column_title']]: listTags,
                            title:listActivitySameItem[i]['column_title'],
                            value: listActivitySameItem[i]['value'],
                            previousValue: listActivitySameItem[i]['previous_value'],
                            date: listActivitySameItem[i]['created_at'],
                            pulseName: listActivitySameItem[i]['pulse_name'],
                            pulseId: listActivitySameItem[i]['pulse_id'],
                            type: listActivitySameItem[i]['column_type'],
                            event: listActivitySameItem[i]['event']
                        })
                    }else{
                        // console.log(listActivitySameItem[i]);
                        autoIssues.push({
                            [listActivitySameItem[i]['column_title']]: "Undefined",
                            title:listActivitySameItem[i]['column_title'],
                            value: listActivitySameItem[i]['value'],
                            previousValue: listActivitySameItem[i]['previous_value'],
                            date: listActivitySameItem[i]['created_at'],
                            pulseName: listActivitySameItem[i]['pulse_name'],
                            pulseId: listActivitySameItem[i]['pulse_id'],
                            type: listActivitySameItem[i]['column_type'],
                            event: listActivitySameItem[i]['event']
                        })
                    }
                }
                if(listActivitySameItem[i]['column_type'] === 'boolean'){
                    if(!listHeader.includes(listActivitySameItem[i]['column_title'])){
                        listHeader.push(listActivitySameItem[i]['column_title'])
                    }
                    if(listActivitySameItem[i]['value']){
                        autoIssues.push({
                            [listActivitySameItem[i]['column_title']]: listActivitySameItem[i]['value']['checked'],
                            title:listActivitySameItem[i]['column_title'],
                            value: listActivitySameItem[i]['value'],
                            previousValue: listActivitySameItem[i]['previous_value'],
                            date: listActivitySameItem[i]['created_at'],
                            pulseName: listActivitySameItem[i]['pulse_name'],
                            pulseId: listActivitySameItem[i]['pulse_id'],
                            type: listActivitySameItem[i]['column_type'],
                            event: listActivitySameItem[i]['event']
                        })
                    }else{
                        // console.log(listActivitySameItem[i]);
                        autoIssues.push({
                            [listActivitySameItem[i]['column_title']]: "Undefined",
                            title:listActivitySameItem[i]['column_title'],
                            value: listActivitySameItem[i]['value'],
                            previousValue: listActivitySameItem[i]['previous_value'],
                            date: listActivitySameItem[i]['created_at'],
                            pulseName: listActivitySameItem[i]['pulse_name'],
                            pulseId: listActivitySameItem[i]['pulse_id'],
                            type: listActivitySameItem[i]['column_type'],
                            event: listActivitySameItem[i]['event']
                        })
                    }
                }
                if(listActivitySameItem[i]['column_type'] === 'subtasks'){
                    if(!listHeader.includes(listActivitySameItem[i]['column_title'])){
                        listHeader.push(listActivitySameItem[i]['column_title'])
                    }
                    if(listActivitySameItem[i]['textual_value']){
                        autoIssues.push({
                            [listActivitySameItem[i]['column_title']]: listActivitySameItem[i]['textual_value'],
                            title:listActivitySameItem[i]['column_title'],
                            value: listActivitySameItem[i]['textual_value'],
                            previousValue: listActivitySameItem[i]['previous_textual_value'],
                            date: listActivitySameItem[i]['created_at'],
                            pulseName: listActivitySameItem[i]['pulse_name'],
                            pulseId: listActivitySameItem[i]['pulse_id'],
                            type: listActivitySameItem[i]['column_type'],
                            event: listActivitySameItem[i]['event']
                        })
                    }else{
                        // console.log(listActivitySameItem[i]);
                        autoIssues.push({
                            [listActivitySameItem[i]['column_title']]: "Undefined",
                            title:listActivitySameItem[i]['column_title'],
                            value: listActivitySameItem[i]['textual_value'],
                            previousValue: listActivitySameItem[i]['previous_textual_value'],
                            date: listActivitySameItem[i]['created_at'],
                            pulseName: listActivitySameItem[i]['pulse_name'],
                            pulseId: listActivitySameItem[i]['pulse_id'],
                            type: listActivitySameItem[i]['column_type'],
                            event: listActivitySameItem[i]['event']
                        })
                    }
                }
                if(listActivitySameItem[i]['column_type'] === 'file'){
                    if(!listHeader.includes(listActivitySameItem[i]['column_title'])){
                        listHeader.push(listActivitySameItem[i]['column_title'])
                    }
                    if(listActivitySameItem[i]['textual_value']){
                        const lastIndex = listActivitySameItem[i]['textual_value'].lastIndexOf('/');
                        autoIssues.push({
                            [listActivitySameItem[i]['column_title']]: listActivitySameItem[i]['textual_value'].slice(lastIndex + 1),
                            title:listActivitySameItem[i]['column_title'],
                            value: listActivitySameItem[i]['textual_value'],
                            previousValue: listActivitySameItem[i]['previous_textual_value'],
                            date: listActivitySameItem[i]['created_at'],
                            pulseName: listActivitySameItem[i]['pulse_name'],
                            pulseId: listActivitySameItem[i]['pulse_id'],
                            type: listActivitySameItem[i]['column_type'],
                            event: listActivitySameItem[i]['event']
                        })
                    }else{
                        // console.log(listActivitySameItem[i]);
                        autoIssues.push({
                            [listActivitySameItem[i]['column_title']]: "Undefined",
                            title:listActivitySameItem[i]['column_title'],
                            value: listActivitySameItem[i]['textual_value'],
                            previousValue: listActivitySameItem[i]['previous_textual_value'],
                            date: listActivitySameItem[i]['created_at'],
                            pulseName: listActivitySameItem[i]['pulse_name'],
                            pulseId: listActivitySameItem[i]['pulse_id'],
                            type: listActivitySameItem[i]['column_type'],
                            event: listActivitySameItem[i]['event']
                        })
                    }
                }
                if(listActivitySameItem[i]['column_type'] !== 'boolean' &&
                listActivitySameItem[i]['column_type'] !== 'tag' &&
                listActivitySameItem[i]['column_type'] !== 'timerange' &&
                listActivitySameItem[i]['column_type'] !== 'dropdown' &&
                listActivitySameItem[i]['column_type'] !== 'date' &&
                listActivitySameItem[i]['column_type'] !== 'numeric' &&
                listActivitySameItem[i]['column_type'] !== 'multiple-person' &&
                listActivitySameItem[i]['column_type'] !== 'text' &&
                listActivitySameItem[i]['column_type'] !== 'color' &&
                listActivitySameItem[i]['column_type'] !== 'subtasks' &&
                listActivitySameItem[i]['column_type'] !== 'file'
                ){
                    autoIssues.push({
                        title:listActivitySameItem[i]['column_title'],
                        value: listActivitySameItem[i],
                        date: listActivitySameItem[i]['created_at'],
                        pulseName: listActivitySameItem[i]['pulse_name'],
                        pulseId: listActivitySameItem[i]['pulse_id'],
                        type: listActivitySameItem[i]['column_type'],
                        event: listActivitySameItem[i]['event']
                    })
                    // console.log(listActivitySameItem[i]);
                }
            }
        }
        return {
            data: autoIssues,
            headers: listHeader
        }
    }

    private async writeReport(data,currentTime) {
        //TODO: write report to ../../public/reports/archiver-sms folder and return path; 
        const workbook = new Excel.Workbook();
        const sheet = workbook.addWorksheet('My Sheet');
        const listHeader = [];
        // const listHeader = data.headers.map(item => {
        //     const data = {
        //         header: item,
        //         key: item,
        //         width: 20,
        //     }
        //     return data;
        // })
        listHeader.unshift({
            header: 'Event',
            key: 'event',
            width: 30,
        },
        {
            header: 'Creation At',
            key: 'date',
            width: 25,
        },
        {
            header: 'ID',
            key: 'pulseId',
            width: 20,
        },
        {
            header: 'Task Name',
            key: 'pulseName',
            width: 20,
        },
        {
            header: 'Title',
            key: 'title',
            width: 25,
        },
        {
            header: 'Previous Value',
            key: 'previousValue',
            width: 30,
        },
        {
            header: 'Value',
            key: 'value',
            width: 30,
        },
        {
            header: 'Type',
            key: 'type',
            width: 25,
        })
        sheet.columns = listHeader as Excel.Column[];
        sheet.getColumn(6).alignment = { vertical: 'middle', wrapText: true };
        sheet.getColumn(7).alignment = { vertical: 'middle', wrapText: true };
        sheet.getCell('A1').font = {
          name: 'Comic Sans MS',
          family: 4,
          size: 12,
          bold: true
        };
        sheet.getCell('B1').font = {
          name: 'Comic Sans MS',
          family: 4,
          size: 12,
          bold: true
        };
        sheet.getCell('C1').font = {
          name: 'Comic Sans MS',
          family: 4,
          size: 12,
          bold: true
        };
        sheet.getCell('D1').font = {
          name: 'Comic Sans MS',
          family: 4,
          size: 12,
          bold: true
        };
        sheet.getCell('E1').font = {
          name: 'Comic Sans MS',
          family: 4,
          size: 12,
          bold: true
        };
        sheet.getCell('F1').font = {
          name: 'Comic Sans MS',
          family: 4,
          size: 12,
          bold: true
        };
        sheet.getCell('G1').font = {
          name: 'Comic Sans MS',
          family: 4,
          size: 12,
          bold: true
        };
        sheet.getCell('H1').font = {
          name: 'Comic Sans MS',
          family: 4,
          size: 12,
          bold: true
        };
        sheet.getCell('I1').font = {
          name: 'Comic Sans MS',
          family: 4,
          size: 12,
          bold: true
        };
        sheet.getCell('J1').font = {
          name: 'Comic Sans MS',
          family: 4,
          size: 12,
          bold: true
        };
        sheet.getCell('K1').font = {
            name: 'Comic Sans MS',
            family: 4,
            size: 12,
            bold: true
        };
        // const changeTypeData = data.map(item => {
        //   const formatDateTime = moment(`${item.dateTimeExcel}`,'MMDDYYYY').format(`YYYY-MM-DD`);
        //   const formatTime = moment(`${item.timeExcel}`,'hhmmss A').format(`HH:mm:ss`);
        //   item.timeExcel = new Date(`${formatDateTime}T${formatTime}.000Z`);
        //   item.dateTimeExcel = new Date(item.dateTimeExcel);
        //   item.dateExcel = new Date(item.dateExcel);
        //   return item;
        // })
    
        sheet.addRows(data.data);
    
        if(!fs.existsSync('public/reports/monday')){
            await fs.promises.mkdir('public/reports/monday', { recursive: true })
        }
        await workbook.xlsx.writeFile(`public/reports/monday/Monday Report.xlsx`);
        return `public/reports/monday/Monday Report.xlsx`;
    }
}
  