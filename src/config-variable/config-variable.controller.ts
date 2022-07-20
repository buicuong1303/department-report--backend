import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  UseGuards,
  ValidationPipe,
} from '@nestjs/common';
import { GetUser } from 'src/auth/decorator/get-user.decorator';
import { Permissions } from 'src/auth/decorator/permission.decorator';
import { PermissionAuth } from 'src/auth/enum/permission-auth.enum';
import { PermissionAuthGuard } from 'src/auth/guard/permission-auth.guard';
import { SessionAuthGuard } from 'src/auth/guard/session-auth.guard';
import { ConfigVariableService } from './config-variable.service';
import { ManageConfigDto } from './dto/manage-config-variable.dto';

@UseGuards(SessionAuthGuard, PermissionAuthGuard)
@Controller('config-variable')
export class ConfigVariableController {
  constructor(private readonly configService: ConfigVariableService) {}

  @Patch('/')
  @Permissions(PermissionAuth.UPDATE_LOGIC, PermissionAuth.CREATE_LOGIC)
  async updateConfig(
    @Body(ValidationPipe) manageConfigDto: ManageConfigDto,
    @GetUser() user: any,
  ): Promise<any> {
    return this.configService.updateConfigs(manageConfigDto.configs, user);
  }

  @Get('/')
  @Permissions(PermissionAuth.VIEW_ALL_LOGIC)
  async getConfigs() {
    return this.configService.getConfigs();
  }

  @Delete('/:id')
  @Permissions(PermissionAuth.DELETE_LOGIC)
  async deleteMainLine(@Param('id') id: string, @GetUser() user: any) {
    return this.configService.deleteMainLine(id, user);
  }
}
