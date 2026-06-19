import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { CustomerModule } from '../customer/customer.module';
import { ItemModule } from '../item/item.module';
import { TransportTypeModule } from '../transport-type/transport-type.module';
import { DatabaseModule } from '../../infra/database/database.module';
import { PrismaSalesOrderRepository } from '../../infra/database/repositories/sales-order.repository';
import { SalesOrdersController } from './controllers/sales-orders.controller';
import {
  SALES_ORDER_REPOSITORY,
  SalesOrdersService,
} from './services/sales-orders.service';

@Module({
  imports: [
    DatabaseModule,
    AuditModule,
    CustomerModule,
    ItemModule,
    TransportTypeModule,
  ],
  controllers: [SalesOrdersController],
  providers: [
    SalesOrdersService,
    {
      provide: SALES_ORDER_REPOSITORY,
      useClass: PrismaSalesOrderRepository,
    },
  ],
  exports: [SALES_ORDER_REPOSITORY],
})
export class SalesOrderModule {}
