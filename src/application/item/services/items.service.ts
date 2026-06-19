import { Inject, Injectable } from '@nestjs/common';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { NotFoundException } from '../../../common/filters/errors/not-found.exception';
import type { Item } from '../../../domain/item/entities/item.entity';
import type {
  IItemRepository,
  PaginatedResult,
} from '../../../domain/item/repositories/item.repository';
import type { CreateItemDto } from '../dto/create-item.dto';
import type { ListItemsDto } from '../dto/list-items.dto';

export const ITEM_REPOSITORY = 'IItemRepository';

@Injectable()
export class ItemsService {
  constructor(
    @InjectPinoLogger(ItemsService.name)
    private readonly logger: PinoLogger,
    @Inject(ITEM_REPOSITORY)
    private readonly repository: IItemRepository,
  ) {}

  async create(dto: CreateItemDto): Promise<Item> {
    const item = await this.repository.create(dto);
    this.logger.info(
      { itemId: item.id, sku: item.sku, name: item.name },
      'Item created',
    );
    return item;
  }

  async findAll(
    params: ListItemsDto,
  ): Promise<PaginatedResult<Item> & { page: number; limit: number }> {
    const page = params.page ?? 1;
    const limit = params.limit ?? 20;

    const result = await this.repository.findAll({
      page,
      limit,
      search: params.search,
    });

    return { ...result, page, limit };
  }

  async findById(id: string): Promise<Item> {
    const item = await this.repository.findById(id);

    if (!item) throw new NotFoundException('Item not found.');

    return item;
  }
}
