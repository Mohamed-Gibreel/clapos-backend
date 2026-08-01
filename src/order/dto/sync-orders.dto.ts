import { IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { CreateOrderDTO } from './create-order.dto';

export class SyncOrdersDTO {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateOrderDTO)
  orders: CreateOrderDTO[];
}
