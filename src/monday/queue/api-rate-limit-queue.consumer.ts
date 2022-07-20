/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  Processor,
  Process,
  OnQueueActive,
  OnQueueCompleted,
  OnQueueFailed,
} from '@nestjs/bull';
import { Job } from 'bull';
import { delay } from '../../utils/delay';

@Processor('monday-api-rate-limit')
export class ApiRateLimitQueueConsumer {
  @Process('request-api')
  async executeSendMessage(): Promise<boolean> {
    await delay(2000);
    return true;
  }
}
