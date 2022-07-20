import { IsString, IsOptional, IsEmail } from 'class-validator';

export class CreateEmailTeamsDto {
  @IsOptional()
  @IsString()
  displayName: string;

  @IsOptional()
  @IsEmail()
  emailAddress: string;
}
