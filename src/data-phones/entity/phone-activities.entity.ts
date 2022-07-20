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
export class PhoneActivities extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: true })
  callId: string;

  @Column({ type: 'timestamp' })
  dateTimeCall: Date;

  @Column({ nullable: true })
  duration: string;

  @Column({ nullable: true })
  inOrOut: string;

  @Column({ nullable: true })
  line: string;

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
    type => FileImport,
    file => file.phoneActivities,
  )
  file: FileImport;

  @ManyToOne(
    type => Agent,
    file => file.phoneActivities,
  )
  agent: Agent;
}
