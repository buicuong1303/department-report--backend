import { ReportQueueConsumer } from './report-queue.consumer';
import { BullModule } from '@nestjs/bull';
import { Module, Global, forwardRef } from '@nestjs/common';
import { ReportQueueService } from './report-queue.service';
import { ReportQueueProducer } from './report-queue.producer';
import { ExportModule } from '../../export/export.module';

@Global()
@Module({
  imports: [
    BullModule.registerQueue({
      name: 'report-queue',
      redis: {
        host: 'department-report-redis-queue',
        port: 6379,
      },
    }),
    forwardRef(() => ExportModule)
  ],
  providers: [
    ReportQueueProducer,
    ReportQueueConsumer,
    ReportQueueService,
  ],
  exports: [ReportQueueService, BullModule],
})
export class ReportQueueModule {}
