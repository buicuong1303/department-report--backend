import { Module } from '@nestjs/common';
import { DataEmailsModule } from 'src/data-emails/data-emails.module';
import { DataEpicsModule } from 'src/data-epics/data-epics.module';
import { DataGlipsModule } from 'src/data-glips/data-glips.module';
import { DataIcsModule } from 'src/data-ics/data-ics.module';
import { DataPhonesModule } from 'src/data-phones/data-phones.module';
import { DataPunchesModule } from 'src/data-punches/data-punches.module';
import { ValidationController } from './validation.controller';
import { ValidationService } from './validation.service';

@Module({
  controllers: [ValidationController],
  providers: [ValidationService],
  imports: [
    DataEmailsModule,
    DataEpicsModule,
    DataGlipsModule,
    DataIcsModule,
    DataPhonesModule,
    DataPunchesModule,
  ],
})
export class ValidationModule {}
