import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { AuditService } from '../../audit/services/audit.service';
import { BadRequestException } from '../../../common/filters/errors/bad-request.exception';
import { NotFoundException } from '../../../common/filters/errors/not-found.exception';
import { UnprocessableEntityException } from '../../../common/filters/errors/unprocessable-entity.exception';
import { AuditAction } from '../../../domain/audit/enums/audit-action.enum';
import { OrderStatus } from '../../../domain/sales-order/enums/order-status.enum';
import type { ISalesOrderRepository } from '../../../domain/sales-order/repositories/sales-order.repository';
import type { DeliverySchedule } from '../../../domain/schedule/entities/delivery-schedule.entity';
import type { IDeliveryScheduleRepository } from '../../../domain/schedule/repositories/delivery-schedule.repository';
import { SALES_ORDER_REPOSITORY } from '../../sales-order/services/sales-orders.service';
import type { CreateScheduleDto } from '../dto/create-schedule.dto';
import type { RescheduleDto } from '../dto/reschedule.dto';

export const DELIVERY_SCHEDULE_REPOSITORY = 'IDeliveryScheduleRepository';

@Injectable()
export class SchedulesService {
  constructor(
    @InjectPinoLogger(SchedulesService.name)
    private readonly logger: PinoLogger,
    @Inject(DELIVERY_SCHEDULE_REPOSITORY)
    private readonly scheduleRepository: IDeliveryScheduleRepository,
    @Inject(SALES_ORDER_REPOSITORY)
    private readonly orderRepository: ISalesOrderRepository,
    private readonly auditService: AuditService,
  ) {}

  async create(
    salesOrderId: string,
    dto: CreateScheduleDto,
  ): Promise<DeliverySchedule> {
    const order = await this.orderRepository.findById(salesOrderId);
    if (!order) throw new NotFoundException('Sales order not found.');

    if (order.status !== OrderStatus.PLANNED) {
      this.logger.warn(
        {
          salesOrderId,
          currentStatus: order.status,
          rule: 'INVALID_ORDER_STATUS',
        },
        'Business rule violated: schedule can only be created when order is PLANNED',
      );
      throw new UnprocessableEntityException(
        'Delivery schedule can only be created when the order is in PLANNED status.',
        'INVALID_ORDER_STATUS',
      );
    }

    const existing =
      await this.scheduleRepository.findBySalesOrderId(salesOrderId);
    if (existing) {
      this.logger.warn(
        { salesOrderId, scheduleId: existing.id },
        'Conflict: delivery schedule already exists for this order',
      );
      throw new HttpException(
        'Delivery schedule already exists for this order.',
        HttpStatus.CONFLICT,
      );
    }

    // RN-09
    if (dto.windowEnd <= dto.windowStart) {
      throw new BadRequestException(
        'windowEnd must be later than windowStart.',
      );
    }

    const schedule = await this.scheduleRepository.create({
      salesOrderId,
      scheduledDate: new Date(dto.scheduledDate),
      windowStart: dto.windowStart,
      windowEnd: dto.windowEnd,
    });

    await this.auditService.record({
      entity: 'DeliverySchedule',
      entityId: schedule.id,
      action: AuditAction.SCHEDULE_CREATED,
      previousState: null,
      nextState: {
        scheduledDate: dto.scheduledDate,
        windowStart: dto.windowStart,
        windowEnd: dto.windowEnd,
      },
    });

    this.logger.info(
      {
        salesOrderId,
        scheduleId: schedule.id,
        scheduledDate: dto.scheduledDate,
      },
      'Delivery schedule created',
    );

    return schedule;
  }

  async reschedule(
    salesOrderId: string,
    dto: RescheduleDto,
  ): Promise<DeliverySchedule> {
    const order = await this.orderRepository.findById(salesOrderId);
    if (!order) throw new NotFoundException('Sales order not found.');

    // RN-10
    const reschedulableStatuses: OrderStatus[] = [
      OrderStatus.PLANNED,
      OrderStatus.SCHEDULED,
    ];
    if (!reschedulableStatuses.includes(order.status)) {
      this.logger.warn(
        {
          salesOrderId,
          currentStatus: order.status,
          rule: 'INVALID_ORDER_STATUS',
        },
        'Business rule violated: rescheduling not allowed in current order status',
      );
      throw new UnprocessableEntityException(
        'Rescheduling is only allowed when the order is in PLANNED or SCHEDULED status.',
        'INVALID_ORDER_STATUS',
      );
    }

    const schedule =
      await this.scheduleRepository.findBySalesOrderId(salesOrderId);
    if (!schedule) throw new NotFoundException('Delivery schedule not found.');

    // RN-09 with merged values
    const finalWindowStart = dto.windowStart ?? schedule.windowStart;
    const finalWindowEnd = dto.windowEnd ?? schedule.windowEnd;
    if (finalWindowEnd <= finalWindowStart) {
      throw new BadRequestException(
        'windowEnd must be later than windowStart.',
      );
    }

    const previous = {
      scheduledDate: schedule.scheduledDate,
      windowStart: schedule.windowStart,
      windowEnd: schedule.windowEnd,
    };

    const updated = await this.scheduleRepository.update(salesOrderId, {
      scheduledDate: dto.scheduledDate
        ? new Date(dto.scheduledDate)
        : undefined,
      windowStart: dto.windowStart,
      windowEnd: dto.windowEnd,
    });

    await this.auditService.record({
      entity: 'DeliverySchedule',
      entityId: schedule.id,
      action: AuditAction.SCHEDULE_RESCHEDULED,
      previousState: previous,
      nextState: {
        scheduledDate: updated.scheduledDate,
        windowStart: updated.windowStart,
        windowEnd: updated.windowEnd,
      },
    });

    this.logger.info(
      {
        salesOrderId,
        scheduleId: schedule.id,
        scheduledDate: updated.scheduledDate,
      },
      'Delivery schedule rescheduled',
    );

    return updated;
  }

  async confirm(salesOrderId: string): Promise<DeliverySchedule> {
    const order = await this.orderRepository.findById(salesOrderId);
    if (!order) throw new NotFoundException('Sales order not found.');

    const schedule =
      await this.scheduleRepository.findBySalesOrderId(salesOrderId);
    if (!schedule) throw new NotFoundException('Delivery schedule not found.');

    if (schedule.confirmedAt) {
      this.logger.warn(
        {
          salesOrderId,
          scheduleId: schedule.id,
          confirmedAt: schedule.confirmedAt,
        },
        'Conflict: delivery schedule is already confirmed',
      );
      throw new HttpException(
        'Delivery schedule is already confirmed.',
        HttpStatus.CONFLICT,
      );
    }

    const confirmed = await this.scheduleRepository.confirm(salesOrderId);

    await this.auditService.record({
      entity: 'DeliverySchedule',
      entityId: schedule.id,
      action: AuditAction.SCHEDULE_CONFIRMED,
      previousState: { confirmedAt: null },
      nextState: { confirmedAt: confirmed.confirmedAt },
    });

    this.logger.info(
      {
        salesOrderId,
        scheduleId: schedule.id,
        confirmedAt: confirmed.confirmedAt,
      },
      'Delivery schedule confirmed',
    );

    return confirmed;
  }
}
