import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
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
      throw new UnprocessableEntityException(
        'Delivery schedule can only be created when the order is in PLANNED status.',
        'INVALID_ORDER_STATUS',
      );
    }

    const existing =
      await this.scheduleRepository.findBySalesOrderId(salesOrderId);
    if (existing) {
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

    return updated;
  }

  async confirm(salesOrderId: string): Promise<DeliverySchedule> {
    const order = await this.orderRepository.findById(salesOrderId);
    if (!order) throw new NotFoundException('Sales order not found.');

    const schedule =
      await this.scheduleRepository.findBySalesOrderId(salesOrderId);
    if (!schedule) throw new NotFoundException('Delivery schedule not found.');

    if (schedule.confirmedAt) {
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

    return confirmed;
  }
}
