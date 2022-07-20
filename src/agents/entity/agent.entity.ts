import {
  BaseEntity,
  PrimaryGeneratedColumn,
  Column,
  Entity,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  Unique,
} from 'typeorm';
import { AgentDepartment } from 'src/departments/entity/agent-department.entity';
import { EntityStatus } from 'src/utils/entity-status';
import { GlipMasterReportActivities } from 'src/data-glips/entity/glip-master-activities.entity';
import { EmailActivities } from 'src/data-emails/entity/email-activities.entity';
import { InboundCallActivities } from 'src/data-ics/entity/inbound-call.entity';
import { PhoneActivities } from 'src/data-phones/entity/phone-activities.entity';
import { EpicActivities } from 'src/data-epics/entity/epic-activities.entity';
import { PunchActivities } from 'src/data-punches/entity/punch.entity';
import { AutoIssues } from '../../auto-issues/entity/auto-issues.entity';
@Entity()
// @Unique("UQ_NAMES", ["firstName", "lastName"])
export class Agent extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  firstName: string;

  @Column({ default: '' })
  lastName: string;

  @Column({ default: '' })
  firstNameSpecial: string;

  @Column({ default: '' })
  originalName: string;

  @Column({ default: '' })
  creationUserId: string;

  @Column({ default: '' })
  lastModifiedUserId: string;

  @CreateDateColumn({ type: 'timestamptz' })
  creationTime: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  lastModifiedTime: Date;

  @Column({ default: false })
  isPrimary: boolean;

  @Column({ default: EntityStatus.ACTIVE })
  status: EntityStatus;

  @OneToMany(
    type => AgentDepartment,
    departmentOfAgent => departmentOfAgent.agent,
  )
  departmentOfAgent: AgentDepartment[];

  @OneToMany(
    type => GlipMasterReportActivities,
    glipActivities => glipActivities.agent,
  )
  glipActivities: GlipMasterReportActivities[];

  @OneToMany(
    type => GlipMasterReportActivities,
    glipActivities => glipActivities.whoAssign,
  )
  whoAssigns: GlipMasterReportActivities[];

  @OneToMany(
    type => GlipMasterReportActivities,
    glipActivities => glipActivities.createdBy,
  )
  createdByAgents: GlipMasterReportActivities[];

  @OneToMany(
    type => EmailActivities,
    emailActivities => emailActivities.agent,
  )
  emailActivities: EmailActivities[];

  @OneToMany(
    type => InboundCallActivities,
    inboundCallActivities => inboundCallActivities.agent,
  )
  inboundCallActivities: InboundCallActivities[];

  // @OneToMany(
  //   type => InboundCallActivities,
  //   inboundCallActivities => inboundCallActivities.assignTo,
  // )
  // assignToAgents: InboundCallActivities[];

  @OneToMany(
    type => PhoneActivities,
    phoneActivities => phoneActivities.agent,
  )
  phoneActivities: PhoneActivities[];

  @OneToMany(
    type => EpicActivities,
    epicActivities => epicActivities.createdBy,
  )
  epicCreatedActivities: EpicActivities[];

  @OneToMany(
    type => EpicActivities,
    epicActivities => epicActivities.updatedBy,
  )
  epicUpdatedActivities: EpicActivities[];

  @OneToMany(
    type => PunchActivities,
    punchActivities => punchActivities.agent,
  )
  punchs: PunchActivities[];

  @OneToMany(
    type => AutoIssues,
    issue => issue.agent,
  )
  issues: AutoIssues[];
}
