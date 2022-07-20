import { MiddlewareConsumer, Module, RequestMethod } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AgentRepository } from 'src/agents/repository/agent.repository';
import { DataEpicsController } from './data-epics.controller';
import { DataEpicsService } from './data-epics.service';
import { ActivityLoggerMiddleware } from './middlewares/activity-logger.middleware';
import { EpicActivitiesRepository } from './repository/data-epics.repository';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      //* for current scope
      EpicActivitiesRepository,
      AgentRepository,
    ]),
  ],
  controllers: [DataEpicsController],
  providers: [DataEpicsService],
  exports: [DataEpicsService],
})
export class DataEpicsModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(ActivityLoggerMiddleware).forRoutes(
      {
        path: ':splat*?/data-epics/*',
        method: RequestMethod.DELETE,
      },
      {
        path: ':splat*?/data-epics/*',
        method: RequestMethod.PATCH,
      },
    );
  }
}
