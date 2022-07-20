import { AutoIssues } from './../auto-issues/entity/auto-issues.entity';
import { AutoIssuesService } from './../auto-issues/auto-issues.service';
import { Injectable, NotFoundException } from '@nestjs/common';
import { InboundCallActivitiesRepository } from './repository/data-ics.repository';
import * as XLSX from 'xlsx';
import { Connection, getManager, Not } from 'typeorm';
import { EntityStatus } from 'src/utils/entity-status';
import { UpdateInboundCallDto } from './dto/update-ic.dto';
import { InboundCallActivities } from './entity/inbound-call.entity';
import * as _ from 'lodash';
import * as moment from 'moment';
import { InjectRepository } from '@nestjs/typeorm';
import { AgentRepository } from 'src/agents/repository/agent.repository';
import { inboundCallValidateSchema } from './schema/inbound-call.schema';
import { NotificationStatus } from 'src/utils/notification-status';
@Injectable()
export class DataIcsService {
  constructor(
    @InjectRepository(InboundCallActivitiesRepository)
    private readonly icRepository: InboundCallActivitiesRepository,

    @InjectRepository(AgentRepository)
    private readonly agentRepository: AgentRepository,

    private readonly connection: Connection,

    private readonly _autoIssuesService: AutoIssuesService,
  ) {}

