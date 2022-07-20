import { ReportQueueModule } from './../queues/report-queue/report-queue.module';
import {
  forwardRef,
  MiddlewareConsumer,
  Module,
  RequestMethod,
} from '@nestjs/common';
import { ReportDotNetModule } from 'src/microservices/backend-report/report-dot-net/report-dot-net.module';
import { ExportController } from './export.controller';
import { ExportService } from './export.service';
import { ActivityLoggerMiddleware } from './middlewares/activity-logeer.middleware';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReportRepository } from './repository/report.repository';

@Module({
  imports: [
    ReportDotNetModule,
    forwardRef(() => ReportQueueModule),
    TypeOrmModule.forFeature([
      ReportRepository
    ]),
  ],
  controllers: [ExportController],
  providers: [ExportService],
  exports: [ExportService]
})
export class ExportModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(ActivityLoggerMiddleware).forRoutes({
      path: ':splat*?/export',
      method: RequestMethod.POST,
    });
  }
}
