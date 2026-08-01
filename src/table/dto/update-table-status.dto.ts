import { IsEnum } from 'class-validator';
import { TableStatus } from '../entities/table.entity';

export class UpdateTableStatusDTO {
  @IsEnum(TableStatus)
  status: TableStatus;
}
