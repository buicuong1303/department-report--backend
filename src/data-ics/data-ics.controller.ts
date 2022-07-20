import {
  Body,
  Controller,
  Delete,
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
import { DataIcsService } from './data-ics.service';
import { GetInboundCallDto } from './dto/get-ic.dto';
import { UpdateInboundCallDto } from './dto/update-ic.dto';

@UseGuards(SessionAuthGuard, PermissionAuthGuard)
@Controller('data-ics')
export class DataIcsController {
  constructor(private readonly icService: DataIcsService) {}

  @Patch('/:id')
  @Permissions(PermissionAuth.UPDATE_INBOUND_CALL_DATA)
  async updateActivityGlip(
    @Param('id') id: string,
    @Body(ValidationPipe) updateInboundCallDto: UpdateInboundCallDto,
    @GetUser() user,
  ): Promise<any> {
    return this.icService.updateActivityInboundCall(
      id,
      updateInboundCallDto,
      user.id,
    );
  }

  @Delete('/:id')
  @Permissions(PermissionAuth.DELETE_INBOUND_CALL_DATA)
  async deleteActivityInboundCall(
    @Param('id') id: string,
    @GetUser() user,
  ): Promise<any> {
    return this.icService.deleteActivityInboundCall(id, user.id);
  }

  @Post('/')
  @Permissions(PermissionAuth.VIEW_ALL_INBOUND_CALL_DATA)
  async getDataInboundCall(
    @Body(ValidationPipe) getInboundCallDto: GetInboundCallDto,
  ): Promise<any> {
    return this.icService.getDataInboundCall(getInboundCallDto);
  }
}
