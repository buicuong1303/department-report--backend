import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Job, Queue } from 'bull';

@Injectable()
export class ApiRateLimitQueueProducer {
  constructor(
    @InjectQueue('monday-api-rate-limit')
    private readonly _apiRateLimitQueue: Queue,
  ) {}

  public async requestApi(requestName: any): Promise<Job> {
    const job = await this._apiRateLimitQueue.add(
      'request-api',
      { requestName },
      {
        attempts: 1,
        backoff: {
          type: 'fixed',
          delay: 5000, //* delay 5s when failed before retry, attempts >=1
        },
        removeOnComplete: true,
        removeOnFail: false,
      },
    );

    return job;
  }
}
