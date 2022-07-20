import { Agent } from 'src/agents/entity/agent.entity';
import { FileImport } from 'src/import/entity/file-import.entity';
import { EntityStatus } from 'src/utils/entity-status';
import { ManyToOne } from 'typeorm';
import {
  BaseEntity,
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity()
// @Unique(['originalPath', 'agent', 'agentAfterTransfer', 'sent', 'received', 'subjectOrTitle', 'senderOrCreated', 'recipientsIntoLine', 'recipientInCcLine'])
export class EmailActivities extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  originalPath: string;

  // @Column()
  // agentAfterTransfer: string;

  @Column({ type: 'timestamp', nullable: true })
  sent: Date;

  @Column({ type: 'timestamp', nullable: true })
  received: Date;

  @Column({ nullable: true })
  subjectOrTitle: string;

  @Column({ nullable: true })
  senderOrCreated: string;

  @Column({ nullable: true })
  recipientsIntoLine: string;

  @Column({ nullable: true })
  recipientInCcLine: string;

  @Column()
  creationUserId: string;

  @Column()
  lastModifiedUserId: string;

  @CreateDateColumn({ type: 'timestamptz' })
  creationTime: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  lastModifiedTime: Date;

  @Column({ default: EntityStatus.ACTIVE })
  status: EntityStatus;

  @ManyToOne(
    type => FileImport,
    file => file.emailActivities,
  )
  file: FileImport;

  @ManyToOne(
    type => Agent,
    agent => agent.emailActivities,
  )
  agent: Agent;
}
