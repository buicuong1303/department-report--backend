import { Module } from '@nestjs/common';
import { LogicsController } from './logics.controller';
import { LogicsService } from './logics.service';

@Module({
  controllers: [LogicsController],
  providers: [LogicsService],
})
export class LogicsModule {}
