import { IsEnum, IsNotEmpty } from 'class-validator';
import { OrderStatus } from '../../../domain/sales-order/enums/order-status.enum';

export class UpdateOrderStatusDto {
  @IsEnum(OrderStatus)
  @IsNotEmpty()
  status!: OrderStatus;
}
