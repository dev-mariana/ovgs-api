import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../infra/database/database.module';
import { PrismaCustomerRepository } from '../../infra/database/repositories/customer.repository';
import { TransportTypeModule } from '../transport-type/transport-type.module';
import { CustomersController } from './controllers/customers.controller';
import {
  CustomersService,
  CUSTOMER_REPOSITORY,
} from './services/customers.service';

@Module({
  imports: [DatabaseModule, TransportTypeModule],
  controllers: [CustomersController],
  providers: [
    CustomersService,
    {
      provide: CUSTOMER_REPOSITORY,
      useClass: PrismaCustomerRepository,
    },
  ],
  exports: [CUSTOMER_REPOSITORY],
})
export class CustomerModule {}
