import { EntityStatus } from 'src/utils/entity-status';
import {
  BaseEntity,
  PrimaryGeneratedColumn,
  Column,
  Entity,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
} from 'typeorm';
import { Agent } from 'src/agents/entity/agent.entity';

@Entity()
export class PunchActivities extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // @Column({default:''})
  // englishName: string; //* agent

  @Column({ type: 'date', nullable: true })
  punchDate: Date;

  // @Column('time')
  @Column({ default: '' })
  checkIn: string;

  @Column({ default: '' })
  checkOut: string;

  // @Column({type:'time', nullable: true})
  @Column({ default: '' })
  startLunch: string;

  // @Column({type:'time', nullable: true})
  @Column({ default: '' })
  endLunch: string;

  @Column({ default: '' })
  totalTime: string;

  @Column({ default: '' })
  totalLunch: string;

  @Column({ default: '' })
  totalWork: string;

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
    type => Agent,
    agent => agent.punchs,
  )
  agent: Agent;
}
