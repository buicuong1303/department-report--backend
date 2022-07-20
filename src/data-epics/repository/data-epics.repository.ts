import { Repository, EntityRepository } from 'typeorm';
import { EpicActivities } from '../entity/epic-activities.entity';

@EntityRepository(EpicActivities)
export class EpicActivitiesRepository extends Repository<EpicActivities> {}
