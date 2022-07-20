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
import { CreateEmailTeamsDto } from './dto/create-email-team.dto';
import { UpdateEmailTeamsDto } from './dto/update-email-team.dto';
import { EmailTeamsService } from './email-teams.service';

@UseGuards(SessionAuthGuard, PermissionAuthGuard)
@Controller('email-teams')
export class EmailTeamsController {
  constructor(private readonly emailTeamsService: EmailTeamsService) {}

  @Post('/')
  @Permissions(PermissionAuth.CREATE_EMAIL_TEAM)
  createEmailTeam(
    @Body(ValidationPipe) createEmailTeamsDto: CreateEmailTeamsDto,
    @GetUser() user: any,
  ): Promise<any> {
    return this.emailTeamsService.createEmailTeam(user, createEmailTeamsDto);
  }

  @Get('/')
  @Permissions(PermissionAuth.VIEW_ALL_EMAIL_TEAM)
  getEmailTeams(): Promise<any> {
    return this.emailTeamsService.getEmailTeams();
  }

  @Get('/:id')
  @Permissions(PermissionAuth.VIEW_A_EMAIL_TEAM)
  getEmailTeam(@Param('id') id: string): Promise<any> {
    return this.emailTeamsService.getEmailTeam(id);
  }

  @Patch('/:id')
  @Permissions(PermissionAuth.UPDATE_EMAIL_TEAM)
  updateEmailTeam(
    @Param('id') id: string,
    @Body(ValidationPipe) updateEmailTeamsDto: UpdateEmailTeamsDto,
    @GetUser() user: any,
  ): Promise<any> {
    return this.emailTeamsService.updateEmailTeam(
      id,
      user,
      updateEmailTeamsDto,
    );
  }

  @Delete('/:id')
  @Permissions(PermissionAuth.DELETE_EMAIL_TEAM)
  deleteEmailTeam(@Param('id') id: string, @GetUser() user: any): Promise<any> {
    return this.emailTeamsService.deleteEmailTeam(id, user);
  }
}
