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
import { AgentsService } from './agents.service';
import { AddDepartmentsToAgentDto } from './dto/add-departments-to-agent.dto';
import { CreateAgentsDto } from './dto/create-agent.dto';
import { UpdateAgentsDto } from './dto/update-agent.dto';
import { UpdateDepartmentsInAgentDto } from './dto/update-departments-in-agent.dto';

@UseGuards(SessionAuthGuard, PermissionAuthGuard)
@Controller('agents')
export class AgentsController {
  constructor(private readonly agentsService: AgentsService) {}

  @Post('/')
  @Permissions(PermissionAuth.CREATE_AGENT)
  createAgent(
    @Body(ValidationPipe) createAgentsDto: CreateAgentsDto,
    @GetUser() user: any,
  ): Promise<any> {
    return this.agentsService.createAgent(createAgentsDto, user);
  }

  @Get('/')
  @Permissions(PermissionAuth.VIEW_ALL_AGENT)
  getAgents(): Promise<any> {
    return this.agentsService.getAgents();
  }

  @Get('/:id')
  @Permissions(PermissionAuth.VIEW_A_AGENT)
  getAgent(@Param('id') id: string): Promise<any> {
    return this.agentsService.getAgent(id);
  }

  @Patch('/:id')
  @Permissions(PermissionAuth.UPDATE_AGENT)
  updateAgent(
    @Param('id') id: string,
    @Body(ValidationPipe) updateAgentsDto: UpdateAgentsDto,
    @GetUser() user: any,
  ): Promise<any> {
    return this.agentsService.updateAgent(id, updateAgentsDto, user);
  }

  @Delete('/:id')
  @Permissions(PermissionAuth.DELETE_AGENT)
  deleteAgent(@Param('id') id: string, @GetUser() user: any): Promise<any> {
    return this.agentsService.deleteAgent(id, user);
  }

  @Post('/:id/departments')
  @Permissions(PermissionAuth.ADD_DEPARTMENTS_TO_AGENT)
  addDepartmentsToAgent(
    @Param('id') id: string,
    @Body(ValidationPipe) addDepartmentsToAgentDto: AddDepartmentsToAgentDto,
    @GetUser() user: any,
  ): Promise<any> {
    return this.agentsService.addDepartmentsToAgent(
      id,
      addDepartmentsToAgentDto.departmentIds,
      user,
    );
  }

  @Patch('/:id/departments')
  @Permissions(PermissionAuth.UPDATE_DEPARTMENTS_OF_AGENT)
  updateDepartmentsInAgent(
    @Param('id') id: string,
    @Body(ValidationPipe)
    updateDepartmentsInAgentDto: UpdateDepartmentsInAgentDto,
    @GetUser() user: any,
  ): Promise<any> {
    return this.agentsService.updateDepartmentsInAgent(
      id,
      updateDepartmentsInAgentDto,
      user,
    );
  }

  @Get('/:id/departments')
  @Permissions(PermissionAuth.VIEW_DEPARTMENTS_OF_AGENT)
  getDepartmentsInAgent(@Param('id') id: string): Promise<any> {
    return this.agentsService.getDepartmentsInAgent(id);
  }
}
