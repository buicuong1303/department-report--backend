import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
  ValidationPipe,
} from '@nestjs/common';
import { GetUser } from 'src/auth/decorator/get-user.decorator';
import { Permissions } from 'src/auth/decorator/permission.decorator';
import { PermissionAuth } from 'src/auth/enum/permission-auth.enum';
import { PermissionAuthGuard } from 'src/auth/guard/permission-auth.guard';
import { SessionAuthGuard } from 'src/auth/guard/session-auth.guard';
import { DataEmailsService } from './data-emails.service';
import { GetEmailActivityDto } from './dto/get-email-activity.dto';
import { UpdateEmailActivityDto } from './dto/update-email-activity.dto';

@UseGuards(SessionAuthGuard, PermissionAuthGuard)
@Controller('data-emails')
export class DataEmailsController {
  constructor(private readonly dataEmailServices: DataEmailsService) {}

  @Post('/')
  @Permissions(PermissionAuth.VIEW_ALL_EMAIL_DATA)
  getEmailActivities(
    @Body(ValidationPipe) getEmailActivityDto: GetEmailActivityDto,
  ): Promise<any> {
    return this.dataEmailServices.getEmailActivities(getEmailActivityDto);
  }

  @Get('/:id')
  @Permissions(PermissionAuth.VIEW_ALL_EMAIL_DATA)
  getEmailActivity(@Param('id') id: string): Promise<any> {
    return this.dataEmailServices.getEmailActivity(id);
  }

  @Patch('/:id')
  @Permissions(PermissionAuth.UPDATE_EMAIL_DATA)
  updateEmailActivity(
    @Param('id') id: string,
    @Body(ValidationPipe) updateEmailActivityDto: UpdateEmailActivityDto,
    @GetUser() user: any,
  ): Promise<any> {
    return this.dataEmailServices.updateEmailActivity(
      id,
      user,
      updateEmailActivityDto,
    );
  }

  @Delete('/:id')
  @Permissions(PermissionAuth.DELETE_EMAIL_DATA)
  deleteEmailActivity(
    @Param('id') id: string,
    @GetUser() user: any,
  ): Promise<any> {
    return this.dataEmailServices.deleteEmailActivity(id, user);
  }
}
