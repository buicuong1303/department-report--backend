import { IsOptional, IsString, IsUUID } from 'class-validator';
import { EntityStatus } from 'src/utils/entity-status';
export class ConfigDto {
  @IsOptional()
  @IsUUID()
  id: string;

  @IsOptional()
  @IsString()
  key: string;

  @IsOptional()
  value: string;

  @IsOptional()
  status: EntityStatus;
}
