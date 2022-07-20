import {
  Processor,
  Process,
  OnQueueActive,
  OnQueueCompleted,
  OnQueueFailed,
} from '@nestjs/bull';
import { Job } from 'bull';
import { ExportService } from '../../export/export.service';

@Processor('report-queue')
export class ReportQueueConsumer {
  constructor(private readonly _exportService: ExportService) {}

  @Process('export-report')
  async exportReport(job: Job<any>) {
    const { filters, reportId } = job.data;

    const path = await this._exportService.runReport(filters, reportId);
    
    return path;
  }
}
