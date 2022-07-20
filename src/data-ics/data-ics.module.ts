import { AutoIssuesModule } from './../auto-issues/auto-issues.module';
import { MiddlewareConsumer, Module, RequestMethod } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AgentRepository } from 'src/agents/repository/agent.repository';
import { DataIcsController } from './data-ics.controller';
import { DataIcsService } from './data-ics.service';
import { ActivityLoggerMiddleware } from './middlewares/activity-logger.middleware';
import { InboundCallActivitiesRepository } from './repository/data-ics.repository';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      //* for current scope
      InboundCallActivitiesRepository,
      AgentRepository,
    ]),
    AutoIssuesModule
  ],
  controllers: [DataIcsController],
  providers: [DataIcsService],
  exports: [DataIcsService],
})
export class DataIcsModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(ActivityLoggerMiddleware).forRoutes(
      {
        path: ':splat*?/data-ics/*',
        method: RequestMethod.DELETE,
      },
      {
        path: ':splat*?/data-ics/*',
        method: RequestMethod.PATCH,
      },
    );
  }
}
