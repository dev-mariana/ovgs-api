import { Inject, Injectable } from '@nestjs/common';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { AuditService } from '../../audit/services/audit.service';
import { BadRequestException } from '../../../common/filters/errors/bad-request.exception';
import { NotFoundException } from '../../../common/filters/errors/not-found.exception';
import { UnprocessableEntityException } from '../../../common/filters/errors/unprocessable-entity.exception';
import { AuditAction } from '../../../domain/audit/enums/audit-action.enum';
import type { ICustomerRepository } from '../../../domain/customer/repositories/customer.repository';
import type { IItemRepository } from '../../../domain/item/repositories/item.repository';
import type { SalesOrder } from '../../../domain/sales-order/entities/sales-order.entity';
import { OrderStatus } from '../../../domain/sales-order/enums/order-status.enum';
import {
  InvalidTransitionError,
  OrderStatusMachine,
} from '../../../domain/sales-order/order-status.machine';
import type {
  ISalesOrderRepository,
  PaginatedResult,
} from '../../../domain/sales-order/repositories/sales-order.repository';
import type { ITransportTypeRepository } from '../../../domain/transport-type/repositories/transport-type.repository';
import { CUSTOMER_REPOSITORY } from '../../customer/services/customers.service';
import { ITEM_REPOSITORY } from '../../item/services/items.service';
import { TRANSPORT_TYPE_REPOSITORY } from '../../transport-type/services/transport-types.service';
import type { CreateSalesOrderDto } from '../dto/create-sales-order.dto';
import type { ListSalesOrdersDto } from '../dto/list-sales-orders.dto';
import type { UpdateOrderStatusDto } from '../dto/update-order-status.dto';

export const SALES_ORDER_REPOSITORY = 'ISalesOrderRepository';

@Injectable()
export class SalesOrdersService {
  constructor(
    @InjectPinoLogger(SalesOrdersService.name)
    private readonly logger: PinoLogger,
    @Inject(SALES_ORDER_REPOSITORY)
    private readonly orderRepository: ISalesOrderRepository,
    @Inject(CUSTOMER_REPOSITORY)
    private readonly customerRepository: ICustomerRepository,
    @Inject(ITEM_REPOSITORY)
    private readonly itemRepository: IItemRepository,
    @Inject(TRANSPORT_TYPE_REPOSITORY)
    private readonly transportTypeRepository: ITransportTypeRepository,
    private readonly auditService: AuditService,
  ) {}

  async create(dto: CreateSalesOrderDto): Promise<SalesOrder> {
    // RN-02
    if (dto.items.length === 0) {
      this.logger.warn(
        { customerId: dto.customerId, rule: 'NO_ITEMS' },
        'Business rule violated: sales order must have at least one item',
      );
      throw new UnprocessableEntityException(
        'Sales order must have at least one item.',
        'NO_ITEMS',
      );
    }

    const itemIds = dto.items.map((i) => i.itemId);
    const uniqueIds = new Set(itemIds);
    if (uniqueIds.size !== itemIds.length) {
      throw new BadRequestException('Duplicate item IDs in payload.');
    }

    const customer = await this.customerRepository.findById(dto.customerId);
    if (!customer) throw new NotFoundException('Customer not found.');

    const transportType = await this.transportTypeRepository.findById(
      dto.transportTypeId,
    );
    if (!transportType)
      throw new NotFoundException('Transport type not found.');

    // RN-01
    const isAuthorized =
      customer.authorizedTransportTypes?.some(
        (t) => t.id === dto.transportTypeId,
      ) ?? false;
    if (!isAuthorized) {
      this.logger.warn(
        {
          customerId: dto.customerId,
          transportTypeId: dto.transportTypeId,
          rule: 'TRANSPORT_NOT_AUTHORIZED',
        },
        `Business rule violated: transport type '${transportType.name}' is not authorized for this customer`,
      );
      throw new UnprocessableEntityException(
        `Transport type '${transportType.name}' is not authorized for this customer.`,
        'TRANSPORT_NOT_AUTHORIZED',
      );
    }

    // RN-03
    const foundItems = await this.itemRepository.findManyByIds(itemIds);
    if (foundItems.length !== itemIds.length) {
      throw new NotFoundException('One or more items not found.');
    }

    const order = await this.orderRepository.create({
      customerId: dto.customerId,
      transportTypeId: dto.transportTypeId,
      notes: dto.notes,
      items: dto.items,
    });

    await this.auditService.record({
      entity: 'SalesOrder',
      entityId: order.id,
      action: AuditAction.ORDER_CREATED,
      previousState: null,
      nextState: { status: order.status },
    });

    this.logger.info(
      {
        orderId: order.id,
        orderNumber: order.orderNumber,
        customerId: order.customerId,
        transportTypeId: order.transportTypeId,
      },
      'Sales order created',
    );

    return order;
  }

