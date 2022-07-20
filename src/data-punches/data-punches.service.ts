import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { AddPunchsActivitiesDto } from './dto/add-data-punchs.dto';
import { PunchActivities } from './entity/punch.entity';
import { PunchActivitiesRepository } from './repository/data-punches.repository';
import { EntityStatus } from '../utils/entity-status';
import { NotificationStatus } from '../utils/notification-status';
import { UpdatePunchsActivitiesDto } from './dto/update-data-punchs.dto';
import { Connection, createQueryBuilder, Not } from 'typeorm';
import * as moment from 'moment';
import * as XLSX from 'xlsx';
import PunchSchema from './schema/punchSchema';
import { AgentRepository } from 'src/agents/repository/agent.repository';

@Injectable()
export class DataPunchesService {
  constructor(
    @InjectRepository(PunchActivitiesRepository)
    private punchActivitiesRepository: PunchActivitiesRepository,
    private agentRepository: AgentRepository,
    private readonly connection: Connection,
  ) {}

  async getPunchActivities(
    dateFrom: string,
    dateTo: string,
    id: string,
  ): Promise<PunchActivities[]> {
    try {
      if (dateFrom && dateTo && id) {
        const punchActivitiesOfAgent = await createQueryBuilder(
          PunchActivities,
          'punch-activities',
        )
          .innerJoinAndSelect('punch-activities.agent', 'agent')
          .where('agent.id = :id', {
            id: id,
          })
          .addOrderBy('punch-activities.punchDate', 'ASC')
          .getMany();

        if (punchActivitiesOfAgent) {
          const punchs = punchActivitiesOfAgent.filter(item => {
            const from = moment(dateFrom, 'YYYY-MM-DD').toDate();
            const to = moment(dateTo, 'YYYY-MM-DD').toDate();
            if (
              moment(item.punchDate).isSame(from, 'day') ||
              moment(item.punchDate).isSame(to, 'day')
            ) {
              return true;
            } else {
              return moment(item.punchDate).isBetween(from, to);
            }
          });
          return punchs;
        } else {
          throw new NotFoundException(`Not found Punch with id : ${id}`);
        }
      } else {
        const punchActivities = await this.punchActivitiesRepository.find({
          relations: ['agent'],
          where: {
            status: EntityStatus.ACTIVE,
          },
          order: {
            punchDate: 'ASC',
          },
        });
        if (punchActivities) {
          return punchActivities;
        } else {
          throw new NotFoundException(`Not found Punch Activities !!`);
        }
      }
    } catch (err) {
      return err;
    }
  }

  async addPunchActivities(
    addPunchActivitiesDto: AddPunchsActivitiesDto,
  ): Promise<PunchActivities> {
    const agent = await this.agentRepository.findOne({
      where: {
        id: addPunchActivitiesDto.agentId,
        status: EntityStatus.ACTIVE,
      },
    });
    if (agent) {
      const punchActivities = new PunchActivities();
      (punchActivities.agent = agent),
        (punchActivities.punchDate = addPunchActivitiesDto.punchDate),
        (punchActivities.totalTime = addPunchActivitiesDto.totalTime),
        (punchActivities.totalLunch = addPunchActivitiesDto.totalLunch),
        (punchActivities.totalWork = addPunchActivitiesDto.totalWork),
        (punchActivities.checkIn = addPunchActivitiesDto.checkIn),
        (punchActivities.checkOut = addPunchActivitiesDto.checkOut),
        (punchActivities.startLunch = addPunchActivitiesDto.startLunch),
        (punchActivities.endLunch = addPunchActivitiesDto.endLunch);
      return punchActivities.save();
    } else {
      throw new NotFoundException(`Not Found Agent !!`);
    }
  }

