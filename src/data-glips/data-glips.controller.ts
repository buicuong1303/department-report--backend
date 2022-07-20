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
import { DataGlipsService } from './data-glips.service';
import { GetGlipDto } from './dto/get-glip.dto';
import { UpdateGlipDto } from './dto/update-glip.dto';

@UseGuards(SessionAuthGuard, PermissionAuthGuard)
@Controller('data-glips')
export class DataGlipsController {
  constructor(private readonly dataGlipServices: DataGlipsService) {}

  @Patch('/:id')
  @Permissions(PermissionAuth.UPDATE_GLIP_DATA)
  async updateActivityGlip(
    @Param('id') id: string,
    @Body(ValidationPipe) updateGlipDto: UpdateGlipDto,
    @GetUser() user,
  ): Promise<any> {
    return this.dataGlipServices.updateActivityGlip(id, updateGlipDto, user.id);
  }

  @Delete('/:id')
  @Permissions(PermissionAuth.DELETE_GLIP_DATA)
  async deleteActivityGlip(
    @Param('id') id: string,
    @GetUser() user,
  ): Promise<any> {
    return this.dataGlipServices.deleteActivityGlip(id, user.id);
  }

  @Post()
  @Permissions(PermissionAuth.VIEW_ALL_GLIP_DATA)
  async getDataGlip(
    @Body(ValidationPipe) getGlipDto: GetGlipDto,
  ): Promise<any> {
    return this.dataGlipServices.getDataGlip(getGlipDto);
  }
}
