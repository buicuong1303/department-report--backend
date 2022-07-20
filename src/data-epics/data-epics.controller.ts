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
import { DataEpicsService } from './data-epics.service';
import { GetEpicDto } from './dto/get-epic.dto';
import { UpdateEpicDto } from './dto/update-epic.dto';

@UseGuards(SessionAuthGuard, PermissionAuthGuard)
@Controller('data-epics')
export class DataEpicsController {
  constructor(private readonly epicService: DataEpicsService) {}

  @Patch('/:id')
  @Permissions(PermissionAuth.UPDATE_EPIC_DATA)
  async updateActivityEpic(
    @Param('id') id: string,
    @Body(ValidationPipe) updateEpicDto: UpdateEpicDto,
    @GetUser() user,
  ): Promise<any> {
    return this.epicService.updateActivityEpic(id, updateEpicDto, user.id);
  }

  @Delete('/:id')
  @Permissions(PermissionAuth.DELETE_EPIC_DATA)
  async deleteActivityEpic(
    @Param('id') id: string,
    @GetUser() user,
  ): Promise<any> {
    return this.epicService.deleteActivityEpic(id, user.id);
  }

  @Post()
  @Permissions(PermissionAuth.VIEW_ALL_EPIC_DATA)
  async getDataEpic(
    @Body(ValidationPipe) getEpicDto: GetEpicDto,
  ): Promise<any> {
    return this.epicService.getDataEpic(getEpicDto);
  }
}
