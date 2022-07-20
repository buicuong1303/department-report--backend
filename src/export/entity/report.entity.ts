import { ReportTypes } from './../enum/report-type';
import { ReportStatus } from '../enum/report-status.enum';
import {
	BaseEntity,
	PrimaryGeneratedColumn,
	Column,
	Entity,
	CreateDateColumn,
	UpdateDateColumn,
} from 'typeorm';
import { EntityStatus } from '../../utils/entity-status';

@Entity()
export class Report extends BaseEntity {
	@PrimaryGeneratedColumn('uuid')
	id: string;

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

	@Column({ default: '' })
	path: string;
    
	@Column({ default: ReportStatus.PENDING })
	reportStatus: ReportStatus;

	@Column({ default: '' })
	creationUserName: string;
	
	@Column({ default: '' })
	error: string;

	@Column({ default: '' })
	type: ReportTypes;
}
