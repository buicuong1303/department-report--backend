import { IsDate, IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';
import { EntityStatus } from 'src/utils/entity-status';
export class UpdateInboundCallDto {
  @IsOptional()
  @IsString()
  id: string;

  @IsOptional()
  @IsString()
  team: string;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  dateGlipMaster: Date;

  @IsOptional()
  @IsString()
  taskName: string;

  @IsOptional()
  @IsString()
  type: string;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  createdTime: Date;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  servedTime: Date;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  completedTime: Date;

  @IsOptional()
  @IsString()
  services: string;

  @IsOptional()
  @IsString()
  agentFullName: string;

  @IsOptional()
  @IsString()
  agent: string;

  @IsOptional()
  @IsString()
  finalStatus: string;

  @IsOptional()
  @IsString()
  createdBy: string;

  @IsOptional()
  @IsString()
  whoAssign: string;

  @IsOptional()
  @IsString()
  note: string;

  @IsOptional()
  @IsString()
  serviceNeeded: string;

  @IsOptional()
  @IsString()
  phone: string;

  @IsOptional()
  @IsString()
  address: string;

  @IsOptional()
  @IsString()
  needFollowup: string;

  @IsOptional()
  @IsString()
  rate: string;

  @IsOptional()
  @IsString()
  clientSign: string;

  @IsOptional()
  @IsString()
  reason: string;

  @IsOptional()
  @IsString()
  clientName: string;

  @IsOptional()
  @IsString()
  phonePersonal: string;

  @IsOptional()
  @IsString()
  typePersonal: string;

  @IsOptional()
  @IsString()
  pol: string;

  @IsOptional()
  @IsString()
  notePersonal: string;

  @IsOptional()
  status: EntityStatus;
}
