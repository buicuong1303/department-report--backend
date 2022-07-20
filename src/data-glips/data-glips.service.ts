import { AutoIssues } from './../auto-issues/entity/auto-issues.entity';
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { GlipMasterReportActivitiesRepository } from './repository/data-glips.repository';
import { GlipMasterReportActivities } from './entity/glip-master-activities.entity';
import { Connection, getManager, Not } from 'typeorm';
import * as XLSX from 'xlsx';
import * as moment from 'moment';
import { EntityStatus } from 'src/import/enum/entity-status.enum';
import { UpdateGlipDto } from './dto/update-glip.dto';
import * as _ from 'lodash';
import { glipValidateSchema } from './schema/glip-file.schema';
import { AgentRepository } from 'src/agents/repository/agent.repository';
import { DepartmentRepository } from 'src/departments/repository/departments.repository';
import { NotificationStatus } from 'src/utils/notification-status';
import { AutoIssuesService } from '../auto-issues/auto-issues.service';
@Injectable()
export class DataGlipsService {
  constructor(
    @InjectRepository(GlipMasterReportActivitiesRepository)
    private readonly glipMasterReportActivitiesRepository: GlipMasterReportActivitiesRepository,

    @InjectRepository(AgentRepository)
    private readonly agentRepository: AgentRepository,

    @InjectRepository(DepartmentRepository)
    private readonly departmentRepository: DepartmentRepository,

    private readonly connection: Connection,

    private readonly _autoIssuesService: AutoIssuesService,
  ) {}

  private convertToColumnName(header: string) {
    switch (header) {
      case 'team':
        return 'C';
      case 'name':
        return 'E';
      case 'taskName':
        return 'F';
      case 'sheet':
        return 'H';
      case 'type':
        return 'I';
      case 'createdTime':
        return 'J';
      case 'servedTime':
        return 'K';
      case 'completedTime':
        return 'L';
      case 'agent':
        return 'N';
      case 'finalStatus':
        return 'O';
      case 'createdBy':
        return 'P';

      default:
        return header;
    }
  }

  private extractDataGlip(file: Buffer) {
    try {
      const workbook = XLSX.read(file, { type: 'buffer', cellDates: true });
      const ws = workbook.Sheets[workbook.SheetNames[0]];
      //* get end record and indexing
      let endRow = '';
      for (
        let rowNum = 7;
        rowNum <= XLSX.utils.decode_range(ws['!ref']).e.r;
        rowNum++
      ) {
        const cellRef = XLSX.utils.encode_cell({ r: rowNum, c: 2 });
        const cell = ws[cellRef];
        if (cell) {
          endRow = cellRef;
        } else {
          break;
        }
      }
      //* remove first column
      ws['!ref'] = 'B8:AD' + endRow.slice(1);
      const extractedData = XLSX.utils.sheet_to_json(ws, {
        defval: '',
        header: [
          'no',
          'team', //*0
          'dateGlipMaster', //*1
          'name', //*2
          'taskName', //*3
          'signInPaper', //*4
          'sheet', //*5
          'type', //*6
          'createdTime', //*7
          'servedTime', //*8
          'completedTime', //*9
          'services', //*10
          'agent', //*11
          'finalStatus', //*12
          'createdBy', //*13
          'whoAssign', //*14
          'note', //*15
          'serviceNeeded', //*15
          'phone', //*16
          'address', //*17
          'needFollowUp', //*18
          'rate', //*19
          'clientSign', //*20
          'reason', //*21
          'clientName', //*22
          'phonePersonal', //*23
          'typePersonal', //*24
          'pol', //*25
          'notePersonal', //*26
        ],
      });

      const newData = extractedData.map((item, index) => {
        delete item['signInPaper'];
        // delete item['sheet'];
        // item['team'] = item['team'].slice(item['team'].indexOf('.') + 1).trim();
        item['dateGlipMaster'] = item['dateGlipMaster']
          ? moment(item['dateGlipMaster'], 'MM/DD/YYYY')
          : null;
        item['createdTime'] = item['createdTime']
          ? moment(item['createdTime'], ['h:mm:ss A']).format('HH:mm:ss')
          : null;
        item['servedTime'] = item['servedTime']
          ? moment(item['servedTime'], ['h:mm:ss A']).format('HH:mm:ss')
          : null;
        item['completedTime'] = item['completedTime']
          ? moment(item['completedTime'], ['h:mm:ss A']).format('HH:mm:ss')
          : null;
        // const indexSpecialAgent = this.agentsSpecial.findIndex(
        //   agent => agent.key === item['agent'],
        // );
        // if (indexSpecialAgent > -1) {
        //   const { firstName, lastName } = this.agentsSpecial[
        //     indexSpecialAgent
        //   ].value;
        //   item['agent'] = firstName + ' ' + lastName;
        // }

        return item;
      });

      const customData = {
        data: newData,
        sheetName: workbook.SheetNames[0],
      };

      return customData;
    } catch (error) {
      console.log(error);
    }
  }

