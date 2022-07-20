import { MiddlewareConsumer, Module, RequestMethod } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AgentRepository } from 'src/agents/repository/agent.repository';
import { ConfigVariableRepository } from 'src/config-variable/repository/config-variable.repository';
import { DepartmentsController } from './departments.controller';
import { DepartmentsService } from './departments.service';
import { ActivityLoggerMiddleware } from './middlewares/activity-logger.middleware';
import { AgentDepartmentRepository } from './repository/agent-department.repository';
import { DepartmentRepository } from './repository/departments.repository';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      //* for current scope
      DepartmentRepository,
      AgentRepository,
      AgentDepartmentRepository,
    ]),
  ],
  controllers: [DepartmentsController],
  providers: [DepartmentsService],
  exports: [DepartmentsService],
})
export class DepartmentsModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(ActivityLoggerMiddleware)

      .forRoutes(
        {
          path: ':splat*?/departments/*',
          method: RequestMethod.POST,
        },
        {
          path: ':splat*?/departments/*',
          method: RequestMethod.DELETE,
        },
        {
          path: '/departments/:id',
          method: RequestMethod.PATCH,
        },
      );
  }
}
