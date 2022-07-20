import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as XLSX from 'xlsx';
// import * as moment from 'moment';
import * as _ from 'lodash';
import { Connection, Equal, getManager, Not } from 'typeorm';
import { EmailActivitiesRepository } from './repository/data-emails.repository';
import { EmailActivities } from './entity/email-activities.entity';
import { EntityStatus } from 'src/utils/entity-status';
import { importFileSchema } from './schema/import-file.schema';
import { NotificationStatus } from 'src/utils/notification-status';
import { AgentsService } from 'src/agents/agents.service';
import { EmailTeamsService } from 'src/email-teams/email-teams.service';
import * as moment_tz from 'moment-timezone';
import { AgentRepository } from 'src/agents/repository/agent.repository';
import { InternalServerErrorException } from '@nestjs/common';

@Injectable()
export class DataEmailsService {
  constructor(
    @InjectRepository(EmailActivitiesRepository)
    private readonly emailActivitiesRepository: EmailActivitiesRepository,
    private readonly connection: Connection,
    private readonly agentsService: AgentsService,
    private agentRepository: AgentRepository,
    private readonly emailTeamsService: EmailTeamsService,
  ) {}

  //* convert data
  private extractDataEmail = (file: Buffer) => {
    try {
      const workbook = XLSX.read(file, { type: 'buffer', cellDates: true });
      const ws = workbook.Sheets[workbook.SheetNames[0]];

      //* convert sheet to json
      const extractedData = XLSX.utils.sheet_to_json(ws, {
        defval: '',
        header: [
          'exportItemId',
          'itemIdentity',
          'documentID',
          'selected',
          'duplicateToItem',
          'originalPath', //originalPath
          'location',
          'locationName',
          'targetPath',
          'documentPath',
          'subjectOrTitle', //subjectOrTitle
          'senderOrCreated', //senderOrCreated
          'recipientsIntoLine', //recipientsIntoLine
          'recipientInCcLine', //recipientInCcLine
          'recipientsInBccLine',
          'toExpanded',
          'ccExpanded',
          'bccExpanded',
          'dgExpansionResult',
          'sent', //sent
          'hasAttachments',
          'importance',
          'isRead',
          'modifiedBy',
          'type',
          'received', //received
          'modifiedDate',
          'size',
          'decodeStatus',
          'complianceTag',
          'summary',
          'preservationOriginalUrl',
        ],
      });

      //* setup return data
      const data = {
        data: extractedData,
        sheetName: workbook.SheetNames[0],
      };

      return data;
    } catch (error) {
      console.log(error);
    }
  };

  //* get agent name from sheet
  getAgentName(
    emailTeamsDisplayName = [],
    agentsName = [],
    originalPath = '',
    sender = '',
  ) {
    if (
      emailTeamsDisplayName.indexOf(
        originalPath
          .split('/')
          [originalPath.split('/').length - 1].trim()
          .replace('.', ''),
      ) > -1 &&
      agentsName.indexOf(sender.split('<')[1].split('>')[0])
    )
      return sender
        .split('<')[1]
        .split('>')[0]
        .split('@')[0];
    else return originalPath.split('@')[0];
  }

  //* get agent in system
  getAgentInSystem(
    agentsInSystem: any,
    agentFirstName: string,
    agentSpecial: any,
  ) {
    const agents = agentsInSystem.filter((item: any) => {
      if (agentSpecial)
        return (
          item.firstName === agentSpecial.firstName &&
          item.lastName === agentSpecial.lastName
        );
      return item.firstName.toLowerCase() === agentFirstName;
    });

    return agents[0];
  }

