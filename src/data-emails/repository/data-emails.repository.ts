import { EmailActivities } from '../entity/email-activities.entity';
import { Repository, EntityRepository } from 'typeorm';

@EntityRepository(EmailActivities)
export class EmailActivitiesRepository extends Repository<EmailActivities> {}
