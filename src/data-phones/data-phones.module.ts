import { MiddlewareConsumer, Module, RequestMethod } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AgentRepository } from 'src/agents/repository/agent.repository';
import { ConfigVariableRepository } from 'src/config-variable/repository/config-variable.repository';
import { DataPhonesController } from './data-phones.controller';
import { DataPhonesService } from './data-phones.service';
import { ActivityLoggerMiddleware } from './middlewares/activitiy-logger.middleware';
import { PhoneActivitiesRepository } from './repository/data-phones.repository';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      //* for current scope
      PhoneActivitiesRepository,
      AgentRepository,
      ConfigVariableRepository,
    ]),
  ],
  controllers: [DataPhonesController],
  providers: [DataPhonesService],
  exports: [DataPhonesService],
})
export class DataPhonesModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(ActivityLoggerMiddleware).forRoutes(
      {
        path: ':splat*?/data-phones/*',
        method: RequestMethod.DELETE,
      },
      {
        path: ':splat*?/data-phones/*',
        method: RequestMethod.PATCH,
      },
    );
  }
}
