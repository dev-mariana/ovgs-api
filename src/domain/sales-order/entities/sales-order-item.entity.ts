import { Item } from '../../item/entities/item.entity';

export interface SalesOrderItem {
  salesOrderId: string;
  itemId: string;
  item?: Item;
  quantity: number;
  createdAt: Date;
}
