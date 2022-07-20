import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Connection, getManager, Not } from 'typeorm';
import * as XLSX from 'xlsx';
import { EpicActivities } from './entity/epic-activities.entity';
import { EpicActivitiesRepository } from './repository/data-epics.repository';
import * as _ from 'lodash';
import { EntityStatus } from 'src/utils/entity-status';
import { UpdateEpicDto } from './dto/update-epic.dto';
import { epicValidateSchema } from './schema/epic.shema';
import { AgentRepository } from 'src/agents/repository/agent.repository';
import { NotificationStatus } from 'src/utils/notification-status';
const MAXIMUM_PARAMETERS = 65535; //! maximum parameter can import into database by typeorm = PARAMETER_OF_A_ENTITY * number of records
const PARAMETER_OF_A_ENTITY = 20; //! number of parameters on each entity
@Injectable()
export class DataEpicsService {
  constructor(
    @InjectRepository(EpicActivitiesRepository)
    private readonly epicActivityRepository: EpicActivitiesRepository,

    @InjectRepository(AgentRepository)
    private readonly agentRepository: AgentRepository,

    private readonly connection: Connection,
  ) {}

  private extractDataEpic(file: Buffer) {
    const workbook = XLSX.read(file, { type: 'buffer', cellDates: true });
    const ws = workbook.Sheets[workbook.SheetNames[0]];
    const extractedData = XLSX.utils.sheet_to_json(ws, {
      defval: null,
      range: 2,
      header: [
        'lookupCode',
        'accountName',
        'activityCode',
        'description',
        'addTo',
        'status',
        'createdTime',
        'createdBy',
        'taskDescription',
        'updatedTime',
        'updatedBy',
        'body',
        'followupStartDate',
        'phoneNumber',
      ],
    });
    // const newData =

    const customData = extractedData.map(item => {
      delete item['status'];
      delete item['followupStartDate'];
      // delete item['body'];
      // delete item['phoneNumber'];
      item['createdTime'] = item['createdTime'] ? item['createdTime'] : null;
      item['updatedTime'] = item['updatedTime'] ? item['updatedTime'] : null;
      if (item['createdBy']) {
        if (
          item['createdBy'].toLowerCase() !== 'support' &&
          item['createdBy'].toLowerCase() !== 'download' &&
          item['createdBy'].toLowerCase() !== 'system'
        ) {
          item['createdBy'] = item['createdBy'].slice(1);
        }
      }
      if (item['updatedBy']) {
        if (
          item['updatedBy'].toLowerCase() !== 'support' &&
          item['updatedBy'].toLowerCase() !== 'download' &&
          item['updatedBy'].toLowerCase() !== 'system'
        ) {
          item['updatedBy'] = item['updatedBy'].slice(1);
        }
      } else {
        item['updatedBy'] = null;
      }

      item['body'] = item['body']??'';
      item['phoneNumber'] = item['phoneNumber']??'';
      return item;
    });

    const data = {
      data: customData,
      sheetName: workbook.SheetNames[0],
    };

    return data;
  }

