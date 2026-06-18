import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../infra/database/database.module';
import { PrismaItemRepository } from '../../infra/database/repositories/item.repository';
import { ItemsController } from './controllers/items.controller';
import { ItemsService, ITEM_REPOSITORY } from './services/items.service';

@Module({
  imports: [DatabaseModule],
  controllers: [ItemsController],
  providers: [
    ItemsService,
    {
      provide: ITEM_REPOSITORY,
      useClass: PrismaItemRepository,
    },
  ],
  exports: [ITEM_REPOSITORY],
})
export class ItemModule {}
