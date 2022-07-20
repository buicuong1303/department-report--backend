import { IsString, IsOptional, IsEmail } from 'class-validator';
import { EntityStatus } from 'src/utils/entity-status';

export class UpdateEmailTeamsDto {
  @IsOptional()
  @IsString()
  id: string;

  @IsOptional()
  @IsString()
  displayName: string;

  @IsOptional()
  @IsEmail()
  emailAddress: string;

  @IsOptional()
  status: EntityStatus;
}
