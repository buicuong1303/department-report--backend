import { Injectable, NotFoundException } from '@nestjs/common';
import * as XLSX from 'xlsx';
import * as moment from 'moment';
import { InjectRepository } from '@nestjs/typeorm';
import { PhoneActivitiesRepository } from './repository/data-phones.repository';
import { Connection, getManager, Not } from 'typeorm';
import { PhoneActivities } from './entity/phone-activities.entity';
import { EntityStatus } from 'src/utils/entity-status';
import { calcDurationPhone, formatDurationPhone } from 'src/utils/calcTime';
import { UpdatePhoneDto } from './dto/update-phone.dto';
import * as _ from 'lodash';
import { AgentRepository } from 'src/agents/repository/agent.repository';
import { phoneValidateSchema } from './schema/phone.schema';
import { NotificationStatus } from 'src/utils/notification-status';
import { ConfigVariableRepository } from 'src/config-variable/repository/config-variable.repository';
@Injectable()
export class DataPhonesService {
  constructor(
    @InjectRepository(PhoneActivitiesRepository)
    private readonly phoneActivityRepository: PhoneActivitiesRepository,

    @InjectRepository(AgentRepository)
    private readonly agentRepository: AgentRepository,

    @InjectRepository(ConfigVariableRepository)
    private readonly variableRepository: ConfigVariableRepository,

    private readonly connection: Connection,
  ) {}

  private getPosition(string) {
    // return string.split(subString, index).join(subString).length;
    const spaces = [];
    for (const index in string) {
      if (string[index] === ' ') {
        spaces.push(index);
      }
    }
    if (spaces.length >= 2) {
      return spaces[1];
    } else {
      return -1;
    }
  }

  private convertNumberPhoneToLineName(lineNumber: string, mainLines): string {
    const lineName = mainLines.find(item => item.key.replace(/[^0-9]/g, '') == lineNumber.replace(/[^0-9]/g, ''));
    return lineName ? lineName.value : '';
  }
  private convertToColumnName(header: string) {
    switch (header) {
      case 'agent':
        return 'G';
      default:
        return header;
    }
  }

