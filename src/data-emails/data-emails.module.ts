import { MiddlewareConsumer, Module, RequestMethod } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AgentsModule } from 'src/agents/agents.module';
import { AgentRepository } from 'src/agents/repository/agent.repository';
import { EmailTeamsModule } from 'src/email-teams/email-teams.module';
import { DataEmailsController } from './data-emails.controller';
import { DataEmailsService } from './data-emails.service';
import { ActivityLoggerMiddleware } from './middlewares/activity-logger.middleware';
import { EmailActivitiesRepository } from './repository/data-emails.repository';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      //* for current scope
      EmailActivitiesRepository,
      AgentRepository,
    ]),
    AgentsModule,
    EmailTeamsModule,
  ],

  controllers: [DataEmailsController],
  providers: [DataEmailsService],
  exports: [DataEmailsService],
})
export class DataEmailsModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(ActivityLoggerMiddleware).forRoutes(
      {
        path: ':splat*?/data-emails/*',
        method: RequestMethod.DELETE,
      },
      {
        path: ':splat*?/data-emails/*',
        method: RequestMethod.PATCH,
      },
    );
  }
}
