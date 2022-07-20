import { Repository, EntityRepository } from 'typeorm';
import { Agent } from '../entity/agent.entity';

@EntityRepository(Agent)
export class AgentRepository extends Repository<Agent> {}
