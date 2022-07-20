import { EntityStatus } from 'src/utils/entity-status';
import {
  BaseEntity,
  PrimaryGeneratedColumn,
  Column,
  Entity,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity()
export class EmailTeams extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  displayName: string;

  @Column({ nullable: true })
  emailAddress: string;

  @Column()
  creationUserId: string;

  @Column({ default: '' })
  lastModifiedUserId: string;

  @CreateDateColumn({ type: 'timestamptz' })
  creationTime: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  lastModifiedTime: Date;

  @Column({ default: EntityStatus.ACTIVE })
  status: EntityStatus;
}
