import { MiddlewareConsumer, Module, RequestMethod } from '@nestjs/common';
import { ConfigVariableService } from './config-variable.service';
import { ConfigVariableController } from './config-variable.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigVariableRepository } from './repository/config-variable.repository';
import { ActivityLoggerMiddleware } from './middlewares/activity-logger.middleware';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      //* for current scope
      ConfigVariableRepository,
    ]),
  ],
  providers: [ConfigVariableService],
  controllers: [ConfigVariableController],
})
export class ConfigVariableModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(ActivityLoggerMiddleware)

      .forRoutes(
        {
          path: ':splat*?/config-variable/*',
          method: RequestMethod.PATCH,
        },
        {
          path: ':splat*?/config-variable/*',
          method: RequestMethod.DELETE,
        },
      );
  }
}
