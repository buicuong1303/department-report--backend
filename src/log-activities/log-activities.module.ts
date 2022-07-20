import { Module } from '@nestjs/common';
import { LogActivitiesController } from './log-activities.controller';
import { LogActivitiesService } from './log-activities.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LogActivityRepository } from './repository/log-activities.repository';
import { AppsModule } from 'src/microservices/automation-core/apps/apps.module';

@Module({
  imports: [TypeOrmModule.forFeature([LogActivityRepository]), AppsModule],
  controllers: [LogActivitiesController],
  providers: [LogActivitiesService],
  exports: [LogActivitiesService],
})
export class LogActivitiesModule {}
