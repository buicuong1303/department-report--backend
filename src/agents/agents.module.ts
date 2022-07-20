import { MiddlewareConsumer, Module, RequestMethod } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AgentDepartmentRepository } from 'src/departments/repository/agent-department.repository';
import { DepartmentRepository } from 'src/departments/repository/departments.repository';
import { AgentsController } from './agents.controller';
import { AgentsService } from './agents.service';
import { ActivityLoggerMiddleware } from './middlewares/activity-logger.middleware';
import { AgentRepository } from './repository/agent.repository';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      //* for current scope
      AgentRepository,
      DepartmentRepository,
      AgentDepartmentRepository,
    ]),
    // DepartmentsModule,
  ],
  controllers: [AgentsController],
  providers: [AgentsService],
  exports: [AgentsService],
})
export class AgentsModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(ActivityLoggerMiddleware)

      .forRoutes(
        {
          path: ':splat*?/agents/*',
          method: RequestMethod.POST,
        },
        {
          path: ':splat*?/agents/*',
          method: RequestMethod.DELETE,
        },
        {
          path: ':splat*?/agents/:id',
          method: RequestMethod.PATCH,
        },
      );
  }
}
