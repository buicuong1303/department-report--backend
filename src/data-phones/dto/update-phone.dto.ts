import { IsDate, IsOptional, IsString, Matches } from 'class-validator';
import { Type } from 'class-transformer';
import { EntityStatus } from 'src/utils/entity-status';
export class UpdatePhoneDto {
  @IsOptional()
  @IsString()
  agent: string;

  @IsOptional()
  @IsString()
  callId: string;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  dateTimeCall: Date;

  @IsOptional()
  @Matches(/^(0[0-9]|1[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/)
  duration: string;

  @IsOptional()
  @IsString()
  inOrOut: string;

  @IsOptional()
  @IsString()
  line: string;

  @IsOptional()
  status: EntityStatus;
}
