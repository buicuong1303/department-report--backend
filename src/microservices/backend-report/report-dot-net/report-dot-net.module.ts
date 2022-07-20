import { Module, HttpModule } from '@nestjs/common';
import { ReportDotNetService } from './report-dot-net.service';
import * as config from 'config';

const url = config.get('microservices.backend-report.report-url');
@Module({
  imports: [
    HttpModule.register({
      timeout: 1800000, //* 30 Min
      maxRedirects: 5,
      baseURL: url,
    }),
  ],
  providers: [ReportDotNetService],
  exports: [ReportDotNetService],
})
export class ReportDotNetModule {}
