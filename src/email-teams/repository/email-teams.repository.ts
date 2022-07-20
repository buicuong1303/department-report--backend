import { EmailTeams } from '../entity/email.entity';
import { Repository, EntityRepository } from 'typeorm';

@EntityRepository(EmailTeams)
export class EmailTeamsRepository extends Repository<EmailTeams> {}