  async getPunchActivitiesById(id: string): Promise<PunchActivities> {
    try {
      const punch = await this.punchActivitiesRepository.findOne({
        relations: ['agent'],
        where: {
          id: id,
          status: EntityStatus.ACTIVE,
        },
      });
      if (punch) {
        return punch;
      } else {
        throw new NotFoundException('Not found Punch Activities');
      }
    } catch (err) {
      return err;
    }
  }

  async updatePunchActivities(
    updatePunchActivitiesDto: UpdatePunchsActivitiesDto,
    id: string,
  ): Promise<PunchActivities> {
    try {
      const punchActivities = await this.punchActivitiesRepository.findOne({
        relations: ['agent'],
        where: {
          id: id,
          status: EntityStatus.ACTIVE,
        },
      });
      if (punchActivities) {
        punchActivities.totalTime = updatePunchActivitiesDto.totalTime;
        punchActivities.totalLunch = updatePunchActivitiesDto.totalLunch;
        punchActivities.totalWork = updatePunchActivitiesDto.totalWork;
        punchActivities.punchDate = updatePunchActivitiesDto.punchDate;
        punchActivities.checkIn = updatePunchActivitiesDto.checkIn;
        punchActivities.checkOut = updatePunchActivitiesDto.checkOut;
        punchActivities.startLunch = updatePunchActivitiesDto.startLunch;
        punchActivities.endLunch = updatePunchActivitiesDto.endLunch;
        punchActivities.status = updatePunchActivitiesDto.status;
        return punchActivities.save();
      } else {
        throw new NotFoundException(`Not found Punch Activities !!`);
      }
    } catch (err) {
      return err;
    }
  }

  async deletePunchActivities(id: string): Promise<PunchActivities> {
    try {
      const punch = await this.punchActivitiesRepository.findOne({
        where: {
          id: id,
          status: Not(EntityStatus.DELETE),
        },
      });
      if (punch) {
        punch.status = EntityStatus.DELETE;
        return punch.save();
      } else {
        throw new NotFoundException(`Not found Punch Activities !!!`);
      }
    } catch (err) {
      return err;
    }
  }

  public extractDataPunch = (file: Buffer) => {
    try {
      const workbook = XLSX.read(file, { type: 'buffer' });
      const ws = workbook.Sheets[workbook.SheetNames[0]];
      //* get end record
      let endRow = '';
      for (
        let rowNum = XLSX.utils.decode_range(ws['!ref']).s.r;
        rowNum <= XLSX.utils.decode_range(ws['!ref']).e.r;
        rowNum++
      ) {
        const cellRef = XLSX.utils.encode_cell({ r: rowNum, c: 1 });
        const cell = ws[cellRef];
        if (cell) endRow = cellRef;
      }
      //* remove first column
      ws['!ref'] = 'A2:F' + endRow.slice(1);
      const extractedData = XLSX.utils.sheet_to_json(ws, {
        defval: '',
        raw: false,
        header: [
          'lastName',
          'firstName',
          'empty',
          'punchDate',
          'checkIn',
          'checkOut',
        ],
      });

      const customData = {
        data: extractedData,
        sheetName: workbook.SheetNames[0],
      };

      return customData;
    } catch (error) {
      console.log(error);
    }
  };

  private sortRecord = (a, b) => {
    if (
      a['firstName'].trim() + ' ' + a['lastName'].trim() <
      b['firstName'].trim() + ' ' + b['lastName'].trim()
    ) {
      return -1;
    }
    if (
      a['firstName'].trim() + ' ' + a['lastName'].trim() >
      b['firstName'].trim() + ' ' + b['lastName'].trim()
    ) {
      return 1;
    }
    return 0;
  };

