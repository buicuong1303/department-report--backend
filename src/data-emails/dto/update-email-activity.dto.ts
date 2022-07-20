import { Type } from 'class-transformer';
import { IsString, IsDate, IsOptional } from 'class-validator';
import { EntityStatus } from 'src/utils/entity-status';

export class UpdateEmailActivityDto {
  @IsOptional()
  @IsString()
  id: string;

  @IsOptional()
  @IsString()
  originalPath: string;

  @IsOptional()
  @IsString()
  agent: string;

  @IsOptional()
  @IsString()
  agentAfterTransfer: string;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  sent: Date;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  received: Date;

  @IsOptional()
  @IsString()
  subjectOrTitle: string;

  @IsOptional()
  @IsString()
  senderOrCreated: string;

  @IsOptional()
  @IsString()
  recipientsIntoLine: string;

  @IsOptional()
  @IsString()
  recipientInCcLine: string;

  @IsOptional()
  status: EntityStatus;
}
