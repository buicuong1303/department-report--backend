import { IsString } from 'class-validator';

export class GetPunchAgentDto {
  @IsString()
  from: string;

  @IsString()
  to: string;

  @IsString()
  name: string;
}
