import { Repository, EntityRepository } from 'typeorm';
import { AgentDepartment } from '../entity/agent-department.entity';

@EntityRepository(AgentDepartment)
export class AgentDepartmentRepository extends Repository<AgentDepartment> {}