  async importPunch(file: any): Promise<any> {
    try {
      const fileData = this.extractDataPunch(file.buffer);

      const data = fileData.data;

      let count = 0;
      let firstCheck = {};
      let secondCheck = {};
      data.sort(this.sortRecord);
      for (let i = 0; i < data.length; i++) {
        if (!data[i]['punchDate'])
          throw new NotFoundException('Not Found Agent');
        const fullName =
          data[i]['firstName'].trim() + ' ' + data[i]['lastName'].trim();
        const agent = await this.agentRepository.findOne({
          where: {
            originalName: fullName,
            status: EntityStatus.ACTIVE,
          },
        });
        if (!agent) throw new NotFoundException('Not Found Agent');
        const punch = new PunchActivities();
        punch.agent = agent;
        punch.punchDate = data[i]['punchDate'];
        if (
          data[i + 1] !== undefined &&
          fullName ===
            data[i + 1]['firstName'].trim() +
              ' ' +
              data[i + 1]['lastName'].trim()
        ) {
          count = count + 1;
          firstCheck = data[i];
        } else {
          count = count + 1;
          secondCheck = data[i];
          // Nếu chỉ có 1 dòng --> Not lunch
          if (count === 1) {
            punch.startLunch = 'Not Check';
            punch.endLunch = 'Not Check';
            if (
              moment(data[i]['checkIn'], 'H:mm', true).isValid() &&
              moment(data[i]['checkOut'], 'H:mm', true).isValid()
            ) {
              punch.checkIn = moment(data[i]['checkIn'], 'H:mm').format(
                'HH:mm',
              );
              punch.checkOut = moment(data[i]['checkOut'], 'H:mm').format(
                'HH:mm',
              );
              const timeStart = moment(data[i]['checkIn'], 'H:mm');
              const timeEnd = moment(data[i]['checkOut'], 'H:mm');
              const hourTime = Math.floor(
                timeEnd.diff(timeStart) / (60000 * 60),
              );
              const minutesTime =
                timeEnd.diff(timeStart) / 60000 - hourTime * 60;
              punch.totalTime = `${hourTime} hours ${minutesTime} mins`;
              punch.totalWork = `${hourTime} hours ${minutesTime} mins`;
            } else {
              if (moment(data[i]['checkIn'], 'H:mm', true).isValid()) {
                punch.checkIn = moment(data[i]['checkIn'], 'H:mm').format(
                  'HH:mm',
                );
                punch.checkOut = data[i]['checkOut'];
              }
              if (moment(data[i]['checkOut'], 'H:mm', true).isValid()) {
                punch.checkIn = data[i]['checkIn'];
                punch.checkOut = moment(data[i]['checkOut'], 'H:mm').format(
                  'HH:mm',
                );
              }
              if (
                !moment(data[i]['checkIn'], 'H:mm', true).isValid() &&
                !moment(data[i]['checkOut'], 'H:mm', true).isValid()
              ) {
                punch.checkIn = data[i]['checkIn'];
                punch.checkOut = data[i]['checkOut'];
              }
            }
          }
          // Nếu có 2 dòng
          if (count === 2) {
            if (
              // moment(firstCheck['checkIn'], 'H:mm', true).isValid() &&
              moment(secondCheck['checkOut'], 'H:mm', true).isValid()
            ) {
              if (
                moment(secondCheck['checkIn'], 'H:mm', true).isValid() &&
                moment(secondCheck['checkIn'], 'H:mm').diff(
                  moment(firstCheck['checkIn'], 'H:mm'),
                ) > 0
              ) {
                punch.checkIn = moment(firstCheck['checkIn'], 'H:mm').format(
                  'HH:mm',
                );
                punch.checkOut = moment(secondCheck['checkOut'], 'H:mm').format(
                  'HH:mm',
                );
                punch.startLunch = firstCheck['checkOut'];
                punch.endLunch = secondCheck['checkIn'];
                const timeStart = moment(firstCheck['checkIn'], 'H:mm');
                const timeEnd = moment(secondCheck['checkOut'], 'H:mm');
                const hourTime = Math.floor(
                  timeEnd.diff(timeStart) / (60000 * 60),
                );
                const minutesTime =
                  timeEnd.diff(timeStart) / 60000 - hourTime * 60;
                punch.totalTime = `${hourTime} hours ${minutesTime} mins`;
                if (
                  moment(firstCheck['checkOut'], 'H:mm', true).isValid() &&
                  moment(secondCheck['checkIn'], 'H:mm', true).isValid()
                ) {
                  const start = moment(firstCheck['checkOut'], 'H:mm');
                  const end = moment(secondCheck['checkIn'], 'H:mm');
                  const hour = Math.floor(end.diff(start) / (60000 * 60));
                  const minutes = end.diff(start) / 60000 - hour * 60;
                  punch.totalLunch = `${hour} hours ${minutes} mins`;
                  const totalTimeMoment = moment(
                    `${hourTime}:${minutesTime}`,
                    'H,mm',
                  );
                  const totalLunchMoment = moment(`${hour}:${minutes}`, 'H,mm');
                  const hourWork = Math.floor(
                    totalTimeMoment.diff(totalLunchMoment) / (60000 * 60),
                  );
                  const minsWork =
                    totalTimeMoment.diff(totalLunchMoment) / 60000 -
                    hourWork * 60;
                  punch.totalWork = `${hourWork} hours ${minsWork} mins`;
                }
              }
              if (
                !moment(secondCheck['checkIn'], 'H:mm', true).isValid() &&
                moment(secondCheck['checkOut'], 'H:mm').diff(
                  moment(firstCheck['checkIn'], 'H:mm'),
                ) > 0
              ) {
                punch.checkIn = moment(firstCheck['checkIn'], 'H:mm').format(
                  'HH:mm',
                );
                punch.checkOut = moment(secondCheck['checkOut'], 'H:mm').format(
                  'HH:mm',
                );
                punch.startLunch = firstCheck['checkOut'];
                punch.endLunch = secondCheck['checkIn'];
                const timeStart = moment(firstCheck['checkIn'], 'H:mm');
                const timeEnd = moment(secondCheck['checkOut'], 'H:mm');
                const hourTime = Math.floor(
                  timeEnd.diff(timeStart) / (60000 * 60),
                );
                const minutesTime =
                  timeEnd.diff(timeStart) / 60000 - hourTime * 60;
                punch.totalTime = `${hourTime} hours ${minutesTime} mins`;
              }
              if (
                moment(firstCheck['checkIn'], 'H:mm', true).isValid() &&
                moment(firstCheck['checkIn'], 'H:mm').diff(
                  moment(secondCheck['checkIn'], 'H:mm'),
                ) > 0
              ) {
                punch.checkIn = moment(secondCheck['checkIn'], 'H:mm').format(
                  'HH:mm',
                );
                punch.checkOut = moment(firstCheck['checkOut'], 'H::mm').format(
                  'HH:mm',
                );
                punch.startLunch = secondCheck['checkOut'];
                punch.endLunch = firstCheck['checkIn'];
                const timeStart = moment(secondCheck['checkIn'], 'H:mm');
                const timeEnd = moment(firstCheck['checkOut'], 'H:mm');
                const hourTime = Math.floor(
                  timeEnd.diff(timeStart) / (60000 * 60),
                );
                const minutesTime =
                  timeEnd.diff(timeStart) / 60000 - hourTime * 60;
                punch.totalTime = `${hourTime} hours ${minutesTime} mins`;
                if (
                  moment(secondCheck['checkOut'], 'H:mm', true).isValid() &&
                  moment(firstCheck['checkIn'], 'H:mm', true).isValid()
                ) {
                  const start = moment(secondCheck['checkOut'], 'H:mm');
                  const end = moment(firstCheck['checkIn'], 'H:mm');
                  const hour = Math.floor(end.diff(start) / (60000 * 60));
                  const minutes = end.diff(start) / 60000 - hour * 60;
                  punch.totalLunch = `${hour} hours ${minutes} mins`;
                  const totalTimeMoment = moment(
                    `${hourTime}:${minutesTime}`,
                    'H,mm',
                  );
                  const totalLunchMoment = moment(`${hour}:${minutes}`, 'H,mm');
                  const hourWork = Math.floor(
                    totalTimeMoment.diff(totalLunchMoment) / (60000 * 60),
                  );
                  const minsWork =
                    totalTimeMoment.diff(totalLunchMoment) / 60000 -
                    hourWork * 60;
                  punch.totalWork = `${hourWork} hours ${minsWork} mins`;
                }
              }
              if (
                !moment(firstCheck['checkIn'], 'H:mm', true).isValid() &&
                moment(firstCheck['checkOut'], 'H:mm').diff(
                  moment(secondCheck['checkIn'], 'H:mm'),
                ) > 0
              ) {
                punch.checkIn = moment(secondCheck['checkIn'], 'H:mm').format(
                  'HH:mm',
                );
                punch.checkOut = moment(firstCheck['checkOut'], 'H:mm').format(
                  'HH:mm',
                );
                punch.startLunch = secondCheck['checkOut'];
                punch.endLunch = firstCheck['checkIn'];
                const timeStart = moment(secondCheck['checkIn'], 'H:mm');
                const timeEnd = moment(firstCheck['checkOut'], 'H:mm');
                const hourTime = Math.floor(
                  timeEnd.diff(timeStart) / (60000 * 60),
                );
                const minutesTime =
                  timeEnd.diff(timeStart) / 60000 - hourTime * 60;
                punch.totalTime = `${hourTime} hours ${minutesTime} mins`;
              }
            } else {
              if (moment(firstCheck['checkIn'], 'H:mm', true).isValid()) {
                punch.checkIn = moment(firstCheck['checkIn'], 'H:mm').format(
                  'HH:mm',
                );
              } else {
                punch.checkIn = firstCheck['checkIn'];
              }
              punch.checkOut = secondCheck['checkOut'];
              punch.startLunch = 'Not Check';
              punch.endLunch = 'Not Check';
            }
          }
          if (count === 3) {
            punch.checkIn = 'More 2 rows';
            punch.checkOut = 'More 2 rows';
          }
          count = 0;
          await punch.save();
        }
      }
    } catch (err) {
      return err;
    }
  }

