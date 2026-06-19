import { SalesOrderItem } from '../entities/sales-order-item.entity';
import { SalesOrder } from '../entities/sales-order.entity';
import { OrderStatus } from '../enums/order-status.enum';

export type ListSalesOrdersParams = {
  page: number;
  limit: number;
  status?: OrderStatus;
  customerId?: string;
  transportTypeId?: string;
  dateFrom?: Date;
  dateTo?: Date;
};

export type PaginatedResult<T> = {
  data: T[];
  total: number;
};

export type CreateSalesOrderData = {
  customerId: string;
  transportTypeId: string;
  notes?: string;
  items: Pick<SalesOrderItem, 'itemId' | 'quantity'>[];
};

export interface ISalesOrderRepository {
  findById(id: string): Promise<SalesOrder | null>;
  findAll(params: ListSalesOrdersParams): Promise<PaginatedResult<SalesOrder>>;
  create(data: CreateSalesOrderData): Promise<SalesOrder>;
  updateStatus(id: string, status: OrderStatus): Promise<SalesOrder>;
  updateTransportType(id: string, transportTypeId: string): Promise<SalesOrder>;
  generateOrderNumber(): Promise<string>;
}