  private extractDataPhone(file: Buffer, variables) {
    try {
      const frontDesk = variables.find(item => item.type == 'DESK_PHONE').value;
      const mainLines = variables.filter(item => item.type == 'MAIN_LINE');
      const workbook = XLSX.read(file, { type: 'buffer' });
      const ws = workbook.Sheets[workbook.SheetNames[0]];
      //* get end record and indexing
      let firstIncoming = {};
      let outgoingConnected = [];
      let isMainLineIncoming = false;
      let isOutgoingSession = false;
      let isAcceptedDirect = false;
      let directCall = {};

      //* remove first column
      const extractedData = XLSX.utils.sheet_to_json(ws, {
        defval: '',
        range: 0,
        raw: false,
      });

      const newData = [];
      const lengthData = extractedData.length;
      //* logic business
      for (let i = 0; i < lengthData; i++) {
        if (
          extractedData[i]['Type'].trim().toLowerCase() == 'voice' &&
          extractedData[i]['Duration'].trim().toLowerCase() != 'in progress'
        ) {
          directCall = {};
          isAcceptedDirect = false;
          //* out bound
          if (
            extractedData[i]['Direction'].trim().toLowerCase() == 'outgoing'
          ) {
            isOutgoingSession = true;
            const tmpObj = {};
            //* callId là sđt khách
            tmpObj['callId'] = extractedData[i]['To'];
            tmpObj['inOrOut'] = 'Outbound';
            tmpObj['dateTimeCall'] =
              moment(extractedData[i]['Date'], 'MM-DD-YYYY').format(
                'MM-DD-YYYY',
              ) +
              ' ' +
              moment(extractedData[i]['Time'], 'h:mm:ss A').format('HH:mm:ss');
            tmpObj['line'] = '';
            tmpObj['duration'] = formatDurationPhone(
              extractedData[i]['Duration'],
            );

            if (extractedData[i]['From'] != '') {
              if (
                extractedData[i]['From']
                  .trim()
                  .toLowerCase()
                  .includes('fd 1 backup')
              ) {
                tmpObj['agent'] = {
                  name: frontDesk.trim(),
                  index: i + 2, //* index + 1 + offset header(1)
                };
              } else {
                const indexSecondSpace = this.getPosition(
                  extractedData[i]['From'].trim(),
                );
                if (indexSecondSpace > -1) {
                  tmpObj['agent'] = {
                    name: extractedData[i]['From']
                      .slice(0, indexSecondSpace)
                      .trim(),
                    index: i + 2, //* index + 1 + offset header(1)
                  };
                } else {
                  //* TH sử dụng web-phone
                  tmpObj['agent'] = {
                    name: extractedData[i]['Extension']
                      .slice(extractedData[i]['Extension'].indexOf('-') + 1)
                      .trim(),
                    index: i + 2, //* index + 1 + offset header(1)
                  };
                }
              }
            } else {
              tmpObj['agent'] = {
                name: '',
                index: i + 2,
              };
            }
            newData.push(tmpObj);
          }
          //* inbound
          else if (
            extractedData[i]['From'].length != 4 &&
            extractedData[i]['Direction'].trim().toLowerCase() == 'incoming' &&
            extractedData[i]['Action Result'].trim().toLowerCase() == 'accepted'
          ) {
            //* bắt đầu cuộc gọi incoming
            isOutgoingSession = false;

            firstIncoming = Object.assign({}, extractedData[i]);
            if (
              mainLines.some(item =>
                extractedData[i + 1]['Extension']
                  .toLowerCase()
                  .includes(item.value.toLowerCase()),
              )
            ) {
              isMainLineIncoming = true;
            } else {
              isMainLineIncoming = false;
            }
          }
        } else {
          const tmpObj = {};
          //* những cuộc gọi trong một phiên outgoing
          if (isOutgoingSession) {
            if (
              extractedData[i]['Type'] != '' ||
              (extractedData[i + 1] && extractedData[i + 1]['Type'] != '')
            ) {
              isOutgoingSession = false;
            }
            continue;
          }

          if (!firstIncoming || Object.keys(firstIncoming).length === 0) {
            continue;
          }
          //* những cuộc gọi trong một phiên incoming

          if (!isMainLineIncoming) {
            //-------DIRECT-------------
            //* check nếu có cuộc gọi incoming trong phiên direct đc accepted thì xử lý
            if (
              extractedData[i]['Direction'].toLowerCase() == 'incoming' &&
              extractedData[i]['Action Result'].trim().toLowerCase() ==
                'accepted'
            ) {
              isAcceptedDirect = true;
              directCall['agent'] = {
                //* incoming direct thi lấy agent từ extension
                name: extractedData[i]['Extension']
                  .slice(extractedData[i]['Extension'].indexOf('-') + 1)
                  .trim(),
                index: i + 2, //* index + 1 + offset header(1)
              };

              directCall['callId'] = firstIncoming['From'];
              directCall['dateTimeCall'] =
                moment(firstIncoming['Date'], 'MM-DD-YYYY').format(
                  'MM-DD-YYYY',
                ) +
                ' ' +
                moment(firstIncoming['Time'], 'h:mm:ss A').format('HH:mm:ss');
              directCall['inOrOut'] = 'Inbound';
              //* line là số cty, khách có thể gọi vào line hoặc gọi trực tiếp cho agent
              directCall['line'] = 'Direct';
            } else if (
              //* tìm cuộc gọi outgoing trong phiên direct có result là call connected
              extractedData[i]['Direction'].toLowerCase() == 'outgoing' &&
              extractedData[i]['Action Result'].trim().toLowerCase() ==
                'call connected'
            ) {
              //* nếu trc đó có bất kỳ cuộc gọi incoming nào đc accepted thì mới xử lý
              if (isAcceptedDirect) {
                directCall['duration'] = formatDurationPhone(
                  extractedData[i]['Duration'],
                );
                newData.push(directCall);
              }
            } else continue;
          } else {
            //* ------------------MAIN LINE-------------------
            if (
              extractedData[i]['Direction'].trim().toLowerCase() ==
                'outgoing' &&
              extractedData[i]['Action Result'].trim().toLowerCase() ==
                'call connected'
            ) {
              //* thêm những cuộc gọi outgoing thành công vào mảng để tính duration
              extractedData[i]['index'] = i + 2;
              outgoingConnected.push(extractedData[i]);
            }

            //* kiểm tra đã kết thúc phiên chưa, nếu kết thúc thì xử lý
            if (
              (extractedData[i + 1] && extractedData[i + 1]['Type'] != '') ||
              i + 1 == lengthData
            ) {
              //* lấy người bắt máy đầu tiên
              if (outgoingConnected[0]) {
                if (
                  outgoingConnected[0]['Name'] &&
                  outgoingConnected[0]['Name'].includes('fd 1 backup')
                ) {
                  tmpObj['agent'] = {
                    name: frontDesk.trim(),
                    index: i + 2,
                  };
                } else {
                  tmpObj['agent'] = {
                    name: outgoingConnected[0]['Name'].trim(),
                    index: outgoingConnected[0]['index'], //* index + 1 + offset header(1)
                  };
                }
                //* callId là sđt khách
                tmpObj['callId'] = firstIncoming['From'];
                tmpObj['dateTimeCall'] =
                  moment(outgoingConnected[0]['Date'], 'MM-DD-YYYY').format(
                    'MM-DD-YYYY',
                  ) +
                  ' ' +
                  moment(outgoingConnected[0]['Time'], 'h:mm:ss A').format(
                    'HH:mm:ss',
                  );
                tmpObj['inOrOut'] = 'Inbound';
                //* line là số cty, khách có thể gọi vào line hoặc gọi trực tiếp cho agent
                tmpObj['line'] = this.convertNumberPhoneToLineName(
                  firstIncoming['To'],
                  mainLines,
                );
                tmpObj['duration'] = formatDurationPhone(
                  outgoingConnected[0]['Duration'],
                );

                //* lấy những cuộc gọi đc transfer(transfer là trường hợp agent đầu tiên bắt mấy sau đó giao cho agent khác phục vụ)

                const listCallTransfer = outgoingConnected.filter(
                  item =>
                    item['Action'].trim().toLowerCase() == 'park location' &&
                    item['Forwarded To'].length == 4,
                );
                //* lấy những agent đc transfer
                const listTransferAgent = listCallTransfer.filter(
                  (item, index) =>
                    listCallTransfer.findIndex(
                      item2 => item2['Name'] == item['Name'],
                    ) == index,
                );

                //* tính duration theo những lần bắt máy (park location) của từng agent
                if (listTransferAgent.length > 0) {
                  listTransferAgent.forEach(item1 => {
                    //* TH agent đầu tiên bắt máy nhưng các agent còn lại bận,
                    //* nên agent đầu tiên phải bắt máy thêm một lần nữa để hủy
                    if (item1['Name'] == outgoingConnected[0]['Name']) {
                      const durations = listCallTransfer.reduce(
                        (total, item2) => {
                          if (item2['Name'] == outgoingConnected[0]['Name'])
                            return (total = [...total, item2['Duration']]);
                          return total;
                        },
                        [],
                      );

                      tmpObj['duration'] = calcDurationPhone([
                        ...durations,
                        outgoingConnected[0]['Duration'],
                      ]);
                    }
                    //*TH agent đầu tiên bắt máy, sau đó transfer cho người agent khác
                    else {
                      const listCallTransferAgent = listCallTransfer.filter(
                        item2 => item2['Name'] == item1['Name'],
                      );
                      if (listCallTransferAgent.length >= 1) {
                        const newTmpObj = {};
                        if (
                          listCallTransferAgent[0]['Name']
                            .trim()
                            .toLowerCase()
                            .includes('fd 1 backup')
                        ) {
                          newTmpObj['agent'] = {
                            name: frontDesk.trim(),
                            index: i + 2,
                          };
                        } else {
                          newTmpObj['agent'] = item1['Name'];
                          newTmpObj['agent'] = {
                            name: item1['Name'].trim(),
                            index: i + 2, //* index + 1 + offset header(1)
                          };
                        }

                        newTmpObj['callId'] = firstIncoming['From'];
                        newTmpObj['dateTimeCall'] =
                          moment(item1['Date'], 'MM-DD-YYYY').format(
                            'MM-DD-YYYY',
                          ) +
                          ' ' +
                          moment(item1['Time'], 'h:mm:ss A').format('HH:mm:ss');

                        const durations = listCallTransferAgent.map(
                          item => item['Duration'],
                        );
                        newTmpObj['duration'] = calcDurationPhone(durations);
                        newTmpObj['inOrOut'] = 'Inbound';
                        newTmpObj['line'] = this.convertNumberPhoneToLineName(
                          firstIncoming['To'],
                          mainLines,
                        );
                        newData.push(newTmpObj);
                      }
                    }
                  });
                }
                newData.push(tmpObj);
              }
              //! else ????? check logic
              outgoingConnected = [];
              firstIncoming = null;
            }
          }
        }
      }

      const data = {
        data: newData,
        sheetName: workbook.SheetNames[0],
      };

      return data;
    } catch (error) {
      console.log(error);
    }
  }

