import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { LogActivitiesService } from './log-activities.service';
import { SessionAuthGuard } from './../auth/guard/session-auth.guard';
import { PermissionAuthGuard } from './../auth/guard/permission-auth.guard';
import { GetUser } from 'src/auth/decorator/get-user.decorator';
import { Permissions } from 'src/auth/decorator/permission.decorator';
import { PermissionAuth } from 'src/auth/enum/permission-auth.enum';

@UseGuards(SessionAuthGuard, PermissionAuthGuard)
@Controller('log-activities')
export class LogActivitiesController {
  constructor(private readonly logActivityServices: LogActivitiesService) {}

  @Get()
  @Permissions(PermissionAuth.VIEW_ACTIVITY_LOG)
  getLogs(@Query() queries): Promise<any> {
    const { page } = queries || {};
    const { type } = queries || {};
    const { from } = queries || {};
    const { to } = queries || {};
    const { on } = queries || {};
    const { userId } = queries || {};
    const { hashTag } = queries || {};
    return this.logActivityServices.getLogs({
      page,
      type,
      from,
      to,
      on,
      userId,
      hashTag,
    });
  }

  @Get('/users')
  getUserInApps(@GetUser() user: any): Promise<any> {
    return this.logActivityServices.getUserInApps(user);
  }
}
