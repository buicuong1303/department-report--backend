import { MondayModule } from './../monday/monday.module';
import { Module } from '@nestjs/common';
import { AutoIssuesService } from './auto-issues.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AutoIssuesRepository } from './repository/auto-issues.repository';
import { AgentRepository } from '../agents/repository/agent.repository';
import { ConfigVariableRepository } from '../config-variable/repository/config-variable.repository';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      AutoIssuesRepository,
      ConfigVariableRepository,
    ]),
    MondayModule
  ],
  providers: [AutoIssuesService],
  exports: [AutoIssuesService]
})
export class AutoIssuesModule {}
