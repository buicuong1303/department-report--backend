import { EntityStatus } from 'src/utils/entity-status';
import {
  BaseEntity,
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
} from 'typeorm';
import { Agent } from '../../agents/entity/agent.entity';

@Entity()
export class AutoIssues extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: true })
  creationUserId: string;

  @Column({ nullable: true })
  lastModifiedUserId: string;

  @CreateDateColumn({ type: 'timestamptz' })
  creationTime: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  lastModifiedTime: Date;

  @Column({ default: EntityStatus.ACTIVE })
  status: EntityStatus;
  
  @Column({ nullable: true })
  team: string;

  @Column({ nullable: true })
  category: string;

  @Column({ type: 'timestamptz', nullable: true })
  issueDate: Date;

  @ManyToOne(
    type => Agent,
    agent => agent.issues,
  )
  agent: Agent;

  @Column({ nullable: true })
  type: string;

  @Column({ nullable: true })
  description: string;

  @Column({ nullable: true })
  managerReply: string;

  @Column({ nullable: true })
  pulseId: string;

  @Column({ nullable: true })
  waitingTime: string;

  @Column({ nullable: true })
  returnTime: string;

  @Column({ nullable: true })
  clientName: string;

  @Column({ nullable: true })
  departmentName: string;

  @Column({ nullable: true })
  phone: string;
  
  @Column({ nullable: true })
  assignTo: string;
}