  async validatePunch(file: any): Promise<any> {
    const agents = await this.agentRepository.find({
      where: {
        status: EntityStatus.ACTIVE,
      },
    });
    const agentData = [];
    agents.forEach(item => {
      agentData.push(item.originalName);
    });
    const fileData = this.extractDataPunch(file.buffer);

    const data = fileData.data;

    //* setup data column name
    const columnName = new Map();
    columnName.set('lastName', 'A');
    columnName.set('firstName', 'B');
    columnName.set('empty', 'C');
    columnName.set('punchDate', 'D');
    columnName.set('checkIn', 'E');
    columnName.set('checkOut', 'F');

    const dataSchema = PunchSchema(agentData);
    try {
      await dataSchema.validate(data, { abortEarly: false });
    } catch (error) {
      const errorResult = [];
      for (let i = 0; i < error.inner.length; i++) {
        const path = error.inner[i].path
          .replace('[', '')
          .replace(']', '')
          .split('.');
        errorResult.push({
          value: error.inner[i].params.originalValue,
          row: Number(path[0]) + 1,
          column: columnName.get(path[1]),
          sheetName: fileData.sheetName,
          message: error.inner[i].message,
          status: NotificationStatus.ERROR,
        });
      }
      return errorResult;
    }
  }

  async getAgents(): Promise<any> {
    const agents = await this.agentRepository.find({
      where: {
        status: EntityStatus.ACTIVE,
        isPrimary: true,
      },
    });
    // const agentData = [];
    // agents.forEach(item => {
    //     agentData.push(item.originalName);
    // })
    return agents;
  }
}
