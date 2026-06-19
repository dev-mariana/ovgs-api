import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import type { DeliverySchedule } from '../../../domain/schedule/entities/delivery-schedule.entity';
import { CreateScheduleDto } from '../dto/create-schedule.dto';
import { RescheduleDto } from '../dto/reschedule.dto';
import { SchedulesService } from '../services/schedules.service';

@ApiTags('Delivery Schedules')
@Controller('sales-orders')
export class SchedulesController {
  constructor(private readonly service: SchedulesService) {}

  @Post(':id/schedule')
  @ApiOperation({ summary: 'Create delivery schedule for a sales order' })
  @ApiResponse({ status: 201, description: 'Schedule created.' })
  @ApiResponse({
    status: 400,
    description: 'windowEnd not after windowStart (RN-09).',
  })
  @ApiResponse({ status: 404, description: 'Sales order not found.' })
  @ApiResponse({
    status: 409,
    description: 'Schedule already exists for this order.',
  })
  @ApiResponse({ status: 422, description: 'Order is not in PLANNED status.' })
  create(@Param('id') id: string, @Body() dto: CreateScheduleDto) {
    return this.service.create(id, dto).then((s) => this.formatSchedule(s));
  }

  @Patch(':id/schedule')
  @ApiOperation({
    summary: 'Reschedule delivery (PLANNED or SCHEDULED orders only)',
  })
  @ApiResponse({ status: 200, description: 'Schedule updated.' })
  @ApiResponse({
    status: 400,
    description: 'windowEnd not after windowStart (RN-09).',
  })
  @ApiResponse({
    status: 404,
    description: 'Sales order or schedule not found.',
  })
  @ApiResponse({
    status: 422,
    description: 'Order status does not allow rescheduling (RN-10).',
  })
  reschedule(@Param('id') id: string, @Body() dto: RescheduleDto) {
    return this.service.reschedule(id, dto).then((s) => this.formatSchedule(s));
  }

  @Post(':id/schedule/confirm')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Confirm delivery schedule' })
  @ApiResponse({ status: 200, description: 'Schedule confirmed.' })
  @ApiResponse({
    status: 404,
    description: 'Sales order or schedule not found.',
  })
  @ApiResponse({ status: 409, description: 'Schedule already confirmed.' })
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
