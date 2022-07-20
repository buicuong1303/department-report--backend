import { EntityStatus } from 'src/utils/entity-status';
import {
  BaseEntity,
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Unique,
} from 'typeorm';
import { ConfigType } from '../enum/type.enum';

@Entity()
// @Unique(['originalPath', 'agent', 'agentAfterTransfer', 'sent', 'received', 'subjectOrTitle', 'senderOrCreated', 'recipientsIntoLine', 'recipientInCcLine'])
export class ConfigVariable extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: true })
  key: string;

  @Column({ default: '' })
  value: string;

  @Column({ default: ConfigType.MAIN_LINE })
  type: ConfigType;

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
}
