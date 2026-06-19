import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import type { SalesOrder } from '../../../domain/sales-order/entities/sales-order.entity';
import { CreateSalesOrderDto } from '../dto/create-sales-order.dto';
import { ListSalesOrdersDto } from '../dto/list-sales-orders.dto';
import { UpdateOrderStatusDto } from '../dto/update-order-status.dto';
import { UpdateTransportTypeDto } from '../dto/update-transport-type.dto';
import { SalesOrdersService } from '../services/sales-orders.service';

@ApiTags('Sales Orders')
@Controller('sales-orders')
export class SalesOrdersController {
  constructor(private readonly service: SalesOrdersService) {}

  @Post()
  @ApiOperation({ summary: 'Create a sales order' })
  @ApiResponse({ status: 201, description: 'Sales order created.' })
  @ApiResponse({
    status: 400,
    description: 'Invalid payload or duplicate items.',
  })
  @ApiResponse({
    status: 404,
    description: 'Customer, transport type or item not found.',
  })
  @ApiResponse({
    status: 422,
    description: 'Transport type not authorized (RN-01) or no items (RN-02).',
  })
  async create(@Body() dto: CreateSalesOrderDto) {
    const order = await this.service.create(dto);
    return this.formatDetail(order);
  }

  @Get()
  @ApiOperation({ summary: 'List sales orders with operational filters' })
  @ApiResponse({ status: 200, description: 'Paginated list of sales orders.' })
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
  @ApiOperation({
    summary: 'Get sales order detail with items, schedule and audit history',
  })
  @ApiResponse({ status: 200, description: 'Sales order full detail.' })
  @ApiResponse({ status: 404, description: 'Sales order not found.' })
  async findById(@Param('id') id: string) {
    const result = await this.service.findById(id);
    const { auditHistory } = result;
    return { ...this.formatDetail(result), auditHistory };
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Advance sales order status' })
  @ApiResponse({ status: 200, description: 'Status updated.' })
  @ApiResponse({ status: 404, description: 'Sales order not found.' })
  @ApiResponse({
    status: 422,
    description:
      'Invalid transition, missing schedule (RN-06) or unconfirmed schedule (RN-07).',
  })
  async updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateOrderStatusDto,
  ) {
    const order = await this.service.updateStatus(id, dto);
    return this.formatDetail(order);
  }

  @Patch(':id/transport-type')
  @ApiOperation({ summary: 'Change transport type of a sales order' })
  @ApiResponse({ status: 200, description: 'Transport type updated.' })
  @ApiResponse({ status: 404, description: 'Sales order or transport type not found.' })
  @ApiResponse({
    status: 422,
    description:
      'Transport type not authorized for this customer (RN-01) or order already IN_TRANSIT/DELIVERED.',
  })
  async updateTransportType(
    @Param('id') id: string,
    @Body() dto: UpdateTransportTypeDto,
  ) {
    const order = await this.service.updateTransportType(id, dto);
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
