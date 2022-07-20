import { Module, HttpModule } from '@nestjs/common';
import { AppsService } from './apps.service';
import * as config from 'config';

const url = config.get('microservices.automation-core.apps-url');
const appId = config.get('app-id');

@Module({
  imports: [
    HttpModule.register({
      timeout: 5000,
      maxRedirects: 5,
      baseURL: `${url}/${appId}`,
    }),
  ],
  providers: [AppsService],
  exports: [AppsService],
})
export class AppsModule {}
