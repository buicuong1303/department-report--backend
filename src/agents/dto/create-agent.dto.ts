import {
  IsString,
  IsNotEmpty,
  IsOptional,
  isBoolean,
  IsBoolean,
} from 'class-validator';

export class CreateAgentsDto {
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
}
