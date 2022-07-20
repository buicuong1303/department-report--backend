import {
  BaseEntity,
  PrimaryGeneratedColumn,
  Column,
  Entity,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { EmailActivities } from 'src/data-emails/entity/email-activities.entity';
import { PhoneActivities } from 'src/data-phones/entity/phone-activities.entity';
import { InboundCallActivities } from 'src/data-ics/entity/inbound-call.entity';
import { EntityStatus } from 'src/utils/entity-status';

@Entity()
export class FileImport extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  fileName: string;

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

  @OneToMany(
    type => EmailActivities,
    emailActivities => emailActivities.file,
  )
  emailActivities: EmailActivities[];

  @OneToMany(
    type => PhoneActivities,
    phoneActivities => phoneActivities.file,
  )
  phoneActivities: PhoneActivities[];

  @OneToMany(
    type => InboundCallActivities,
    inboundCallActivities => inboundCallActivities.file,
  )
  inboundCallActivities: InboundCallActivities[];
}
