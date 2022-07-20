import { Module, Global, HttpModule } from '@nestjs/common';
import { AuthAutomationCoreService } from './auth-automation-core.service';
import * as config from 'config';

const url = config.get('microservices.automation-core.auth-url');

@Global()
@Module({
  imports: [
    HttpModule.register({
      timeout: 5000,
      maxRedirects: 5,
      baseURL: url,
    }),
  ],
  providers: [AuthAutomationCoreService],
  exports: [AuthAutomationCoreService],
})
export class AuthAutomationCoreModule {}
