import { MondayModule } from './monday/monday.module';
import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { typeOrmConfig } from './config/typeorm.config';
import { JwtCustomModule } from './jwt-custom/jwt-custom.module';
import { AuthAutomationCoreModule } from './microservices/automation-core/auth-automation-core/auth-automation-core.module';
import { LogicsModule } from './logics/logics.module';
import { EmailTeamsModule } from './email-teams/email-teams.module';
import { AgentsModule } from './agents/agents.module';
import { DepartmentsModule } from './departments/departments.module';
import { DataPunchesModule } from './data-punches/data-punches.module';
import { DataIcsModule } from './data-ics/data-ics.module';
import { DataPhonesModule } from './data-phones/data-phones.module';
import { DataEpicsModule } from './data-epics/data-epics.module';
import { DataEmailsModule } from './data-emails/data-emails.module';
import { DataGlipsModule } from './data-glips/data-glips.module';
import { ExportModule } from './export/export.module';
import { ValidationModule } from './validation/validation.module';
import { ImportModule } from './import/import.module';
import { ConfigVariableModule } from './config-variable/config-variable.module';
import { QueuesModule } from './queues/queues.module';
import { AutoIssuesModule } from './auto-issues/auto-issues.module';
import { ScheduleModule } from '@nestjs/schedule';
@Module({
  imports: [
    //* global module
    JwtCustomModule,
    AuthAutomationCoreModule,
    QueuesModule,

    //* another module
    AuthModule,
    TypeOrmModule.forRoot(typeOrmConfig),
    ImportModule,
    ValidationModule,
    ExportModule,
    DataGlipsModule,
    DataEmailsModule,
    DataEpicsModule,
    DataPhonesModule,
    DataIcsModule,
    DataPunchesModule,
    DepartmentsModule,
    AgentsModule,
    EmailTeamsModule,
    LogicsModule,
    ConfigVariableModule,
    AutoIssuesModule,
    MondayModule,
    ScheduleModule.forRoot(),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
