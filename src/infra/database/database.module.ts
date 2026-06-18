import { Module } from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service';
import { PrismaCustomerRepository } from './repositories/customer.repository';
import { PrismaTransportTypeRepository } from './repositories/transport-type.repository';
import { PrismaItemRepository } from './repositories/item.repository';
import { PrismaSalesOrderRepository } from './repositories/sales-order.repository';
import { PrismaDeliveryScheduleRepository } from './repositories/delivery-schedule.repository';
import { PrismaAuditLogRepository } from './repositories/audit-log.repository';

const REPOSITORIES = [
  PrismaCustomerRepository,
  PrismaTransportTypeRepository,
  PrismaItemRepository,
  PrismaSalesOrderRepository,
  PrismaDeliveryScheduleRepository,
  PrismaAuditLogRepository,
];

@Module({
  providers: [PrismaService, ...REPOSITORIES],
  exports: [PrismaService, ...REPOSITORIES],
})
export class DatabaseModule {}
