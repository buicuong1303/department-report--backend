import { GroupDto } from './group.dto';
import { ColumnValueDto } from './column-value.dto';
export class ItemDto {
  id: number;
  name: string;
  column_values: ColumnValueDto[];
  group: GroupDto;
}
