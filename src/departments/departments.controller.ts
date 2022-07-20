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
import { DepartmentsService } from './departments.service';
import { AddAgentsToDepartmentDto } from './dto/add-agents-to-department.dto';
import { CreateDepartmentsDto } from './dto/create-department.dto';
import { UpdateAgentsInDepartmentDto } from './dto/update-agents-in-department.dto';
import { UpdateDepartmentsDto } from './dto/update-department.dto';

@UseGuards(SessionAuthGuard, PermissionAuthGuard)
@Controller('departments')
export class DepartmentsController {
  constructor(private readonly departmentsService: DepartmentsService) {}

  @Post('/')
  @Permissions(PermissionAuth.CREATE_DEPARTMENT)
  createDepartment(
    @Body(ValidationPipe) createDepartmentsDto: CreateDepartmentsDto,
    @GetUser() user: any,
  ): Promise<any> {
    return this.departmentsService.createDepartment(createDepartmentsDto, user);
  }

  @Get('/')
  @Permissions(PermissionAuth.VIEW_ALL_DEPARTMENT)
  getDepartments(): Promise<any> {
    return this.departmentsService.getDepartments();
  }

  @Get('/:id')
  @Permissions(PermissionAuth.VIEW_A_DEPARTMENT)
  getDepartment(@Param('id') id: string): Promise<any> {
    return this.departmentsService.getDepartment(id);
  }

  @Patch('/:id')
  @Permissions(PermissionAuth.UPDATE_DEPARTMENT)
  updateDepartment(
    @Param('id') id: string,
    @Body(ValidationPipe) updateDepartmentsDto: UpdateDepartmentsDto,
    @GetUser() user: any,
  ): Promise<any> {
    return this.departmentsService.updateDepartment(
      id,
      updateDepartmentsDto,
      user,
    );
  }

  @Delete('/:id')
  @Permissions(PermissionAuth.DELETE_DEPARTMENT)
  deleteDepartment(
    @Param('id') id: string,
    @GetUser() user: any,
  ): Promise<any> {
    return this.departmentsService.deleteDepartment(id, user);
  }

  @Post('/:id/agents')
  @Permissions(PermissionAuth.ADD_AGENTS_TO_DEPARTMENT)
  addAgentsToDepartment(
    @Param('id') id: string,
    @Body(ValidationPipe) addAgentsToDepartmentDto: AddAgentsToDepartmentDto,
    @GetUser() user: any,
  ): Promise<any> {
    return this.departmentsService.addAgentsToDepartment(
      id,
      addAgentsToDepartmentDto.agentIds,
      user,
    );
  }

  @Patch('/:id/agents')
  @Permissions(PermissionAuth.UPDATE_AGENTS_OF_DEPARTMENT)
  updateAgentsInDepartment(
    @Param('id') id: string,
    @Body(ValidationPipe)
    updateAgentsInDepartmentDto: UpdateAgentsInDepartmentDto,
    @GetUser() user: any,
  ): Promise<any> {
    return this.departmentsService.updateAgentsInDepartment(
      id,
      updateAgentsInDepartmentDto,
      user,
    );
  }

  @Get('/:id/agents')
  @Permissions(PermissionAuth.VIEW_AGENTS_OF_DEPARTMENT)
  getAgentsInDepartment(@Param('id') id: string): Promise<any> {
    return this.departmentsService.getAgentsInDepartment(id);
  }

  @Get('/typedepartment/:type/agents')
  @Permissions(PermissionAuth.VIEW_AGENTS_OF_DEPARTMENT)
  getAgentByDepartmentType(@Param('type') type: string): any {
    return this.departmentsService.getAgentByDepartmentType(type);
  }
}
