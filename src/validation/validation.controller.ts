import {
  Controller,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Permissions } from 'src/auth/decorator/permission.decorator';
import { PermissionAuth } from 'src/auth/enum/permission-auth.enum';
import { PermissionAuthGuard } from 'src/auth/guard/permission-auth.guard';
import { SessionAuthGuard } from 'src/auth/guard/session-auth.guard';
import { ValidationService } from './validation.service';

@UseGuards(SessionAuthGuard, PermissionAuthGuard)
@Controller('validation')
export class ValidationController {
  constructor(private readonly validationService: ValidationService) {}

  @Post('/email')
  @Permissions(PermissionAuth.VALIDATE_DATA)
  @UseInterceptors(FileInterceptor('file'))
  async validateFileEmailActivity(@UploadedFile() file): Promise<any> {
    return this.validationService.validateFileEmailActivity(file);
  }

  @Post('/epic')
  @Permissions(PermissionAuth.VALIDATE_DATA)
  @UseInterceptors(FileInterceptor('file'))
  async validateFileEpicActivity(@UploadedFile() file): Promise<any> {
    return this.validationService.validateFileEpicActivity(file);
  }

  @Post('/glip')
  @Permissions(PermissionAuth.VALIDATE_DATA)
  @UseInterceptors(FileInterceptor('file'))
  async validateGlip(@UploadedFile() file): Promise<any> {
    return this.validationService.validateFileGlipActivity(file.buffer);
    // const isInvalid = data.some(item => !departments.includes(item['team']));
    // console.log(isInvalid)
  }

  @Post('/ic')
  @Permissions(PermissionAuth.VALIDATE_DATA)
  @UseInterceptors(FileInterceptor('file'))
  async validateFileIcActivity(@UploadedFile() file): Promise<any> {
    return this.validationService.validateFileIcActivity(file);
  }

  @Post('/phone')
  @Permissions(PermissionAuth.VALIDATE_DATA)
  @UseInterceptors(FileInterceptor('file'))
  async validateFilePhoneActivity(@UploadedFile() file): Promise<any> {
    return this.validationService.validateFilePhoneActivity(file);
  }

  @Post('/punch')
  @Permissions(PermissionAuth.VALIDATE_DATA)
  @UseInterceptors(FileInterceptor('file'))
  async validatePunch(@UploadedFile() file): Promise<any> {
    return this.validationService.validatePunchActivity(file.buffer);
    // const isInvalid = data.some(item => !departments.includes(item['team']));
    // console.log(isInvalid)
  }
}
