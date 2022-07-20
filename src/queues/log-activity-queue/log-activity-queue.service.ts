import { LogActivityQueueProducer } from './log-activity-queue.producer';
import { Injectable } from '@nestjs/common';

@Injectable()
export class LogActivityQueueService {
  constructor(private readonly logActivityProducer: LogActivityQueueProducer) {}

  async addImportActivity(someData: any): Promise<any> {
    return await this.logActivityProducer.addImportActivity(someData);
  }
  async addConfigActivity(someData: any): Promise<any> {
    return await this.logActivityProducer.addConfigActivity(someData);
  }
  async addDepartmentActivity(someData: any): Promise<any> {
    return await this.logActivityProducer.addDepartmentActivity(someData);
  }
  async addAgentActivity(someData: any): Promise<any> {
    return await this.logActivityProducer.addAgentActivity(someData);
  }
  async addEmailTeamActivity(someData: any): Promise<any> {
    return await this.logActivityProducer.addEmailTeamActivity(someData);
  }
  async addReportActivity(someData: any): Promise<any> {
    return await this.logActivityProducer.addReportActivity(someData);
  }

  async addDataCenterActivity(someData: any): Promise<any> {
    return await this.logActivityProducer.addDataCenterActivity(someData);
  }

  async addPunchActivity(someData: any): Promise<any> {
    return await this.logActivityProducer.addPunchActivity(someData);
  }
}
