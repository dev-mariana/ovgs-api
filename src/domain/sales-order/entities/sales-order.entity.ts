import { Customer } from '../../customer/entities/customer.entity';
import { DeliverySchedule } from '../../schedule/entities/delivery-schedule.entity';
import { TransportType } from '../../transport-type/entities/transport-type.entity';
import { OrderStatus } from '../enums/order-status.enum';
import { SalesOrderItem } from './sales-order-item.entity';

export interface SalesOrder {
  id: string;
  orderNumber: string;
  customerId: string;
  customer?: Customer;
  transportTypeId: string;
  transportType?: TransportType;
  status: OrderStatus;
  notes?: string;
  items?: SalesOrderItem[];
  schedule?: DeliverySchedule | null;
  itemCount?: number;
  createdAt: Date;
  updatedAt: Date;
}
