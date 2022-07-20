import { Agent } from 'src/agents/entity/agent.entity';
import { FileImport } from 'src/import/entity/file-import.entity';
import { EntityStatus } from 'src/utils/entity-status';
import { JoinColumn, ManyToOne } from 'typeorm';
import {
  BaseEntity,
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity()
export class InboundCallActivities extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: true })
  boardName: string;


  @Column({ nullable: true })
  pulseId: string;

  @Column({ nullable: true })
  clientStatus: string;

  @Column({ type: 'timestamptz', nullable: true })
  iCDate: Date;

  @Column({ nullable: true })
  taskName: string;

  @Column()
  phone: string;

  @Column({ nullable: true })
  service: string;

  @Column({ nullable: true })
  line: string;

  @Column({ nullable: true })
  description: string;

  @Column({ nullable: true })
  requestedAgent: string;

  @Column({ nullable: true })
  timer: string;

  @Column({ nullable: true })
  workBy: string;

  @Column({ nullable: true })
  duration: string;

  @Column({ nullable: true })
  alertDepartment: string;

  @Column({ nullable: true })
  lastUpdate: string;

  @Column({ nullable: true })
  creationLog: string;

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

  // @ManyToOne(
  //   type => Agent,
  //   agent => agent.assignToAgents,
  // )
  // @JoinColumn({ name: 'assignTo' })
  // clientStatus: Agent;

  @ManyToOne(
    type => FileImport,
    file => file.inboundCallActivities,
  )
  file: FileImport;

  @ManyToOne(
    type => Agent,
    agent => agent.inboundCallActivities,
  )
  agent: Agent;
}
