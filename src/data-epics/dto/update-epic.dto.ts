import { IsDate, IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';
import { EntityStatus } from 'src/utils/entity-status';
export class UpdateEpicDto {
  @IsOptional()
  @IsString()
  lookupCode: string;

  @IsOptional()
  @IsString()
  accountName: string;

  @IsOptional()
  @IsString()
  activityCode: string;

  @IsOptional()
  @IsString()
  description: string;

  @IsOptional()
  @IsString()
  addTo: string;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  createdTime: Date;

  @IsOptional()
  @IsString()
  createdBy: string;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  updatedTime: Date;

  @IsOptional()
  @IsString()
  updatedBy: string;

  @IsOptional()
  @IsString()
  taskDescription: string;

  @IsOptional()
  status: EntityStatus;
}
