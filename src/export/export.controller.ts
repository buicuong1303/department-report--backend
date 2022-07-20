import { FiltersDto } from './dto/filters.dto';
import { Body, Controller, Get, Param, Post, Query, Res, UseGuards } from '@nestjs/common';
import { Response } from 'express';
import { join } from 'path';
import { ExportService } from './export.service';
import { GetUser } from '../auth/decorator/get-user.decorator';
import { SessionAuthGuard } from '../auth/guard/session-auth.guard';
import { PermissionAuthGuard } from '../auth/guard/permission-auth.guard';

@UseGuards(SessionAuthGuard, PermissionAuthGuard)
@Controller('export')
export class ExportController {
  constructor(private readonly exportService: ExportService) {}

  @Get('/')
  downloadReport(@Res() res: Response, @Query() queries) {
    const { url } = queries;
    const path = join(__dirname, '../../public/reports', url);
    res.download(path);
  }

  @Post('/')
  getReport(@Body() filters: FiltersDto, @GetUser() user,) {
    return this.exportService.getReport(filters, user);
  }

  //TODO: call report list here
  @Get('/tracking/:count')
  getReports(
    @Param('count') count: number
  ) {
    return this.exportService.getReports(count);
  }
}
