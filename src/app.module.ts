import { Module } from '@nestjs/common';
import { CustomerModule } from './application/customer/customer.module';
import { ItemModule } from './application/item/item.module';
import { TransportTypeModule } from './application/transport-type/transport-type.module';

@Module({
  imports: [TransportTypeModule, ItemModule, CustomerModule],
})
export class AppModule {}
