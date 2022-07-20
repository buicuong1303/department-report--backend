import {
  Processor,
  Process,
  OnQueueActive,
  OnQueueCompleted,
  OnQueueFailed,
} from '@nestjs/bull';
import { Job } from 'bull';
import { LogActivitiesService } from 'src/log-activities/log-activities.service';

@Processor('log-activity-queue')
export class LogActivityQueueConsumer {
  constructor(private readonly logActivityService: LogActivitiesService) {}

  @Process('import-activity')
  async logImportActivity(job: Job<unknown>) {
    //do something
    //query
    await this.logActivityService.writeLog(job.data);
  }
  @Process('data-center-activity')
  async logDataActivity(job: Job<unknown>) {
    //do something
    //query
    await this.logActivityService.writeLog(job.data);
  }

  @Process('config-activity')
  async logConfigActivity(job: Job<unknown>) {
    //do something
    //query
    await this.logActivityService.writeLog(job.data);
  }

  @Process('department-activity')
  async logDepartmentActivity(job: Job<unknown>) {
    //do something
    //query
    await this.logActivityService.writeLog(job.data);
  }
  @Process('punch-activity')
  async logPunchActivity(job: Job<unknown>) {
    //do something
    //query
    await this.logActivityService.writeLog(job.data);
  }

  @Process('agent-activity')
  async logAgentActivity(job: Job<unknown>) {
    //do something
    //query
    await this.logActivityService.writeLog(job.data);
  }
  @Process('email-team-activity')
  async logEmailTeamActivity(job: Job<unknown>) {
    //do something
    //query
    await this.logActivityService.writeLog(job.data);
  }
  @Process('report-activity')
  async logReportActivity(job: Job<unknown>) {
    //do something
    //query
    await this.logActivityService.writeLog(job.data);
  }
  @Process('config-variable-activity')
  async logConfigVariableActivity(job: Job<unknown>) {
    //do something
    //query
    await this.logActivityService.writeLog(job.data);
  }
}
