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
export class EpicActivities extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: true })
  lookupCode: string;

  @Column({ nullable: true })
  accountName: string;

  @Column({ nullable: true })
  activityCode: string;

  @Column({ nullable: true })
  description: string;

  @Column({ nullable: true })
  addTo: string;

  @Column({ type: 'timestamp', nullable: true })
  createdTime: Date;
  @Column({ nullable: true })
  taskDescription: string;

  @Column({ type: 'timestamp', nullable: true })
  updatedTime: Date;

  @Column({ default: '' })
  creationUserId: string;

  @Column({ default: '' })
  lastModifiedUserId: string;

  @CreateDateColumn({ type: 'timestamptz' })
  creationTime: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  lastModifiedTime: Date;

  @Column({ default: '' })
  body: string;

  @Column({ default: '' })
  phoneNumber: string;

  @Column({ default: EntityStatus.ACTIVE })
  status: EntityStatus;

  @ManyToOne(
    type => Agent,
    agent => agent.epicCreatedActivities,
  )
  @JoinColumn({ name: 'createdBy' })
  createdBy: Agent;

  @ManyToOne(
    type => Agent,
    agent => agent.epicUpdatedActivities,
  )
  @JoinColumn({ name: 'updatedBy' })
  updatedBy: Agent;
}
