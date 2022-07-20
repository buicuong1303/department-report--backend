import { InjectQueue } from '@nestjs/bull';
import { Injectable } from '@nestjs/common';
import { setQueues, BullMQAdapter } from 'bull-board';
import { Queue as QueueMQ } from 'bullmq';

@Injectable()
export class QueuesProvider {
  constructor(
    @InjectQueue('log-activity-queue')
    private readonly _logActivityQueue: QueueMQ,
    @InjectQueue('report-queue')
    private readonly _reportQueue: QueueMQ,
    @InjectQueue('monday-api-rate-limit')
    private readonly _mondayApiRateLimit: QueueMQ,
  ) {
    this._setupBullQueueMonitoring();
  }

  private _setupBullQueueMonitoring = () => {
    const bullMQAdapters: BullMQAdapter[] = [
      new BullMQAdapter(this._logActivityQueue),
      new BullMQAdapter(this._reportQueue),
      new BullMQAdapter(this._mondayApiRateLimit),
    ];

    setQueues(bullMQAdapters);
  };
}