  async findAll(
    dto: ListSalesOrdersDto,
  ): Promise<PaginatedResult<SalesOrder> & { page: number; limit: number }> {
    const page = dto.page ?? 1;
    const limit = dto.limit ?? 20;

    const result = await this.orderRepository.findAll({
      page,
      limit,
      status: dto.status,
      customerId: dto.customerId,
      transportTypeId: dto.transportTypeId,
      dateFrom: dto.dateFrom ? new Date(dto.dateFrom) : undefined,
      dateTo: dto.dateTo ? new Date(dto.dateTo) : undefined,
    });

    return { ...result, page, limit };
  }

  async findById(
    id: string,
  ): Promise<SalesOrder & { auditHistory: unknown[] }> {
    const order = await this.orderRepository.findById(id);
    if (!order) throw new NotFoundException('Sales order not found.');

    const { data: auditHistory } = await this.auditService.findAll({
      entity: 'SalesOrder',
      entityId: id,
    });

    return { ...order, auditHistory };
  }

  async updateStatus(
    id: string,
    dto: UpdateOrderStatusDto,
  ): Promise<SalesOrder> {
    const order = await this.orderRepository.findById(id);
    if (!order) throw new NotFoundException('Sales order not found.');

    try {
      OrderStatusMachine.transition(order.status, dto.status);
    } catch (e) {
      if (e instanceof InvalidTransitionError) {
        this.logger.warn(
          {
            orderId: id,
            from: order.status,
            to: dto.status,
            rule: 'INVALID_STATUS_TRANSITION',
          },
          'Business rule violated: invalid status transition',
        );
        throw new UnprocessableEntityException(
          `Cannot transition from ${order.status} to ${dto.status}.`,
          'INVALID_STATUS_TRANSITION',
        );
      }
      throw e;
    }

    // RN-06
    if (dto.status === OrderStatus.SCHEDULED && !order.schedule) {
      this.logger.warn(
        { orderId: id, to: dto.status, rule: 'SCHEDULE_REQUIRED' },
        'Business rule violated: no delivery schedule exists for this order',
      );
      throw new UnprocessableEntityException(
        'A delivery schedule must exist before transitioning to SCHEDULED.',
        'SCHEDULE_REQUIRED',
      );
    }

    // RN-07
    if (dto.status === OrderStatus.IN_TRANSIT && !order.schedule?.confirmedAt) {
      this.logger.warn(
        { orderId: id, to: dto.status, rule: 'SCHEDULE_NOT_CONFIRMED' },
        'Business rule violated: delivery schedule is not confirmed',
      );
      throw new UnprocessableEntityException(
        'The delivery schedule must be confirmed before transitioning to IN_TRANSIT.',
        'SCHEDULE_NOT_CONFIRMED',
      );
    }

    const previousStatus = order.status;
    const updated = await this.orderRepository.updateStatus(id, dto.status);

    await this.auditService.record({
      entity: 'SalesOrder',
      entityId: id,
      action: AuditAction.ORDER_STATUS_CHANGED,
      previousState: { status: previousStatus },
      nextState: { status: dto.status },
    });

    this.logger.info(
      { orderId: id, from: previousStatus, to: dto.status },
      'Order status transitioned',
    );

    return updated;
  }
}
