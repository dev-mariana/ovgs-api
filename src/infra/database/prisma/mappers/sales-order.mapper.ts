import type {
  Customer as PrismaCustomer,
  DeliverySchedule as PrismaDeliverySchedule,
  Item as PrismaItem,
  SalesOrder as PrismaSalesOrder,
  SalesOrderItem as PrismaSalesOrderItem,
  TransportType as PrismaTransportType,
} from '@prisma/client';
import { SalesOrder } from '../../../../domain/sales-order/entities/sales-order.entity';
import { OrderStatus } from '../../../../domain/sales-order/enums/order-status.enum';
import { CustomerMapper } from './customer.mapper';
import { DeliveryScheduleMapper } from './delivery-schedule.mapper';
import { ItemMapper } from './item.mapper';
import { TransportTypeMapper } from './transport-type.mapper';

type PrismaSalesOrderWithRelations = PrismaSalesOrder & {
  customer?: PrismaCustomer;
  transportType?: PrismaTransportType;
  items?: (PrismaSalesOrderItem & { item: PrismaItem })[];
  schedule?: PrismaDeliverySchedule | null;
  _count?: { items: number };
};

export class SalesOrderMapper {
  static toDomain(raw: PrismaSalesOrderWithRelations): SalesOrder {
    return {
      id: raw.id,
      orderNumber: raw.orderNumber,
      customerId: raw.customerId,
      customer: raw.customer
        ? CustomerMapper.toDomain(raw.customer)
        : undefined,
      transportTypeId: raw.transportTypeId,
      transportType: raw.transportType
        ? TransportTypeMapper.toDomain(raw.transportType)
        : undefined,
      status: raw.status as OrderStatus,
      notes: raw.notes ?? undefined,
      items: raw.items?.map((oi) => ({
        salesOrderId: oi.salesOrderId,
        itemId: oi.itemId,
        item: ItemMapper.toDomain(oi.item),
        quantity: oi.quantity,
        createdAt: oi.createdAt,
      })),
      schedule: raw.schedule
        ? DeliveryScheduleMapper.toDomain(raw.schedule)
        : null,
      itemCount: raw._count?.items,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
    };
  }
}
