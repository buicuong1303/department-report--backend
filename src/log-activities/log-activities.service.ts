import { ForbiddenException, Injectable } from '@nestjs/common';
import { LogActivity } from './entity/log-activity.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { LogActivityRepository } from './repository/log-activities.repository';
import * as _ from 'lodash';
import { getManager, Connection } from 'typeorm';
import { AppsService } from 'src/microservices/automation-core/apps/apps.service';
@Injectable()
export class LogActivitiesService {
  constructor(
    @InjectRepository(LogActivityRepository)
    private readonly logActivityRepository: LogActivityRepository,
    private readonly appsService: AppsService,
  ) {}

  async getLogs(filters): Promise<any> {
    try {
      const queryForFilterCount = getManager().createQueryBuilder(
        LogActivity,
        'log_activity',
      );
      if (filters.type)
        queryForFilterCount.andWhere('log_activity.logType = :type', {
          type: filters.type,
        });
      if (filters.to)
        queryForFilterCount.andWhere(
          `DATE(log_activity.lastModifiedTime) <= :to`,
          { to: filters.to },
        );
      if (filters.from)
        queryForFilterCount.andWhere(
          `DATE(log_activity.lastModifiedTime) >= :from`,
          { from: filters.from },
        );
      if (filters.on)
        queryForFilterCount.andWhere(
          `DATE(log_activity.lastModifiedTime) = :on`,
          { on: filters.on },
        );
      if (filters.userId)
        queryForFilterCount.andWhere(`log_activity.userId = :userId`, {
          userId: filters.userId,
        });
      if (filters.hashTag)
        queryForFilterCount.andWhere(`log_activity.hashTag = :hashTag`, {
          hashTag: filters.hashTag,
        });
      const logFilter = await queryForFilterCount.getMany();
      const logFilterCount = logFilter.length;

      const PAGE_SIZE = 10;
      const queryForFilterData = getManager()
        .createQueryBuilder(LogActivity, 'log_activity')
        .limit(PAGE_SIZE)
        .offset((filters.page - 1) * PAGE_SIZE)
        .orderBy('log_activity.lastModifiedTime', 'DESC');
      if (filters.type)
        queryForFilterData.andWhere('log_activity.logType = :type', {
          type: filters.type,
        });
      if (filters.to)
        queryForFilterData.andWhere(
          `DATE(log_activity.lastModifiedTime) <= :to`,
          { to: filters.to },
        );
      if (filters.from)
        queryForFilterData.andWhere(
          `DATE(log_activity.lastModifiedTime) >= :from`,
          { from: filters.from },
        );
      if (filters.on)
        queryForFilterData.andWhere(
          `DATE(log_activity.lastModifiedTime) = :on`,
          { on: filters.on },
        );
      if (filters.userId)
        queryForFilterData.andWhere(`log_activity.userId = :userId`, {
          userId: filters.userId,
        });
      if (filters.hashTag)
        queryForFilterData.andWhere(`log_activity.hashTag = :hashTag`, {
          hashTag: filters.hashTag,
        });

      const logs = await queryForFilterData.getMany();

      return { logs: logs ? logs : [], count: logFilterCount };
    } catch (error) {
      return error;
    }
  }

  async writeLog(data): Promise<any> {
    try {
      const newLog = _.assign(new LogActivity(), this.parseDataToDto(data));
      await this.logActivityRepository.save(newLog);
    } catch (error) {
      return error;
    }
  }

  async getUserInApps(user): Promise<any> {
    try {
      const { data: dataUsers } = await this.appsService.getUserInApps(user);
      const newArrayDataUser = dataUsers.map(item => ({
        userId: item.user.id,
        name: item.user.firstName + ' ' + item.user.lastName,
      }));
      return newArrayDataUser;
    } catch (error) {
      throw new ForbiddenException(`Can not get user in app`);
    }
  }

  private parseDataToDto(data): any {
    const {
      path,
      data: dataLog,
      message,
      method,
      user,
      logType,
      ip,
      insuredId,
      hashTag,
    } = data.info;

    const { userId, fullName } = user;

    const logDto = {
      fullName: fullName,
      data: dataLog,
      path: path,
      message: message,
      method: method,
      userId: userId,
      ip: ip,
      logType: logType,
      hashTag,
    };

    return logDto;
  }
}
