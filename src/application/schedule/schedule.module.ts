import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { SalesOrderModule } from '../sales-order/sales-order.module';
import { DatabaseModule } from '../../infra/database/database.module';
import { PrismaDeliveryScheduleRepository } from '../../infra/database/repositories/delivery-schedule.repository';
import { SchedulesController } from './controllers/schedules.controller';
import {
  DELIVERY_SCHEDULE_REPOSITORY,
  SchedulesService,
} from './services/schedules.service';

@Module({
  imports: [DatabaseModule, AuditModule, SalesOrderModule],
  controllers: [SchedulesController],
  providers: [
    SchedulesService,
    {
      provide: DELIVERY_SCHEDULE_REPOSITORY,
      useClass: PrismaDeliveryScheduleRepository,
    },
  ],
})
export class ScheduleModule {}
