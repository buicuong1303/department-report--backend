import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue, Job } from 'bull';

@Injectable()
export class ReportQueueProducer {
  constructor(
    @InjectQueue('report-queue')
    private readonly reportQueue: Queue,
  ) {}

  async addExportReportJob(filters: any, reportId: string): Promise<Job<any>> {
    const job = await this.reportQueue.add(
      'export-report', {
        filters,
        reportId
      }, {
        removeOnFail: true,
        removeOnComplete: true,
        attempts: 0,
        // backoff: 10000,
      },
    );
    return job;
  }
}
