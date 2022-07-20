import {
  IsArray,
  IsDate,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import { Type } from 'class-transformer';
export class GetPhoneDto {
  @IsOptional()
  @IsNumber()
  page: number;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  from: Date;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  to: Date;

  @IsOptional()
  @IsString()
  department: string;

  @IsOptional()
  @IsNumber()
  limit: number;

  @IsOptional()
  @IsArray()
  agents: Array<any>;
}
