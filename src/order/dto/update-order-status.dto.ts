import { IsEnum } from 'class-validator';
import { OrderStatus } from '../entities/order.entity';

export class UpdateOrderStatusDTO {
  @IsEnum(OrderStatus)
  status: OrderStatus;
}