  async importDataEpic(file, userId: string): Promise<any> {
    const agents = await this.agentRepository.find({
      where: {
        status: EntityStatus.ACTIVE,
      },
    });

    const fileData = this.extractDataEpic(file.buffer);
    const data = fileData.data;
    // return data;
    data.forEach(record => {
      record['creationUserId'] = userId;
      record['lastModifiedUserId'] = userId;
      if (record['createdBy']) {
        const infoAgentCreatedBy = agents.find(
          item =>
            record['createdBy'].toLowerCase() ===
            item['firstName'].toLowerCase(),
        );
        if (infoAgentCreatedBy) {
          record['createdBy'] = infoAgentCreatedBy.id;
        }
      }

      if (record['updatedBy']) {
        const infoAgentUpdatedBy = agents.find(
          item =>
            record['updatedBy'].toLowerCase().trim() ==
            item.firstName.toLowerCase().trim(),
        );
        if (infoAgentUpdatedBy) {
          record['updatedBy'] = infoAgentUpdatedBy.id;
        } else {
          record['updatedBy'] = 'invalid';
        }
      }
    });

    const step = Math.floor(MAXIMUM_PARAMETERS / PARAMETER_OF_A_ENTITY); //* this 6500 because 6000*10 < maximum parameter in postgres a 65535
    const numberOfLoop = Math.ceil(data.length / step);

    const queryRunner = this.connection.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      for (let i = 0; i < numberOfLoop; i++) {
        const dataImportNumberRow = data.splice(0, step);
        await getManager()
          .createQueryBuilder()
          .insert()
          .into(EpicActivities)
          .values(dataImportNumberRow)
          .execute();
      }
    } catch (error) {
        queryRunner.rollbackTransaction();
      return error;
    } finally {
      // you need to release a queryRunner which was manually instantiated

      await queryRunner.release();
    }
  }

  async getDataEpic(filters): Promise<any> {
    try {
      const agents = filters.agentsId;
      const queryFilter = getManager()
        .createQueryBuilder(EpicActivities, 'epic_activities')
        .innerJoinAndSelect('epic_activities.createdBy', 'agent');
      const currentPage = +filters.page > 1 ? +filters.page : 1;

      if (filters.agentsId) {
        if (filters.agentsId.length > 0)
          queryFilter.andWhere(
            `epic_activities.createdBy IN (:...agents) or epic_activities.updatedBy IN (:...agents)`,
            { agents },
          );
        else
          queryFilter.andWhere(
            `epic_activities.createdBy = null and epic_activities.updatedBy = null`,
          );
      }
      if (filters.from) {
        queryFilter.andWhere(
          `DATE(epic_activities.createdTime) >= :from or DATE(epic_activities.updatedTime) >= :from`,
          {
            from: filters.from,
          },
        );
      }

      if (filters.to) {
        queryFilter.andWhere(
          `DATE(epic_activities.createdTime) <= :to or DATE(epic_activities.updatedTime) <= :to`,
          {
            to: filters.to,
          },
        );
      }
      if (filters.on) {
        queryFilter.andWhere(
          `DATE(epic_activities.createdTime) = :on or DATE(epic_activities.updatedTime) = :on`,
          {
            on: filters.on,
          },
        );
      }

      if (filters.department) {
        queryFilter.andWhere(`epic_activities.team = :department`, {
          department: filters.department,
        });
      }
      queryFilter.andWhere(`epic_activities.status = :status`, {
        status: 'active',
      });
      const length = await queryFilter.getCount();

      //* pagination
      let limit = 10;
      if (+filters.limit) limit = +filters.limit;

      const queryFilterPaginate = getManager()
        .createQueryBuilder(EpicActivities, 'epic_activities')
        .innerJoinAndSelect('epic_activities.createdBy', 'agent')
        .limit(limit)
        .offset((currentPage - 1) * limit)
        .orderBy('epic_activities.createdTime', 'DESC');

      if (filters.agentsId) {
        if (filters.agentsId.length > 0)
          queryFilterPaginate.andWhere(
            `epic_activities.createdBy IN (:...agents) or epic_activities.updatedBy IN (:...agents)`,
            { agents },
          );
        else
          queryFilterPaginate.andWhere(
            `epic_activities.createdBy = null and epic_activities.updatedBy = null`,
          );
      }
      if (filters.from)
        queryFilterPaginate.andWhere(
          `DATE(epic_activities.createdTime) >= :from or DATE(epic_activities.updatedTime) >= :from`,
          {
            from: filters.from,
          },
        );
      if (filters.to)
        queryFilterPaginate.andWhere(
          `DATE(epic_activities.createdTime) <= :to or DATE(epic_activities.updatedTime) <= :to`,
          {
            to: filters.to,
          },
        );
      if (filters.on)
        queryFilterPaginate.andWhere(
          `DATE(epic_activities.createdTime) = :on or DATE(epic_activities.updatedTime) = :on`,
          {
            on: filters.on,
          },
        );

      queryFilterPaginate.andWhere(`epic_activities.status = :status`, {
        status: 'active',
      });

      const dataGlipAfterPaginate = await queryFilterPaginate
        .leftJoin('epic_activities.createdBy', 'createdBy')
        .addSelect(['createdBy.firstName', 'createdBy.lastName'])
        .leftJoin('epic_activities.updatedBy', 'updatedBy')
        .addSelect(['updatedBy.firstName', 'updatedBy.lastName'])
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
  async deleteActivityEpic(id: string, userId: string): Promise<any> {
    const infoActivity = await this.epicActivityRepository.findOne({
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

  async updateActivityEpic(
    id: string,
    updateEpicDto: UpdateEpicDto,
    userId: string,
  ): Promise<any> {
    const infoActivity = await getManager()
      .createQueryBuilder(EpicActivities, 'epic_activities')
      .andWhere(`epic_activities.id = :id`, { id: id })
      .andWhere(`epic_activities.status != :status`, {
        status: EntityStatus.DELETE,
      })
      .leftJoin('epic_activities.createdBy', 'createdBy')
      .leftJoin('epic_activities.updatedBy', 'updatedBy')
      .addSelect(['createdBy.id', 'createdBy.firstName', 'createdBy.lastName'])
      .addSelect(['updatedBy.id', 'updatedBy.firstName', 'updatedBy.lastName'])
      .getOne();
    if (!infoActivity) throw new NotFoundException(`Not found !`);
    infoActivity.lastModifiedUserId = userId;
    const newData = _.assign(infoActivity, updateEpicDto);
    newData.creationUserId = infoActivity.creationUserId;
    return await newData.save();
  }

  async validateFileEpicActivity(file: any): Promise<any> {
    const agents = await this.agentRepository.find({
      where: {
        status: EntityStatus.ACTIVE,
      },
    });

    const fileData = this.extractDataEpic(file.buffer);
    const data = fileData.data;
    // return data.filter(item => item['updatedBy'] == null);
    const columnName = new Map();
    columnName.set('lookupCode', 'A');
    columnName.set('accountName', 'B');
    columnName.set('activityCode', 'C');
    columnName.set('description', 'D');
    columnName.set('addTo', 'E');
    columnName.set('status', 'F');
    columnName.set('createdTime', 'G');
    columnName.set('createdBy', 'H');
    columnName.set('taskDescription', 'I');
    columnName.set('updatedTime', 'J');
    columnName.set('updatedBy', 'K');
    columnName.set('body', 'L');
    columnName.set('followupStartDate', 'M');
    columnName.set('phoneNumber', 'N');

    const yupSchema = epicValidateSchema();
    const offsetHeader = 3;
    try {
      await yupSchema.validate(data, {
        abortEarly: false,
        context: { agents },
      });
    } catch (err) {
      return err.inner.map((item: any) => {
        const path = item.path
          .replace('[', '')
          .replace(']', '')
          .split('.');

        return {
          value: item.params.originalValue,
          row: Number(path[0]) + offsetHeader,
          column: columnName.get(path[1]),
          sheetName: fileData.sheetName,
          message: item.message,
          status: NotificationStatus.ERROR,
        };
      });
    }
  }
}
