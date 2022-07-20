import {
  Controller,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
  Req
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { GetUser } from 'src/auth/decorator/get-user.decorator';
import { Permissions } from 'src/auth/decorator/permission.decorator';
import { PermissionAuth } from 'src/auth/enum/permission-auth.enum';
import { PermissionAuthGuard } from 'src/auth/guard/permission-auth.guard';
import { SessionAuthGuard } from 'src/auth/guard/session-auth.guard';
import { ImportService } from './import.service';
import { Request } from 'express';
@UseGuards(SessionAuthGuard, PermissionAuthGuard)
@Controller('import')
export class ImportController {
  constructor(private readonly importService: ImportService) {}

  @Post('/email')
  @Permissions(PermissionAuth.IMPORT_DATA)
  @UseInterceptors(FileInterceptor('file'))
  async importDataEmail(@UploadedFile() file, @GetUser() user, @Req() req: Request): Promise<any> {
    req.setTimeout(600000);
    return this.importService.importDataEmail(file, user.id);
  }

  @Post('/epic')
  @Permissions(PermissionAuth.IMPORT_DATA)
  @UseInterceptors(FileInterceptor('file'))
  async importDataEpic(@UploadedFile() file, @GetUser() user, @Req() req: Request): Promise<any> {
    req.setTimeout(600000);
    return this.importService.importDataEpic(file, user.id);
  }

  @Post('/glip')
  @Permissions(PermissionAuth.IMPORT_DATA)
  @UseInterceptors(FileInterceptor('file'))
  async importDataGlip(@UploadedFile() file, @GetUser() user, @Req() req: Request): Promise<any> {
    req.setTimeout(600000);
    return this.importService.importDataGlip(file, user.id);
  }

  @Post('/ic')
  @Permissions(PermissionAuth.IMPORT_DATA)
  @UseInterceptors(FileInterceptor('file'))
  async importDataIc(@UploadedFile() file, @GetUser() user, @Req() req: Request): Promise<any> {
    req.setTimeout(600000);
    return this.importService.importDataIc(file, user.id);
  }

  @Post('/phone')
  @Permissions(PermissionAuth.IMPORT_DATA)
  @UseInterceptors(FileInterceptor('file'))
  async importPhone(@UploadedFile() file, @GetUser() user, @Req() req: Request): Promise<any> {
    req.setTimeout(600000);
    return this.importService.importDataPhone(file, user.id);
  }

  @Post('/punch')
  @Permissions(PermissionAuth.IMPORT_DATA)
  @UseInterceptors(FileInterceptor('file'))
  async validationPunch(@UploadedFile() file, @Req() req: Request): Promise<any> {
    req.setTimeout(600000);
    return this.importService.importPunchService(file.buffer);
  }
}
