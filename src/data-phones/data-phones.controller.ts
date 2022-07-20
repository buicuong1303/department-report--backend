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
import { DataPhonesService } from './data-phones.service';
import { GetPhoneDto } from './dto/get-phone.dto';
import { UpdatePhoneDto } from './dto/update-phone.dto';

@UseGuards(SessionAuthGuard, PermissionAuthGuard)
@Controller('data-phones')
export class DataPhonesController {
  constructor(private readonly phoneService: DataPhonesService) {}

  @Patch('/:id')
  @Permissions(PermissionAuth.UPDATE_PHONE_DATA)
  async updateActivityPhone(
    @Param('id') id: string,
    @Body(ValidationPipe) updatePhoneDto: UpdatePhoneDto,
    @GetUser() user,
  ): Promise<any> {
    return this.phoneService.updateActivityPhone(id, updatePhoneDto, user.id);
  }

  @Delete('/:id')
  @Permissions(PermissionAuth.DELETE_PHONE_DATA)
  async deleteActivityPhone(
    @Param('id') id: string,
    @GetUser() user,
  ): Promise<any> {
    return this.phoneService.deleteActivityPhone(id, user.id);
  }

  @Post()
  @Permissions(PermissionAuth.VIEW_ALL_PHONE_DATA)
  async getDataPhone(
    @Body(ValidationPipe) getPhoneDto: GetPhoneDto,
  ): Promise<any> {
    return this.phoneService.getDataPhone(getPhoneDto);
  }
}
