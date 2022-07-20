import { UpdatesService } from './services/updates.service';
import { FilesService } from './services/files.service';
import { ColumnsService } from './services/columns.service';
import { Module, HttpModule } from '@nestjs/common';
import { BoardsService } from './services/boards.service';
import { ItemsService } from './services/items.service';
import { GraphQLRequestModule } from '@golevelup/nestjs-graphql-request';
import { MondayController } from './monday.controller';
import * as config from 'config';
import { BullModule } from '@nestjs/bull';
import { ApiRateLimitQueueConsumer } from './queue/api-rate-limit-queue.consumer';
import { ApiRateLimitQueueProducer } from './queue/api-rate-limit-queue.producer';
import { ComplexityService } from './services/complexity.service';
import { GroupsService } from './services/groups.service';
import { UsersService } from './services/users.service';
import { MondayService } from './monday.service';

const mondayConfig = config.get('monday');

@Module({
  providers: [
    ApiRateLimitQueueProducer,
    ApiRateLimitQueueConsumer,
    BoardsService,
    GroupsService,
    ItemsService,
    ColumnsService,
    FilesService,
    UpdatesService,
    ComplexityService,
    UsersService,
    MondayService
  ],
  imports: [
    HttpModule.register({
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
    }),
    GraphQLRequestModule.forRoot(GraphQLRequestModule, {
      endpoint: mondayConfig['endpoint'],
      options: {
        headers: {
          'content-type': 'application/json',
          Authorization: mondayConfig['token'],
        },
      },
    }),
    BullModule.registerQueue({
      name: 'monday-api-rate-limit',
      redis: {
        host: 'department-report-redis-queue',
        port: 6379,
      },
    }),
  ],
  exports: [
    BullModule,
    BoardsService,
    GroupsService,
    ItemsService,
    ColumnsService,
    FilesService,
    UpdatesService,
    ComplexityService,
    UsersService,
    MondayService
  ],
  controllers: [MondayController],
})
export class MondayModule {}
