import { Injectable, NotFoundException } from '@nestjs/common';
import { DataGlipsService } from 'src/data-glips/data-glips.service';
import { DataEmailsService } from 'src/data-emails/data-emails.service';
import { EntityStatus } from 'src/utils/entity-status';
import { Connection, getManager } from 'typeorm';
import { FileImport } from './entity/file-import.entity';
import { DataPhonesService } from 'src/data-phones/data-phones.service';
import { DataEpicsService } from 'src/data-epics/data-epics.service';
import { DataIcsService } from 'src/data-ics/data-ics.service';
import { DataPunchesService } from 'src/data-punches/data-punches.service';
@Injectable()
export class ImportService {
  constructor(
    private readonly glipService: DataGlipsService,
    private readonly emailService: DataEmailsService,
    private readonly connection: Connection,
    private readonly phoneService: DataPhonesService,
    private readonly epicService: DataEpicsService,
    private readonly icService: DataIcsService,
    private readonly punchService: DataPunchesService,
  ) {}

  async addFileImport(file: any): Promise<any> {
    const fileImportData = {
      fileName: file.originalname,

      // TODO get userId from request
      creationUserId: '72af4eeb-4b0f-40f0-a7e9-63efa7661004',

      // TODO get userId from request
      lastModifiedUserId: '72af4eeb-4b0f-40f0-a7e9-63efa7661004',

      status: EntityStatus.ACTIVE,
    };

    const queryRunner = this.connection.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const queryForFilterCount = await getManager()
        .createQueryBuilder()
        .insert()
        .into(FileImport)
        .values(fileImportData)
        .execute();
      return queryForFilterCount;
    } catch (error) {
      queryRunner.rollbackTransaction();
      return error;
    } finally {
      // you need to release a queryRunner which was manually instantiated
      await queryRunner.release();
    }
  }

  async importDataEmail(file: any, userId: string): Promise<any> {
    const fileImport = await this.addFileImport(file);
    if (!fileImport)
      throw new NotFoundException(`Import file ${file.originalname} error`);

    return await this.emailService.importData(file, fileImport, userId);
  }

  async importDataEpic(file: any, userId: string): Promise<any> {
    return await this.epicService.importDataEpic(file, userId);
  }

  async importDataGlip(file: File, userId: string): Promise<any> {
    return await this.glipService.importDataGlip(file, userId);
  }

  async importDataIc(file: any, userId: string): Promise<any> {
    const fileImport = await this.addFileImport(file);
    if (!fileImport)
      throw new NotFoundException(`Import file ${file.originalname} error`);

    return await this.icService.importDataInboundCall(file, fileImport, userId);
  }

  async importDataPhone(file, userId: string): Promise<any> {
    const fileImport = await this.addFileImport(file);
    if (!fileImport)
      throw new NotFoundException(`Import file ${file.originalname} error`);

    return this.phoneService.importDataPhone(file, fileImport, userId);
  }

  async importPunchService(file: any): Promise<any> {
    return await this.punchService.importPunch(file);
  }
}