  async importDataPhone(file, fileImport, userId: string): Promise<any> {
    const agents = await this.agentRepository.find({
      where: {
        status: EntityStatus.ACTIVE,
      },
    });
    const variables = await this.variableRepository.find({
      where: {
        status: EntityStatus.ACTIVE,
      },
    });
    const fileData = this.extractDataPhone(file.buffer, variables);
    const data = fileData.data;
    const dataLength = fileData.data.length;
    for (let i = 0; i < dataLength; i++) {
      let infoAgent = null;
      for (let j = 0; j < agents.length; j++) {
        if (
          data[i]['agent']['name'].toLowerCase() ===
          agents[j].firstName.toLowerCase() +
            ' ' +
            agents[j].lastName.toLowerCase()
        ) {
          infoAgent = agents[j];
          break;
        }
        //   // const infoAgent = agents.find((item, index) => {
        //   //   return data[i]['agent']['name'].split(' ')[0] === item.firstName
        //   // });
      }
      if (infoAgent) {
        data[i] = { ...data[i], agent: infoAgent.id };
      }
      data[i]['file'] = fileImport.identifiers[0].id;
      data[i]['creationUserId'] = userId;
      data[i]['lastModifiedUserId'] = userId;
    }

    const queryRunner = this.connection.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      await getManager()
        .createQueryBuilder()
        .insert()
        .into(PhoneActivities)
        .values(data)
        .execute();
    } catch (error) {
      console.log(error);

      queryRunner.rollbackTransaction();
      return error;
    } finally {
      // you need to release a queryRunner which was manually instantiated

      await queryRunner.release();
    }
  }

  async getDataPhone(filters): Promise<any> {
    try {
      const agents = filters.agentsId;
      const queryFilter = getManager()
        .createQueryBuilder(PhoneActivities, 'phone_activities')
        .innerJoinAndSelect('phone_activities.agent', 'agent');

      const currentPage = +filters.page > 1 ? +filters.page : 1;

      if (filters.agentsId) {
        if (filters.agentsId.length > 0)
          queryFilter.andWhere('agent.id IN (:...agents)', { agents });
        else queryFilter.andWhere(`agent.id = null`);
      }
      if (filters.from)
        queryFilter.andWhere(`DATE(phone_activities.dateTimeCall) >= :from`, {
          from: filters.from,
        });
      if (filters.to)
        queryFilter.andWhere(`DATE(phone_activities.dateTimeCall) <= :to`, {
          to: filters.to,
        });
      if (filters.on)
        queryFilter.andWhere(`DATE(phone_activities.dateTimeCall) = :on`, {
          on: filters.on,
        });
      if (filters.department)
        queryFilter.andWhere(`phone_activities.team = :department`, {
          department: filters.department,
        });
      queryFilter.andWhere(`phone_activities.status = :status`, {
        status: 'active',
      });

      const length = await queryFilter.getCount();

      //* pagination
      let limit = 10;
      if (+filters.limit) limit = +filters.limit;

      const queryFilterPaginate = getManager()
        .createQueryBuilder(PhoneActivities, 'phone_activities')
        .innerJoinAndSelect('phone_activities.agent', 'agent')
        .limit(limit)
        .offset((currentPage - 1) * limit)
        .orderBy('phone_activities.dateTimeCall', 'DESC');

      if (filters.agentsId) {
        if (filters.agentsId.length > 0)
          queryFilterPaginate.andWhere('agent.id IN (:...agents)', { agents });
        else queryFilterPaginate.andWhere(`agent.id = null`);
      }
      if (filters.on)
        queryFilterPaginate.andWhere(
          `DATE(phone_activities.dateTimeCall) = :on`,
          { on: filters.on },
        );
      if (filters.from)
        queryFilterPaginate.andWhere(
          `DATE(phone_activities.dateTimeCall) >= :from`,
          { from: filters.from },
        );
      if (filters.to)
        queryFilterPaginate.andWhere(
          `DATE(phone_activities.dateTimeCall) <= :to`,
          { to: filters.to },
        );
      if (filters.department)
        queryFilterPaginate.andWhere(`phone_activities.team = :department`, {
          department: filters.department,
        });
      queryFilterPaginate.andWhere(`phone_activities.status = :status`, {
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
    } catch (error) {
      console.log(error);
      throw new Error('Can not get data');
    }
  }

  async deleteActivityPhone(id: string, userId: string): Promise<any> {
    const infoActivity = await this.phoneActivityRepository.findOne({
      where: {
        id: id,
        status: Not(EntityStatus.DELETE),
      },
    });
    if (!infoActivity) throw new NotFoundException(`Not found !`);
    infoActivity.lastModifiedUserId = userId;
    infoActivity.status = EntityStatus.DELETE;
    return await infoActivity.save();
  }

  async updateActivityPhone(
    id: string,
    updatePhoneDto: UpdatePhoneDto,
    userId,
  ): Promise<any> {
    const infoActivity = await getManager()
      .createQueryBuilder(PhoneActivities, 'phone_activities')
      .andWhere(`phone_activities.id = :id`, { id: id })
      .andWhere(`phone_activities.status != :status`, {
        status: EntityStatus.DELETE,
      })
      .leftJoin('phone_activities.agent', 'agent')
      .addSelect(['agent.id', 'agent.firstName', 'agent.lastName'])
      .getOne();
    if (!infoActivity) throw new NotFoundException(`Not found !`);

    const newData = _.assign(infoActivity, updatePhoneDto);
    newData.lastModifiedUserId = userId;
    return await newData.save();
  }

  async validateFilePhoneActivity(file: any) {
    const agents = await this.agentRepository.find({
      where: {
        status: EntityStatus.ACTIVE,
      },
    });
    const variables = await this.variableRepository.find();
    const fileData = this.extractDataPhone(file.buffer, variables);
    const data = fileData.data;
    const yupSchema = phoneValidateSchema();
    // const offsetHeader = 1;
    try {
      await yupSchema.validate(data, {
        abortEarly: false,
        context: { agents },
      });
    } catch (err) {
      // return err.inner
      let indexAgent = -1;
      return err.inner.map((item: any) => {
        const path = item.path
          .replace('[', '')
          .replace(']', '')
          .split('.');
        if (indexAgent > -1) data.splice(indexAgent, 1);

        indexAgent = data.findIndex(
          item2 => item.params.originalValue == item2.agent.name,
        );
        return {
          value: item.params.originalValue,
          row: data[indexAgent].agent.index,
          column: this.convertToColumnName(path[1]),
          sheetName: fileData.sheetName,
          message: item.message,
          status: NotificationStatus.ERROR,
        };
      });
    }
  }
}
