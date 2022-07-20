import { GlipMasterReportActivities } from '../entity/glip-master-activities.entity';
import { Repository, EntityRepository } from 'typeorm';

@EntityRepository(GlipMasterReportActivities)
export class GlipMasterReportActivitiesRepository extends Repository<
  GlipMasterReportActivities
> {}
