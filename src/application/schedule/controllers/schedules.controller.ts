import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import type { DeliverySchedule } from '../../../domain/schedule/entities/delivery-schedule.entity';
import { CreateScheduleDto } from '../dto/create-schedule.dto';
import { RescheduleDto } from '../dto/reschedule.dto';
import { SchedulesService } from '../services/schedules.service';

@Controller('sales-orders')
export class SchedulesController {
  constructor(private readonly service: SchedulesService) {}

  @Post(':id/schedule')
  create(@Param('id') id: string, @Body() dto: CreateScheduleDto) {
    return this.service.create(id, dto).then((s) => this.formatSchedule(s));
  }

  @Patch(':id/schedule')
  reschedule(@Param('id') id: string, @Body() dto: RescheduleDto) {
    return this.service.reschedule(id, dto).then((s) => this.formatSchedule(s));
  }

  @Post(':id/schedule/confirm')
  @HttpCode(HttpStatus.OK)
  confirm(@Param('id') id: string) {
    return this.service.confirm(id).then((s) => this.formatSchedule(s));
  }

  private formatSchedule(schedule: DeliverySchedule) {
    return {
      id: schedule.id,
      salesOrderId: schedule.salesOrderId,
      scheduledDate: schedule.scheduledDate.toISOString().split('T')[0],
      windowStart: schedule.windowStart,
      windowEnd: schedule.windowEnd,
      confirmedAt: schedule.confirmedAt ?? null,
      createdAt: schedule.createdAt,
    };
  }
}