  private extractDataInboundCall(file: Buffer) {
    const workbook = XLSX.read(file, { type: 'buffer' });

    const wsNameValid = [];
    const data = workbook.SheetNames.reduce((total, wsName) => {
      if (
        wsName === '1. IC - Health' ||
        wsName === '2. IC - Personal' ||
        wsName === '3. IC - Commercial' ||
        wsName === '4. IC - Life' ||
        wsName === '5. IC - Tax'
      ) {
        const ws = workbook.Sheets[wsName];
        wsNameValid.push(wsName);
        // * format big number of column A
        Object.keys(ws).forEach(function(s) {
          if (ws[s].w && s.includes('A')) {
            delete ws[s].w;
            ws[s].z = '0';
          }
        });
        const dataExtracted = XLSX.utils.sheet_to_json(ws, {
          raw: false,
          defval: null,
          range: 1,
          header: [
            'taskId',
            'action',
            'taskName',
            'agent',
            'date',
            'time',
            'assignTo',
            'isCompleted',
            'color',
            'reply',
            'text',
            'notes',
            'section',
            'start',
            'due',
            'completedWhen',
            'repeat',
            'repeatEnding',
            'repeatEndingOn',
            'repeatEndingAfter',
            'additional',
          ],
        });
        const standardData = dataExtracted.map(item => {
          item['team'] = wsName.slice(wsName.indexOf(' ') + 1);
          const dateTime =
            moment(new Date(item['date'])).format('MM/DD/YYYY') +
            ' ' +
            moment(item['time'], ['h:mm:ss A']).format('HH:mm:ss');
          item['dateTimeIC'] = dateTime ? dateTime : null;
          delete item['date'];
          delete item['time'];
          delete item['section'];
          delete item['start'];
          delete item['due'];
          delete item['completedWhen'];
          delete item['repeat'],
            delete item['repeatEnding'],
            delete item['repeatEndingOn'],
            delete item['repeatEndingAfter'],
            delete item['additional'];

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
        return (total = [...total, ...standardData]);
      }

      return total;
    }, []);
    const newData = {
      data: data,
      sheetName: workbook.SheetNames[0],
    };

    return newData;
  }

  private convertToColumnName(header: string) {
    switch (header) {
      case 'agent':
        return 'D';
      case 'assignTo':
        return 'G';
      default:
        return header;
    }
  }

  async importDataInboundCall(
    file: any,
    fileImport,
    userId: string,
  ): Promise<any> {
    const agents = await this.agentRepository.find({
      where: {
        status: EntityStatus.ACTIVE,
      },
    });

    const fileData = this.extractDataInboundCall(file.buffer);
    const data = fileData.data;
    const dataDetectIssue = _.cloneDeep(data);

    for (let i = 0; i < data.length; i++) {
      const assignToName = data[i]['assignTo'];

      data[i]['creationUserId'] = userId;
      data[i]['lastModifiedUserId'] = userId;
      data[i]['file'] = fileImport.identifiers[0].id;
      const firstName = data[i]['agent'].slice(
        0,
        data[i]['agent'].indexOf(' '),
      );
      if (firstName) {
        const infoAgent = agents.find(item => firstName === item.firstName);
        if (infoAgent) {
          data[i]['agent'] = infoAgent.id;
        }
      }
      if (data[i]['assignTo']) {
        if (data[i]['assignTo'] === 'nobody') {
          data[i]['assignTo'] = null;
        } else {
          const infoAssignToAgent = agents.find(
            item =>
              data[i]['assignTo'].slice(0, data[i]['assignTo'].indexOf(' ')) ===
              item.firstName,
          );
          if (infoAssignToAgent) {
            data[i]['assignTo'] = infoAssignToAgent.id;
          } else {
            data[i]['assignTo'] = null;
          }
        }
      }

      dataDetectIssue[i] = { ...data[i] };
      dataDetectIssue[i]['assignToName'] = assignToName;
    }

    const autoIssues:[] = await this._autoDetectIssue(dataDetectIssue);

    const queryRunner = this.connection.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      await getManager()
        .createQueryBuilder()
        .insert()
        .into(InboundCallActivities)
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

  async getDataInboundCall(filters): Promise<any> {
    try {
      const agents = filters.agentsId;
      const queryFilter = getManager()
        .createQueryBuilder(InboundCallActivities, 'inbound_call_activities')
        .innerJoinAndSelect('inbound_call_activities.agent', 'agent');
      const currentPage = +filters.page > 1 ? +filters.page : 1;

      if (filters.agentsId) {
        if (filters.agentsId.length > 0)
          queryFilter.andWhere('agent.id IN (:...agents)', { agents });
        else queryFilter.andWhere(`agent.id = null`);
      }
      if (filters.from)
        queryFilter.andWhere(
          `DATE(inbound_call_activities.dateTimeIC) >= :from`,
          { from: filters.from },
        );
      if (filters.to)
        queryFilter.andWhere(
          `DATE(inbound_call_activities.dateTimeIC) <= :to`,
          { to: filters.to },
        );
      if (filters.on)
        queryFilter.andWhere(`DATE(inbound_call_activities.dateTimeIC) = :on`, {
          on: filters.on,
        });
      if (filters.department)
        queryFilter.andWhere(`inbound_call_activities.team = :department`, {
          department: filters.department,
        });
      queryFilter.andWhere(`inbound_call_activities.status = :status`, {
        status: 'active',
      });

      const length = await queryFilter.getCount();

      //* pagination
      let limit = 10;
      if (+filters.limit) limit = +filters.limit;

      const queryFilterPaginate = getManager()
        .createQueryBuilder(InboundCallActivities, 'inbound_call_activities')
        .innerJoinAndSelect('inbound_call_activities.agent', 'agent')
        .limit(limit)
        .offset((currentPage - 1) * limit)
        .orderBy('inbound_call_activities.dateTimeIC', 'DESC');

      if (filters.agentsId) {
        if (filters.agentsId.length > 0)
          queryFilterPaginate.andWhere('agent.id IN (:...agents)', { agents });
        else queryFilterPaginate.andWhere(`agent.id = null`);
      }
      if (filters.from)
        queryFilterPaginate.andWhere(
          `DATE(inbound_call_activities.dateTimeIC) >= :from`,
          { from: filters.from },
        );
      if (filters.to)
        queryFilterPaginate.andWhere(
          `DATE(inbound_call_activities.dateTimeIC) <= :to`,
          { to: filters.to },
        );
      if (filters.on)
        queryFilterPaginate.andWhere(
          `DATE(inbound_call_activities.dateTimeIC) = :on`,
          { on: filters.on },
        );
      queryFilterPaginate.andWhere(`inbound_call_activities.status = :status`, {
        status: 'active',
      });

      const dataGlipAfterPaginate = await queryFilterPaginate
        .addSelect(['agent.firstName', 'agent.lastName'])
        .leftJoin('inbound_call_activities.assignTo', 'assignTo')
        .addSelect(['assignTo.firstName', 'assignTo.lastName'])
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

  async deleteActivityInboundCall(id: string, userId: string): Promise<any> {
    const infoActivity = await this.icRepository.findOne({
      where: {
        id: id,
        status: Not(EntityStatus.DELETE),
      },
    });
    if (!infoActivity) throw new NotFoundException(`Not found !`);
    infoActivity.status = EntityStatus.DELETE;
    infoActivity.lastModifiedUserId = userId;
    return await infoActivity.save();
  }

  async updateActivityInboundCall(
    id: string,
    updateInboundCallDto: UpdateInboundCallDto,
    userId: string,
  ): Promise<any> {
    const infoActivity = await this.icRepository.findOne({
      relations: ['agent'],
      where: {
        id: id,
        status: Not(EntityStatus.DELETE),
      },
    });
    if (!infoActivity) throw new NotFoundException(`Not found !`);

    const newData = _.assign(infoActivity, updateInboundCallDto);
    newData.lastModifiedUserId = userId;
    return await newData.save();
  }

  //TODO: need change schema validate Who Assign if it's value is exist
  async validateFileIcActivity(file: any): Promise<any> {
    const agents = await this.agentRepository.find({
      where: {
        status: EntityStatus.ACTIVE,
      },
    });

    const fileData = this.extractDataInboundCall(file.buffer);
    const data = fileData.data;
    // return data
    const yupSchema = inboundCallValidateSchema();
    const offsetHeader = 2;
    try {
      await yupSchema.validate(data, {
        abortEarly: false,
        context: { agents },
      });
    } catch (err) {
      // return err.inner
      return err.inner.map((item: any) => {
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
      });
    }
  }

  private async _autoDetectIssue(data): Promise<any> {
    return this._autoIssuesService.detectICIssues(data);
  }
}
