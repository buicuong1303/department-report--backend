import { Type } from 'class-transformer';
import { IsDate, IsOptional, IsString } from 'class-validator';
import { EntityStatus } from 'src/utils/entity-status';

export class AddPunchsActivitiesDto {
  @IsOptional()
  @IsString()
  agentId: string;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  punchDate: Date;

  @IsOptional()
  checkIn: string;

  @IsOptional()
  checkOut: string;

  @IsOptional()
  startLunch: string;

  @IsOptional()
  endLunch: string;

  @IsOptional()
  @IsString()
  totalTime: string;

  @IsOptional()
  @IsString()
  totalLunch: string;

  @IsOptional()
  @IsString()
  totalWork: string;

  @IsOptional()
  @IsString()
  status: EntityStatus;
}
