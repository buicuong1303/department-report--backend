import { ReportQueueModule } from './report-queue/report-queue.module';
import { Module } from '@nestjs/common';
import { LogActivityQueueModule } from './log-activity-queue/log-activity-queue.module';
import { QueuesController } from './queues.controller';
import { QueuesProvider } from './queues.provider';
import { MondayModule } from '../monday/monday.module';

@Module({
  imports: [LogActivityQueueModule, ReportQueueModule, MondayModule],
  controllers: [QueuesController],
  providers: [QueuesProvider],
})
export class QueuesModule {}
