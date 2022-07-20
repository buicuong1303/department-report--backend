import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
  ValidationPipe,
} from '@nestjs/common';
import { Permissions } from 'src/auth/decorator/permission.decorator';
import { PermissionAuth } from 'src/auth/enum/permission-auth.enum';
import { PermissionAuthGuard } from 'src/auth/guard/permission-auth.guard';
import { SessionAuthGuard } from 'src/auth/guard/session-auth.guard';
import { DataPunchesService } from './data-punches.service';
import { AddPunchsActivitiesDto } from './dto/add-data-punchs.dto';
import { UpdatePunchsActivitiesDto } from './dto/update-data-punchs.dto';
import { PunchActivities } from './entity/punch.entity';

@Controller('data-punches')
export class DataPunchesController {
  constructor(private punchActivitiesService: DataPunchesService) {}

  @Post('/')
  @Permissions(PermissionAuth.CREATE_PUNCH_DATA)
  addPunchActivities(
    @Body(ValidationPipe) addPunchsActivitiesDto: AddPunchsActivitiesDto,
  ): Promise<any> {
    return this.punchActivitiesService.addPunchActivities(
      addPunchsActivitiesDto,
    );
  }

  @Get('/')
  @Permissions(PermissionAuth.VIEW_ALL_PUNCH_DATA)
  getPunchActivities(@Query() queries): Promise<PunchActivities[]> {
    const { from, to, id } = queries;
    return this.punchActivitiesService.getPunchActivities(from, to, id);
  }

  @Get('/:id')
  @Permissions(PermissionAuth.VIEW_A_PUNCH_DATA)
  getPunchActivitiesById(@Param('id') id: string): Promise<PunchActivities> {
    return this.punchActivitiesService.getPunchActivitiesById(id);
  }

  //TODO fix
  @Get('/data/agents')
  @Permissions(
    PermissionAuth.VIEW_ALL_AGENT,
    PermissionAuth.VIEW_DEPARTMENTS_OF_AGENT,
  )
  getAgents(): Promise<any> {
    return this.punchActivitiesService.getAgents();
  }

  @Patch('/:id')
  @Permissions(PermissionAuth.UPDATE_PUNCH_DATA)
  updatePunchActivities(
    @Param('id') id: string,
    @Body(ValidationPipe) updatePunchActivitiesDto: UpdatePunchsActivitiesDto,
  ): Promise<PunchActivities> {
    return this.punchActivitiesService.updatePunchActivities(
      updatePunchActivitiesDto,
      id,
    );
  }

  @Delete('/:id')
  @Permissions(PermissionAuth.DELETE_PUNCH_DATA)
  deletePunchActivities(@Param('id') id: string): Promise<PunchActivities> {
    return this.punchActivitiesService.deletePunchActivities(id);
  }
}
