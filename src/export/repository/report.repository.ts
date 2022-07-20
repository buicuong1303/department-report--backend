import { Report } from '../entity/report.entity';
import { Repository, EntityRepository } from 'typeorm';

@EntityRepository(Report)
export class ReportRepository extends Repository<Report> {}
