import { IsString, IsNotEmpty } from 'class-validator';

export class CreateDepartmentsDto {
  @IsNotEmpty()
  @IsString()
  name: string;
}
