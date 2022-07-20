import { AutoIssuesModule } from './../auto-issues/auto-issues.module';
import { MiddlewareConsumer, Module, RequestMethod } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AgentRepository } from 'src/agents/repository/agent.repository';
import { DepartmentRepository } from 'src/departments/repository/departments.repository';
import { DataGlipsController } from './data-glips.controller';
import { DataGlipsService } from './data-glips.service';
import { ActivityLoggerMiddleware } from './middlewares/activity-logger.middleware';
import { GlipMasterReportActivitiesRepository } from './repository/data-glips.repository';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      //* for current scope
      GlipMasterReportActivitiesRepository,
      AgentRepository,
      DepartmentRepository,
    ]),
    AutoIssuesModule
  ],
  controllers: [DataGlipsController],
  providers: [DataGlipsService],
  exports: [DataGlipsService],
})
export class DataGlipsModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(ActivityLoggerMiddleware).forRoutes(
      {
        path: ':splat*?/data-glips/*',
        method: RequestMethod.DELETE,
      },
      {
        path: ':splat*?/data-glips/*',
        method: RequestMethod.PATCH,
      },
    );
  }
}
