import { Agent } from 'src/agents/entity/agent.entity';
import { EntityStatus } from 'src/utils/entity-status';
import {
  BaseEntity,
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';

@Entity()
export class GlipMasterReportActivities extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ default: '' })
  team: string;

  @Column({ type: 'date', nullable: true })
  dateGlipMaster: Date;

  @Column({ default: '' })
  name: string;

  @Column({ default: '' })
  taskName: string;

  @Column({ default: '' })
  type: string;

  @Column({ default: '' })
  sheet: string;

  @Column({ type: 'time', nullable: true })
  createdTime: Date;

  @Column({ type: 'time', nullable: true })
  servedTime: Date;

  @Column({ type: 'time', nullable: true })
  completedTime: Date;

  @Column({ default: '' })
  services: string;

  @Column({ default: '' })
  finalStatus: string;

  @ManyToOne(
    type => Agent,
    agent => agent.createdByAgents,
  )
  @JoinColumn({ name: 'createdBy' })
  createdBy: Agent;

  @ManyToOne(
    type => Agent,
    agent => agent.whoAssigns,
  )
  @JoinColumn({ name: 'whoAssign' })
  whoAssign: Agent;

  @Column({ default: '' })
  note: string;

  @Column({ default: '' })
  serviceNeeded: string;

  @Column({ default: '' })
  phone: string;

  @Column({ default: '' })
  address: string;

  @Column({ default: '' })
  needFollowUp: string;

  @Column({ default: '' })
  rate: string;

  @Column({ default: '' })
  clientSign: string;

  @Column({ default: '' })
  reason: string;

  @Column({ default: '' })
  clientName: string;

  @Column({ default: '' })
  phonePersonal: string;

  @Column({ default: '' })
  typePersonal: string;

  @Column({ default: '' })
  pol: string;

  @Column({ default: '' })
  notePersonal: string;

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
    type => Agent,
    agent => agent.glipActivities,
  )
  agent: Agent;
}
