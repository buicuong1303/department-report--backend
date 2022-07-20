import { Controller, Get } from '@nestjs/common';

@Controller('logics')
export class LogicsController {
  @Get('/')
  testController() {
    return 'logics';
  }
}
