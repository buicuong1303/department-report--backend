import {
  BaseEntity,
  PrimaryGeneratedColumn,
  Column,
  Entity,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  Unique,
} from 'typeorm';
import { Agent } from 'src/agents/entity/agent.entity';
import { Department } from './department.entity';
import { EntityStatus } from 'src/utils/entity-status';

@Entity()
@Unique(['agent', 'department'])
export class AgentDepartment extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ default: '' })
  creationUserId: string;

  @Column({ default: '' })
  lastModifiedUserId: string;

  @CreateDateColumn({ type: 'timestamptz' })
  creationTime: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  lastModifiedTime: Date;

  @Column({ default: EntityStatus.ACTIVE })
  status: EntityStatus;

  @ManyToOne(
    type => Department,
    department => department.departmentOfAgent,
  )
  department: Department;

  @ManyToOne(
    type => Agent,
    agent => agent.departmentOfAgent,
  )
  agent: Agent;
}
