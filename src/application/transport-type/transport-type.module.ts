import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../infra/database/database.module';
import { PrismaTransportTypeRepository } from '../../infra/database/repositories/transport-type.repository';
import { TransportTypesController } from './controllers/transport-types.controller';
import {
  TransportTypesService,
  TRANSPORT_TYPE_REPOSITORY,
} from './services/transport-types.service';

@Module({
  imports: [DatabaseModule],
  controllers: [TransportTypesController],
  providers: [
    TransportTypesService,
    {
      provide: TRANSPORT_TYPE_REPOSITORY,
      useClass: PrismaTransportTypeRepository,
    },
  ],
  exports: [TRANSPORT_TYPE_REPOSITORY],
})
export class TransportTypeModule {}
