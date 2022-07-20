import { MiddlewareConsumer, Module, RequestMethod } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EmailTeamsController } from './email-teams.controller';
import { EmailTeamsService } from './email-teams.service';
import { ActivityLoggerMiddleware } from './middlewares/activity-logger.middleware';
import { EmailTeamsRepository } from './repository/email-teams.repository';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      //* for current scope
      EmailTeamsRepository,
    ]),
  ],

  controllers: [EmailTeamsController],
  providers: [EmailTeamsService],
  exports: [EmailTeamsService],
})
export class EmailTeamsModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(ActivityLoggerMiddleware).forRoutes(
      {
        path: ':splat*?/email-teams/*',
        method: RequestMethod.POST,
      },
      {
        path: ':splat*?/email-teams/*',
        method: RequestMethod.DELETE,
      },
      {
        path: ':splat*?/email-teams/*',
        method: RequestMethod.PATCH,
      },
    );
  }
}
