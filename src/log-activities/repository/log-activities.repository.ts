import { LogActivity } from './../entity/log-activity.entity';
import { Repository, EntityRepository } from 'typeorm';

@EntityRepository(LogActivity)
export class LogActivityRepository extends Repository<LogActivity> {}
