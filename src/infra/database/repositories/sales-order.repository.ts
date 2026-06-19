import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { SalesOrder } from '../../../domain/sales-order/entities/sales-order.entity';
import { OrderStatus } from '../../../domain/sales-order/enums/order-status.enum';
import {
  CreateSalesOrderData,
  ISalesOrderRepository,
  ListSalesOrdersParams,
  PaginatedResult,
} from '../../../domain/sales-order/repositories/sales-order.repository';
import { SalesOrderMapper } from '../prisma/mappers/sales-order.mapper';
import { PrismaService } from '../prisma/prisma.service';

const WITH_FULL_RELATIONS = {
  customer: true,
  transportType: true,
  items: { include: { item: true } },
  schedule: true,
};

@Injectable()
export class PrismaSalesOrderRepository implements ISalesOrderRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<SalesOrder | null> {
    const raw = await this.prisma.salesOrder.findUnique({
      where: { id },
      include: WITH_FULL_RELATIONS,
    });

    return raw ? SalesOrderMapper.toDomain(raw) : null;
  }

  async findAll(
    params: ListSalesOrdersParams,
  ): Promise<PaginatedResult<SalesOrder>> {
    const {
      page,
      limit,
      status,
      customerId,
      transportTypeId,
      dateFrom,
      dateTo,
    } = params;
    const skip = (page - 1) * limit;

    const where: Prisma.SalesOrderWhereInput = {};

    if (status) where.status = status;
    if (customerId) where.customerId = customerId;
    if (transportTypeId) where.transportTypeId = transportTypeId;

    if (dateFrom || dateTo) {
      where.createdAt = {};

      if (dateFrom) where.createdAt.gte = dateFrom;
      if (dateTo) where.createdAt.lte = dateTo;
    }

    const [rows, total] = await this.prisma.$transaction([
      this.prisma.salesOrder.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          customer: true,
          transportType: true,
          _count: { select: { items: true } },
        },
      }),

      this.prisma.salesOrder.count({ where }),
    ]);

    return { data: rows.map((r) => SalesOrderMapper.toDomain(r)), total };
  }

  async create(
    data: CreateSalesOrderData,
    tx?: Prisma.TransactionClient,
  ): Promise<SalesOrder> {
    const client = tx ?? this.prisma;
    const orderNumber = await this.generateOrderNumber(tx);

    const raw = await client.salesOrder.create({
      data: {
        orderNumber,
        customerId: data.customerId,
        transportTypeId: data.transportTypeId,
        notes: data.notes,
        items: {
          create: data.items.map((item) => ({
            itemId: item.itemId,
            quantity: item.quantity,
          })),
        },
      },
      include: WITH_FULL_RELATIONS,
    });

    return SalesOrderMapper.toDomain(raw);
  }

  async updateStatus(
    id: string,
    status: OrderStatus,
    tx?: Prisma.TransactionClient,
  ): Promise<SalesOrder> {
    const client = tx ?? this.prisma;
    const raw = await client.salesOrder.update({
      where: { id },
      data: { status },
      include: WITH_FULL_RELATIONS,
    });

    return SalesOrderMapper.toDomain(raw);
  }

  async updateTransportType(
    id: string,
    transportTypeId: string,
  ): Promise<SalesOrder> {
    const raw = await this.prisma.salesOrder.update({
      where: { id },
      data: { transportTypeId },
      include: WITH_FULL_RELATIONS,
    });

    return SalesOrderMapper.toDomain(raw);
  }

  async generateOrderNumber(tx?: Prisma.TransactionClient): Promise<string> {
    const client = tx ?? this.prisma;
    const year = new Date().getFullYear();
    const count = await client.salesOrder.count();
    const padded = String(count + 1).padStart(5, '0');

    return `OV-${year}-${padded}`;
  }
}
