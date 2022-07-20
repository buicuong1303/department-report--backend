import { Optional } from '@nestjs/common';
import { IsString, IsNotEmpty } from 'class-validator';
import { EntityStatus } from 'src/utils/entity-status';

export class UpdateDepartmentsDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  status: EntityStatus;
}
