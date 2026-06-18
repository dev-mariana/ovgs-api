import type { DeliverySchedule as PrismaDeliverySchedule } from '@prisma/client';
import { DeliverySchedule } from '../../../../domain/schedule/entities/delivery-schedule.entity';

export class DeliveryScheduleMapper {
  static toDomain(raw: PrismaDeliverySchedule): DeliverySchedule {
    return {
      id: raw.id,
      salesOrderId: raw.salesOrderId,
      scheduledDate: raw.scheduledDate,
      windowStart: raw.windowStart,
      windowEnd: raw.windowEnd,
      confirmedAt: raw.confirmedAt ?? null,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
    };
  }
}
