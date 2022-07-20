import { MiddlewareConsumer, Module, RequestMethod } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AgentRepository } from 'src/agents/repository/agent.repository';
import { DataPunchesController } from './data-punches.controller';
import { DataPunchesService } from './data-punches.service';
import { ActivityLoggerMiddleware } from './middlewares/activity-logger.middleware';
import { PunchActivitiesRepository } from './repository/data-punches.repository';

@Module({
  imports: [
    TypeOrmModule.forFeature([PunchActivitiesRepository, AgentRepository]),
  ],
  providers: [DataPunchesService],
  controllers: [DataPunchesController],
  exports: [DataPunchesService],
})
export class DataPunchesModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(ActivityLoggerMiddleware).forRoutes(
      {
        path: ':splat*?/data-punches',
        method: RequestMethod.POST,
      },
      {
        path: ':splat*?/data-punches/*',
        method: RequestMethod.DELETE,
      },
      {
        path: ':splat*?/data-punches/*',
        method: RequestMethod.PATCH,
      },
    );
  }
}