  async importDataGlip(file, userId: string): Promise<any> {
    const agents = await this.agentRepository.find({
      where: {
        status: EntityStatus.ACTIVE,
      },
    });
    const fileData = this.extractDataGlip(file.buffer);
    const data = fileData.data;
    const dataDetectIssue = _.cloneDeep(data);
    data.forEach((record: any, index) => {
      const agentName = record['agent'];
      record['creationUserId'] = userId;
      record['lastModifiedUserId'] = userId;
      if (record['agent']) {
        const infoAgent = agents.find(
          item =>
            record['agent']
              .toLocaleLowerCase() === item.firstName.toLocaleLowerCase() + ' ' + item.lastName.toLocaleLowerCase(),
        );
        if (infoAgent) {
          record['agent'] = infoAgent.id;
        }
      } else {
        record['agent'] = null;
      }

      if (record['whoAssign']) {
        const infoWhoAssign = agents.find(
          item =>
            record['whoAssign'].slice(0, record['whoAssign'].indexOf(' ')) ===
            item.firstName,
        );
        if (infoWhoAssign) {
          record['whoAssign'] = infoWhoAssign.id;
        }
      } else {
        record['whoAssign'] = null;
      }

      if (record['createdBy']) {
        const infoAgentCreated = agents.find(
          item =>
            record['createdBy'].slice(0, record['createdBy'].indexOf(' ')) ===
            item.firstName,
        );
        if (infoAgentCreated) {
          record['createdBy'] = infoAgentCreated.id;
        }
      } else {
        record['createdBy'] = null;
      }

      dataDetectIssue[index] = { ...record };
      dataDetectIssue[index]['agentName'] = agentName;
    });
    const autoIssues:[] = await this._autoDetectIssue(dataDetectIssue);

    const queryRunner = this.connection.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      await getManager()
        .createQueryBuilder()
        .insert()
        .into(GlipMasterReportActivities)
        .values(data)
        .execute();

      await getManager()
        .createQueryBuilder()
        .insert()
        .into(AutoIssues)
        .values(autoIssues)
        .execute();
      
    } catch (error) {
      queryRunner.rollbackTransaction();
      return error;
    } finally {
      //* you need to release a queryRunner which was manually instantiated
      await queryRunner.release();
    }
  }

  async getDataGlip(filters): Promise<any> {
    try {
      const agents = filters.agentsId;
      const queryFilter = getManager()
        .createQueryBuilder(
          GlipMasterReportActivities,
          'glip_master_report_activities',
        )
        .innerJoinAndSelect('glip_master_report_activities.agent', 'agent');

      const currentPage = +filters.page > 1 ? +filters.page : 1;
      if (filters.agentsId) {
        if (filters.agentsId.length > 0)
          queryFilter.andWhere('agent.id IN (:...agents)', { agents });
        else queryFilter.andWhere(`agent.id = null`);
      }
      if (filters.on)
        queryFilter.andWhere(
          `DATE(glip_master_report_activities.dateGlipMaster) = :on`,
          { on: filters.on },
        );
      if (filters.from)
        queryFilter.andWhere(
          `DATE(glip_master_report_activities.dateGlipMaster) >= :from`,
          { from: filters.from },
        );
      if (filters.to)
        queryFilter.andWhere(
          `DATE(glip_master_report_activities.dateGlipMaster) <= :to`,
          { to: filters.to },
        );
      if (filters.department)
        queryFilter.andWhere(
          `glip_master_report_activities.team = :department`,
          { department: filters.department },
        );
      queryFilter.andWhere(`glip_master_report_activities.status = :status`, {
        status: 'active',
      });
      const length = await queryFilter.getCount();

      //* pagination
      let limit = 10;
      if (+filters.limit) limit = +filters.limit;

      const queryFilterPaginate = getManager()
        .createQueryBuilder(
          GlipMasterReportActivities,
          'glip_master_report_activities',
        )
        .innerJoinAndSelect('glip_master_report_activities.agent', 'agent')
        .limit(limit)
        .offset((currentPage - 1) * limit)
        .orderBy('glip_master_report_activities.dateGlipMaster', 'DESC');

      if (filters.agentsId) {
        if (filters.agentsId.length > 0)
          queryFilterPaginate.andWhere('agent.id IN (:...agents)', { agents });
        else queryFilterPaginate.andWhere(`agent.id = null`);
      }
      if (filters.on)
        queryFilterPaginate.andWhere(
          `DATE(glip_master_report_activities.dateGlipMaster) = :on`,
          { on: filters.on },
        );
      if (filters.from)
        queryFilterPaginate.andWhere(
          `DATE(glip_master_report_activities.dateGlipMaster) >= :from`,
          { from: filters.from },
        );
      if (filters.to)
        queryFilterPaginate.andWhere(
          `DATE(glip_master_report_activities.dateGlipMaster) <= :to`,
          { to: filters.to },
        );
      if (filters.department)
        queryFilterPaginate.andWhere(
          `glip_master_report_activities.team = :department`,
          { department: filters.department },
        );
      queryFilterPaginate.andWhere(
        `glip_master_report_activities.status = :status`,
        { status: 'active' },
      );

      const dataGlipAfterPaginate = await queryFilterPaginate
        .leftJoin('glip_master_report_activities.whoAssign', 'whoAssign')
        .leftJoin('glip_master_report_activities.createdBy', 'createdBy')
        .addSelect(['agent.firstName', 'agent.lastName', 'agent.id'])
        .addSelect([
          'whoAssign.id',
          'whoAssign.firstName',
          'whoAssign.lastName',
        ])
        .addSelect([
          'createdBy.id',
          'createdBy.firstName',
          'createdBy.lastName',
        ])
        .getMany();

      return {
        data: dataGlipAfterPaginate,
        pagination: {
          total: length,
          page: currentPage,
          limit: limit,
        },
      };
    } catch (error) {
      console.log(error);
      throw new Error('Can not get data');
    }
  }

  async deleteActivityGlip(id: string, userId: string): Promise<any> {
    const infoActivity = await this.glipMasterReportActivitiesRepository.findOne(
      {
        where: {
          id: id,
          status: Not(EntityStatus.DELETE),
        },
      },
    );
    if (!infoActivity) throw new NotFoundException(`Not found !`);
    infoActivity.status = EntityStatus.DELETE;
    infoActivity.lastModifiedUserId = userId;
    return await infoActivity.save();
  }

  async updateActivityGlip(
    id: string,
    updateGlipDto: UpdateGlipDto,
    userId: string,
  ): Promise<any> {
    const infoActivity = await getManager()
      .createQueryBuilder(
        GlipMasterReportActivities,
        'glip_master_report_activities',
      )
      .andWhere(`glip_master_report_activities.id = :id`, { id: id })
      .andWhere(`glip_master_report_activities.status != :status`, {
        status: EntityStatus.DELETE,
      })
      .leftJoin('glip_master_report_activities.agent', 'agent')
      .leftJoin('glip_master_report_activities.whoAssign', 'whoAssign')
      .leftJoin('glip_master_report_activities.createdBy', 'createdBy')
      .addSelect(['agent.id', 'agent.firstName', 'agent.lastName'])
      .addSelect(['whoAssign.id', 'whoAssign.firstName', 'whoAssign.lastName'])
      .addSelect(['createdBy.id', 'createdBy.firstName', 'createdBy.lastName'])
      .getOne();

    if (!infoActivity) throw new NotFoundException(`Not found !`);

    const newData = _.assign(infoActivity, updateGlipDto);
    newData.lastModifiedUserId = userId;
    return await newData.save();
  }

  //TODO: need change schema validate Create By and Who Assign if it's value is exist
  async validateFileGlipActivity(file): Promise<any> {
    const agents = await this.agentRepository.find({
      where: {
        status: EntityStatus.ACTIVE,
      },
    });
    const departments = await this.departmentRepository.find();
    // agents.forEach(item => {
    //   if(item.firstName == 'Louis'){
    //     console.log(item.firstName);
    //   }
    // })
    const fileData = this.extractDataGlip(file.buffer);
    const data = fileData.data;
    // return data;
    const yupSchema = glipValidateSchema();
    const offsetHeader = 8;
    try {
      await yupSchema.validate(data, {
        abortEarly: false,
        context: { agents, departments },
      });
    } catch (err) {
      return (
        err.inner &&
        err.inner.map((item: any) => {
          const path = item.path
            .replace('[', '')
            .replace(']', '')
            .split('.');

          return {
            value: item.params.originalValue,
            row: Number(path[0]) + offsetHeader,
            column: this.convertToColumnName(path[1]),
            sheetName: fileData.sheetName,
            message: item.message,
            status: NotificationStatus.ERROR,
          };
        })
      );
    }
  }

  private async _autoDetectIssue(data): Promise<any> {
    return this._autoIssuesService.detectGlipIssues(data);
  }
}
