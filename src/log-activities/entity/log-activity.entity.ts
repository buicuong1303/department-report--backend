import { EntityStatus } from 'src/utils/entity-status';
import {
  BaseEntity,
  PrimaryGeneratedColumn,
  Column,
  Entity,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { HttpMethod } from '../enum/http-method.enum';
import { LogType } from '../enum/log-type.enum';
import { HashTag } from '../enum/hash-tag.enum';
@Entity()
export class LogActivity extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  fullName: string;

  @Column()
  userId: string;

  @Column()
  path: string;

  @Column()
  method: HttpMethod;

  @Column('jsonb')
  data;

  @Column()
  message: string;

  @Column()
  hashTag: HashTag;

  @Column({ default: '' })
  creationUserId: string;

  @Column({ default: '' })
  lastModifiedUserId: string;

  @CreateDateColumn({ type: 'timestamptz' })
  creationTime: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  lastModifiedTime: Date;

  @Column()
  ip: string;

  @Column()
  logType: LogType;

  @Column({ default: EntityStatus.ACTIVE })
  status: EntityStatus;
}
