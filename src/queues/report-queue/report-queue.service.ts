import { ReportQueueProducer } from './report-queue.producer';
import { Injectable } from '@nestjs/common';
import { Job } from 'bull';

@Injectable()
export class ReportQueueService {
  constructor(private readonly reportProducer: ReportQueueProducer) {}

  async exportReport(filter: any, reportId: string): Promise<Job<any>> {
    return await this.reportProducer.addExportReportJob(filter, reportId);
  }
}
