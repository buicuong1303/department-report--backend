import { Repository, EntityRepository } from 'typeorm';
import { PhoneActivities } from '../entity/phone-activities.entity';

@EntityRepository(PhoneActivities)
export class PhoneActivitiesRepository extends Repository<PhoneActivities> {}
