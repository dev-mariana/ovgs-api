import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { DeliverySchedule } from '../../../domain/schedule/entities/delivery-schedule.entity';
import {
  CreateScheduleData,
  IDeliveryScheduleRepository,
  UpdateScheduleData,
} from '../../../domain/schedule/repositories/delivery-schedule.repository';
import { DeliveryScheduleMapper } from '../prisma/mappers/delivery-schedule.mapper';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PrismaDeliveryScheduleRepository implements IDeliveryScheduleRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findBySalesOrderId(
    salesOrderId: string,
  ): Promise<DeliverySchedule | null> {
    const raw = await this.prisma.deliverySchedule.findUnique({
      where: { salesOrderId },
    });

    return raw ? DeliveryScheduleMapper.toDomain(raw) : null;
  }

  async create(
    data: CreateScheduleData,
    tx?: Prisma.TransactionClient,
  ): Promise<DeliverySchedule> {
    const client = tx ?? this.prisma;
    const raw = await client.deliverySchedule.create({ data });

    return DeliveryScheduleMapper.toDomain(raw);
  }

  async update(
    salesOrderId: string,
    data: UpdateScheduleData,
  ): Promise<DeliverySchedule> {
    const raw = await this.prisma.deliverySchedule.update({
      where: { salesOrderId },
      data: {
        scheduledDate: data.scheduledDate,
        windowStart: data.windowStart,
        windowEnd: data.windowEnd,
      },
    });

    return DeliveryScheduleMapper.toDomain(raw);
  }

  async confirm(salesOrderId: string): Promise<DeliverySchedule> {
    const raw = await this.prisma.deliverySchedule.update({
      where: { salesOrderId },
      data: { confirmedAt: new Date() },
    });

    return DeliveryScheduleMapper.toDomain(raw);
  }
}
