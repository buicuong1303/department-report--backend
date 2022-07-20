import { Repository, EntityRepository } from 'typeorm';
import { AutoIssues } from '../entity/auto-issues.entity';

@EntityRepository(AutoIssues)
export class AutoIssuesRepository extends Repository<AutoIssues> {}
