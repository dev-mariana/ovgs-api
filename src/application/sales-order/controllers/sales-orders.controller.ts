import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import type { SalesOrder } from '../../../domain/sales-order/entities/sales-order.entity';
import { CreateSalesOrderDto } from '../dto/create-sales-order.dto';
import { ListSalesOrdersDto } from '../dto/list-sales-orders.dto';
import { UpdateOrderStatusDto } from '../dto/update-order-status.dto';
import { SalesOrdersService } from '../services/sales-orders.service';

@Controller('sales-orders')
export class SalesOrdersController {
  constructor(private readonly service: SalesOrdersService) {}

  @Post()
  async create(@Body() dto: CreateSalesOrderDto) {
    const order = await this.service.create(dto);
    return this.formatDetail(order);
  }

  @Get()
  async findAll(@Query() query: ListSalesOrdersDto) {
    const result = await this.service.findAll(query);
    return {
      ...result,
      data: result.data.map((order) => ({
        id: order.id,
        orderNumber: order.orderNumber,
        customer: order.customer
          ? { id: order.customer.id, name: order.customer.name }
          : undefined,
        transportType: order.transportType
          ? { id: order.transportType.id, name: order.transportType.name }
          : undefined,
        status: order.status,
        itemCount: order.itemCount ?? 0,
        createdAt: order.createdAt,
      })),
    };
  }

  @Get(':id')
  async findById(@Param('id') id: string) {
    const result = await this.service.findById(id);
    const { auditHistory } = result;
    return { ...this.formatDetail(result), auditHistory };
  }

  @Patch(':id/status')
  async updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateOrderStatusDto,
  ) {
    const order = await this.service.updateStatus(id, dto);
    return this.formatDetail(order);
  }

  private formatDetail(order: SalesOrder) {
    const { schedule, items, itemCount: _itemCount, ...rest } = order;

    return {
      ...rest,
      items: items?.map((i) => ({
        itemId: i.itemId,
        sku: i.item?.sku,
        name: i.item?.name,
        quantity: i.quantity,
      })),
      deliverySchedule: schedule ?? null,
    };
  }
}
