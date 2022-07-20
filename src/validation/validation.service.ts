import { Injectable } from '@nestjs/common';
import { DataEmailsService } from 'src/data-emails/data-emails.service';
import { DataEpicsService } from 'src/data-epics/data-epics.service';
import { DataGlipsService } from 'src/data-glips/data-glips.service';
import { DataIcsService } from 'src/data-ics/data-ics.service';
import { DataPhonesService } from 'src/data-phones/data-phones.service';
import { DataPunchesService } from 'src/data-punches/data-punches.service';

@Injectable()
export class ValidationService {
  constructor(
    private readonly dataEmailService: DataEmailsService,
    private readonly dataEpicsService: DataEpicsService,
    private readonly dataGlipService: DataGlipsService,
    private readonly dataIcsService: DataIcsService,
    private readonly dataPhonesService: DataPhonesService,
    private readonly dataPunchService: DataPunchesService,
  ) {}

  async validateFileEmailActivity(file: any): Promise<any> {
    return await this.dataEmailService.validateFileEmailActivity(file);
  }

  async validateFileEpicActivity(file: any): Promise<any> {
    return await this.dataEpicsService.validateFileEpicActivity(file);
  }

  async validateFileGlipActivity(file: any): Promise<any> {
    return await this.dataGlipService.validateFileGlipActivity(file);
  }

  async validateFileIcActivity(file: any): Promise<any> {
    return await this.dataIcsService.validateFileIcActivity(file);
  }

  async validateFilePhoneActivity(file: any): Promise<any> {
    return await this.dataPhonesService.validateFilePhoneActivity(file);
  }

  async validatePunchActivity(file: any): Promise<any> {
    return await this.dataPunchService.validatePunch(file);
  }
}
