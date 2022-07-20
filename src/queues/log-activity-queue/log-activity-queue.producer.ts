import { Injectable, HttpService } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';

@Injectable()
export class LogActivityQueueProducer {
  constructor(
    @InjectQueue('log-activity-queue')
    private readonly logActivity: Queue,
  ) {}

  //TODO: prepare data for job at here
  async addImportActivity(info: any) {
    const job = await this.logActivity.add(
      'import-activity',
      {
        info: info,
      },
      {
        attempts: 5,
        backoff: 10000,
        removeOnComplete: false,
        //delay: 500
      },
    );
    return job;
  }
  async addConfigActivity(info: any) {
    const job = await this.logActivity.add(
      'config-activity',
      {
        info: info,
      },
      {
        attempts: 5,
        backoff: 10000,
        removeOnComplete: false,
        //delay: 500
      },
    );
    return job;
  }
  async addReportActivity(info: any) {
    const job = await this.logActivity.add(
      'report-activity',
      {
        info: info,
      },
      {
        attempts: 5,
        backoff: 10000,
        removeOnComplete: false,
        //delay: 500
      },
    );
    return job;
  }
  async addDataCenterActivity(info: any) {
    const job = await this.logActivity.add(
      'data-center-activity',
      {
        info: info,
      },
      {
        attempts: 5,
        backoff: 10000,
        removeOnComplete: false,
        //delay: 500
      },
    );
    return job;
  }
  async addDepartmentActivity(info: any) {
    const job = await this.logActivity.add(
      'department-activity',
      {
        info: info,
      },
      {
        attempts: 5,
        backoff: 10000,
        removeOnComplete: false,
        //delay: 500
      },
    );
    return job;
  }
  async addAgentActivity(info: any) {
    const job = await this.logActivity.add(
      'agent-activity',
      {
        info: info,
      },
      {
        attempts: 5,
        backoff: 10000,
        removeOnComplete: false,
        //delay: 500
      },
    );
    return job;
  }
  async addEmailTeamActivity(info: any) {
    const job = await this.logActivity.add(
      'email-team-activity',
      {
        info: info,
      },
      {
        attempts: 5,
        backoff: 10000,
        removeOnComplete: false,
        //delay: 500
      },
    );
    return job;
  }
  async addPunchActivity(info: any) {
    const job = await this.logActivity.add(
      'punch-activity',
      {
        info: info,
      },
      {
        attempts: 5,
        backoff: 10000,
        removeOnComplete: false,
        //delay: 500
      },
    );
    return job;
  }
  async addConfigVariableActivity(info: any) {
    const job = await this.logActivity.add(
      'config-variable-activity',
      {
        info: info,
      },
      {
        attempts: 5,
        backoff: 10000,
        removeOnComplete: false,
        //delay: 500
      },
    );
    return job;
  }
}
