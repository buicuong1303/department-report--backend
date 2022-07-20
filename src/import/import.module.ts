import {
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
} from '@nestjs/common';
import { DataEmailsModule } from 'src/data-emails/data-emails.module';
import { DataEpicsModule } from 'src/data-epics/data-epics.module';
import { DataGlipsModule } from 'src/data-glips/data-glips.module';
import { DataIcsModule } from 'src/data-ics/data-ics.module';
import { DataPhonesModule } from 'src/data-phones/data-phones.module';
import { DataPunchesModule } from 'src/data-punches/data-punches.module';
import { ImportController } from './import.controller';
import { ImportService } from './import.service';
import { ActivityLoggerMiddleware } from './middlewares/import-logger.middleware';

@Module({
  controllers: [ImportController],
  providers: [ImportService],
  imports: [
    DataGlipsModule,
    DataEmailsModule,
    DataPhonesModule,
    DataEpicsModule,
    DataIcsModule,
    DataPunchesModule,
  ],
})
export class ImportModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(ActivityLoggerMiddleware)

      .forRoutes({
        path: ':splat*?/import/*',
        method: RequestMethod.POST,
      });
  }
}