  //* import data
  async importData(file: any, fileImport: any, userId: string): Promise<any> {
    //* get all email team in system
    const specialAgent = await this.agentRepository.find({
      where: {
        firstNameSpecial: Not(Equal('')),
        status: EntityStatus.ACTIVE,
      },
    });
    const emailTeamsFullProfile = await this.emailTeamsService.getEmailTeams();
    const emailTeamsDisplayName = [
      ...new Set(emailTeamsFullProfile.map(item => item.displayName)),
    ];

    //* get all agents in system
    const agentsFullProfile = await this.agentsService.getAgents();
    const agentsName = [
      ...new Set(agentsFullProfile.map(item => item.firstName.toLowerCase())),
    ];
    //* convert data to json
    const fileData = this.extractDataEmail(file.buffer);
    const data = fileData.data;

    //* remove row header
    data.shift();

    //* transform data follow entity

    const dataImport = [];
    for (let i = 0; i < data.length; i++) {
      const agentFirstName = this.getAgentName(
        emailTeamsDisplayName,
        agentsName,
        data[i]['originalPath'].toString().toLowerCase(),
        data[i]['senderOrCreated'].toString().toLowerCase(),
      );

      const agent = this.getAgentInSystem(
        agentsFullProfile,
        agentFirstName,
        specialAgent[
          specialAgent.findIndex(
            item => item.firstNameSpecial === agentFirstName,
          )
        ],
      );

      if (
        data[i]['originalPath'].toLowerCase().indexOf('recipient cache') < 0 &&
        data[i]['originalPath'].toLowerCase().indexOf('purges') < 0 &&
        data[i]['originalPath']
          .toLowerCase()
          .indexOf('tasksuggestions-defaultcollection') < 0 &&
        data[i]['originalPath'].toLowerCase().indexOf('personmetadata') < 0 &&
        data[i]['originalPath'].toLowerCase().indexOf('dailyinteractions') <
          0 &&
        data[i]['originalPath'].toLowerCase().indexOf('detailedmeetings') < 0 &&
        data[i]['originalPath'].toLowerCase().indexOf('dailyappointments') <
          0 &&
        data[i]['originalPath'].toLowerCase().indexOf('dailynetworksnapshot') <
          0 &&
        data[i]['originalPath'].toLowerCase().indexOf('emailactionstatistics') <
          0 &&
        data[i]['originalPath'].toLowerCase().indexOf('activitiesdaily') < 0 &&
        data[i]['originalPath'].toLowerCase().indexOf('managementoperations') <
          0 &&
        data[i]['originalPath'].toLowerCase().indexOf('activitiesweekly') < 0 &&
        data[i]['originalPath'].toLowerCase().indexOf('weeklyinteractions') <
          0 &&
        data[i]['originalPath']
          .toLowerCase()
          .indexOf('meetingactionstatistics') < 0 &&
        data[i]['originalPath'].toLowerCase().indexOf('importantcontact') < 0 &&
        data[i]['originalPath']
          .toLowerCase()
          .indexOf('cumulativenetworksnapshot') < 0 &&
        data[i]['originalPath'].toLowerCase().indexOf('spools') < 0 &&
        data[i]['originalPath'].toLowerCase().indexOf('activitiesmonthly') < 0
      ) {
        const rowData = {
          originalPath: data[i]['originalPath'],
          agent: agent,
          sent: data[i]['sent']
            ? moment_tz(data[i]['sent'], 'MM/DD/yyyy HH:mm:ss')
                .utc(true)
                .tz('America/Los_Angeles')
                .format('MM/DD/yyyy HH:mm:ss')
            : moment_tz(data[i]['received'], 'MM/DD/YYYY HH:mm:ss')
                .utc(true)
                .tz('America/Los_Angeles')
                .format('MM/DD/yyyy HH:mm:ss'),
          received: data[i]['received']
            ? moment_tz(data[i]['received'], 'MM/DD/YYYY HH:mm:ss')
                .utc(true)
                .tz('America/Los_Angeles')
                .format('MM/DD/yyyy HH:mm:ss')
            : moment_tz(data[i]['sent'], 'MM/DD/yyyy HH:mm:ss')
                .utc(true)
                .tz('America/Los_Angeles'),
          subjectOrTitle: data[i]['subjectOrTitle'].toString(),
          senderOrCreated: data[i]['senderOrCreated'].toString(),
          recipientsIntoLine: data[i]['recipientsIntoLine'].toString(),
          recipientInCcLine: data[i]['recipientInCcLine'].toString(),

          // TODO get userId from request
          creationUserId: userId,

          // TODO get userId from request
          lastModifiedUserId: userId,

          status: EntityStatus.ACTIVE,
          file: fileImport.identifiers[0].id,
        };
        dataImport.push(rowData);
      }
    }

    const queryRunner = this.connection.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const numberParameter = 13; //* count key in rowData object
      const numberRecord = Math.floor(65535 / numberParameter); //* this 5000 because 5000*13 < maximum parameter in postgres a 65535
      const step = Math.floor(dataImport.length / numberRecord);

      for (let i = 0; i < step + 1; i++) {
        const dataImportNumberRow = dataImport.splice(0, numberRecord);
        await getManager()
          .createQueryBuilder()
          .insert()
          .into(EmailActivities)
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

  //* get list email activity
  async getEmailActivities(filters) {
    const agents = filters.agentsId;
    const queryFilter = getManager()
      .createQueryBuilder(EmailActivities, 'email_activities')
      .innerJoinAndSelect('email_activities.agent', 'agent');

    const currentPage = +filters.page > 1 ? +filters.page : 1;
    if (filters.agentsId) {
      if (filters.agentsId.length > 0)
        queryFilter.andWhere('agent.id IN (:...agents)', { agents });
      else queryFilter.andWhere(`agent.id = null`);
    }
    if (filters.from)
      queryFilter.andWhere(
        `DATE(email_activities.sent) >= :from or DATE(email_activities.received) >= :from`,
        { from: filters.from },
      );
    if (filters.to)
      queryFilter.andWhere(
        `DATE(email_activities.sent) <= :to or DATE(email_activities.received) <= :to`,
        { to: filters.to },
      );
    if (filters.on)
      queryFilter.andWhere(
        `DATE(email_activities.sent) = :on or DATE(email_activities.received) = :on`,
        { on: filters.on },
      );
    queryFilter.andWhere(`email_activities.status = :status`, {
      status: 'active',
    });
    const length = await queryFilter.getCount();

    //* pagination
    let limit = 10;
    if (+filters.limit) limit = +filters.limit;
    const queryFilterPaginate = getManager()
      .createQueryBuilder(EmailActivities, 'email_activities')
      .innerJoinAndSelect('email_activities.agent', 'agent')
      .limit(limit)
      .offset((currentPage - 1) * limit)
      .orderBy('email_activities.sent', 'DESC');

    if (filters.agentsId) {
      if (filters.agentsId.length > 0)
        queryFilterPaginate.andWhere('agent.id IN (:...agents)', { agents });
      else queryFilterPaginate.andWhere(`agent.id = null`);
    }
    if (filters.on)
      queryFilterPaginate.andWhere(
        `DATE(email_activities.sent) = :on or DATE(email_activities.received) = :on`,
        { on: filters.on },
      );
    if (filters.from)
      queryFilterPaginate.andWhere(
        `DATE(email_activities.sent) >= :from or DATE(email_activities.received) >= :from`,
        { from: filters.from },
      );
    if (filters.to)
      queryFilterPaginate.andWhere(
        `DATE(email_activities.sent) <= :to or DATE(email_activities.received) <= :to`,
        { to: filters.to },
      );

    queryFilterPaginate.andWhere(`email_activities.status = :status`, {
      status: 'active',
    });

    const dataGlipAfterPaginate = await queryFilterPaginate
      .addSelect(['agent.firstName', 'agent.lastName'])
      .getMany();

    return {
      data: dataGlipAfterPaginate,
      pagination: {
        total: length,
        page: currentPage,
        limit: limit,
      },
    };

    // return emailActivities;
  }

  //* get email activity follow id
  async getEmailActivity(id: string) {
    const emailActivity = await this.emailActivitiesRepository.findOne({
      relations: ['file'],
      where: {
        id: id,
        status: EntityStatus.ACTIVE,
      },
    });
    if (!emailActivity)
      throw new NotFoundException('Could not find Email Activity');

    return emailActivity;
  }

  //* update email activity
  async updateEmailActivity(
    id: string,
    user: any,
    updateEmailActivityDto: any,
  ) {
    const infoActivity = await getManager()
      .createQueryBuilder(EmailActivities, 'email_activities')
      .andWhere(`email_activities.id = :id`, { id: id })
      .andWhere(`email_activities.status != :status`, {
        status: EntityStatus.DELETE,
      })
      .leftJoin('email_activities.agent', 'agent')
      .addSelect(['agent.id', 'agent.firstName', 'agent.lastName'])
      .getOne();
    if (!infoActivity) throw new NotFoundException(`Not found !`);

    const newData = _.assign(infoActivity, updateEmailActivityDto);
    newData.lastModifiedUserId = user.id;
    return await newData.save();
  }

  //* delete email activity
  async deleteEmailActivity(id: string, user: any) {
    const emailActivity = await this.getEmailActivity(id);
    if (!emailActivity)
      throw new NotFoundException('Could not find Email Activity');

    emailActivity.lastModifiedUserId = user.id;
    emailActivity.status = EntityStatus.DELETE;
    return emailActivity.save();
  }

  //* validate data
  async validateFileEmailActivity(file: any): Promise<any> {
    //* get all email team in system
    const emailTeamsFullProfile = await this.emailTeamsService.getEmailTeams();
    const specialAgent = await this.agentRepository.find({
      where: {
        firstNameSpecial: Not(Equal('')),
        status: EntityStatus.ACTIVE,
      },
    });

    const emailTeamsDisplayName = [
      ...new Set(emailTeamsFullProfile.map(item => item.displayName)),
    ];

    //* get all agents in system
    const agentsFullProfile = await this.agentsService.getAgents();
    const agentsName = [
      ...new Set(agentsFullProfile.map(item => item.firstName.toLowerCase())),
    ];

    //* convert data to json
    const fileData = this.extractDataEmail(file.buffer);
    const data = fileData.data;

    //* setup data column name
    const columnName = new Map();
    columnName.set('exportItemId', 'A');
    columnName.set('itemIdentity', 'B');
    columnName.set('documentID', 'C');
    columnName.set('selected', 'D');
    columnName.set('duplicateToItem', 'E');
    columnName.set('originalPath', 'F');
    columnName.set('location', 'G');
    columnName.set('locationName', 'H');
    columnName.set('targetPath', 'I');
    columnName.set('documentPath', 'J');
    columnName.set('subjectOrTitle', 'K');
    columnName.set('senderOrCreated', 'L');
    columnName.set('recipientsIntoLine', 'M');
    columnName.set('recipientInCcLine', 'N');
    columnName.set('recipientsInBccLine', 'O');
    columnName.set('toExpanded', 'P');
    columnName.set('ccExpanded', 'Q');
    columnName.set('bccExpanded', 'R');
    columnName.set('dgExpansionResult', 'S');
    columnName.set('sent', 'T');
    columnName.set('hasAttachments', 'U');
    columnName.set('importance', 'V');
    columnName.set('isRead', 'W');
    columnName.set('modifiedBy', 'X');
    columnName.set('type', 'Y');
    columnName.set('received', 'Z');
    columnName.set('modifiedDate', 'AA');
    columnName.set('size', 'AB');
    columnName.set('decodeStatus', 'AC');
    columnName.set('complianceTag', 'AD');
    columnName.set('summary', 'AE');
    columnName.set('preservationOriginalUrl', 'AF');

    //* remove row header
    data.shift();

    const dataError = [];

    //* sort data error follow row
    const sortDataErrorFollowRow = (a: any, b: any) => {
      if (a.row < b.row) return -1;
      if (a.row > b.row) return 1;
      return 0;
    };

    //* validate data need transfer
    const errorAgent = [];
    for (let i = 0; i < data.length; i++) {
      try {
        const agentFirstName = this.getAgentName(
          emailTeamsDisplayName,
          agentsName,
          data[i]['originalPath'].toString().toLowerCase(),
          data[i]['senderOrCreated'].toString().toLowerCase(),
        );
  
        const agent = this.getAgentInSystem(
          agentsFullProfile,
          agentFirstName,
          specialAgent[
            specialAgent.findIndex(
              item => item.firstNameSpecial === agentFirstName,
            )
          ],
        );
  
        if (!agent && errorAgent.indexOf(agentFirstName) === -1) {
          errorAgent.push(agentFirstName);
          dataError.push({
            value: agentFirstName,
            sheetName: fileData.sheetName,
            row: i + 2,
            column: 'agent (merge from Original Path and Sender or Created)',
            message:
              'Agent (is filtered from data in files) that are not on the system',
            status: NotificationStatus.ERROR,
          });
        }
      } catch(e) {
        throw new InternalServerErrorException(JSON.stringify(data[i]));
      }
    }

    //* before validate data need transfer => list newAgents => create agents
    // const newAgents = [...new Set(dataError.map(item => {
    //   if (item.column === 'agent (merge from Original Path and Sender or Created)') return item.value
    // }))];
    // if (newAgents.length > 0) {
    //   const addAgents = newAgents.map(item => {
    //     const agentFirstName = item.split('')[0].toUpperCase() + item.split('').splice(1).toString().replace(/,/g, '');
    //     return this.agentsService.createAgent({ firstName: agentFirstName, lastName: '', originalName: '', status: EntityStatus.INACTIVE }, user);
    //   });
    //   await Promise.all(addAgents);
    // }

    //* validate data with yup
    const yupSchema = importFileSchema();

    try {
      await yupSchema.validate(data, { abortEarly: false });
    } catch (err) {
      err.inner.map((item: any) => {
        const path = item.path
          .replace('[', '')
          .replace(']', '')
          .split('.');
        dataError.push({
          value: item.params.originalValue,
          sheetName: fileData.sheetName,
          row: Number(path[0]) + 2,
          column: columnName.get(path[1]),
          message: item.message,
          status: NotificationStatus.ERROR,
        });
      });
    }

    // return [...new Set(dataError.map(item => item.value).sort())];
    return dataError.sort(sortDataErrorFollowRow);
  }
}
