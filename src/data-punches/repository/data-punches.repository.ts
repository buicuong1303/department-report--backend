import { PunchActivities } from '../entity/punch.entity';
import { Repository, EntityRepository } from 'typeorm';

@EntityRepository(PunchActivities)
export class PunchActivitiesRepository extends Repository<PunchActivities> {}
