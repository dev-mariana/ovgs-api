import { Module } from '@nestjs/common';
import { AuditModule } from './application/audit/audit.module';
import { CustomerModule } from './application/customer/customer.module';
import { ItemModule } from './application/item/item.module';
import { SalesOrderModule } from './application/sales-order/sales-order.module';
import { ScheduleModule } from './application/schedule/schedule.module';
import { TransportTypeModule } from './application/transport-type/transport-type.module';
import { LoggerModule } from './infra/logger/logger.module';

@Module({
  imports: [
    LoggerModule,
    TransportTypeModule,
    ItemModule,
    CustomerModule,
    AuditModule,
    SalesOrderModule,
    ScheduleModule,
  ],
})
export class AppModule {}
