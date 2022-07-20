import { Repository, EntityRepository } from 'typeorm';
import { InboundCallActivities } from '../entity/inbound-call.entity';
@EntityRepository(InboundCallActivities)
export class InboundCallActivitiesRepository extends Repository<
  InboundCallActivities
> {}
