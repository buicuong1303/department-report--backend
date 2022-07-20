import { IsString, IsNotEmpty, IsOptional, IsBoolean } from 'class-validator';
import { EntityStatus } from 'src/utils/entity-status';

export class UpdateAgentsDto {
  @IsNotEmpty()
  @IsString()
  firstName: string;

  @IsOptional()
  @IsString()
  lastName: string;

  @IsOptional()
  @IsString()
  firstNameSpecial: string;

  @IsOptional()
  @IsString()
  originalName: string;

  @IsOptional()
  @IsBoolean()
  isPrimary: boolean;

  status: EntityStatus;
}
