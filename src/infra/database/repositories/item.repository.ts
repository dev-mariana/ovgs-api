import { Injectable } from '@nestjs/common';
import { Item } from '../../../domain/item/entities/item.entity';
import {
  IItemRepository,
  ListItemsParams,
  PaginatedResult,
} from '../../../domain/item/repositories/item.repository';
import { ItemMapper } from '../prisma/mappers/item.mapper';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PrismaItemRepository implements IItemRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<Item | null> {
    const raw = await this.prisma.item.findUnique({ where: { id } });

    return raw ? ItemMapper.toDomain(raw) : null;
  }

  async findAll(params: ListItemsParams): Promise<PaginatedResult<Item>> {
    const { page, limit, search } = params;
    const skip = (page - 1) * limit;

    const where = search
      ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' as const } },
            { sku: { contains: search, mode: 'insensitive' as const } },
          ],
        }
      : {};

    const [rows, total] = await this.prisma.$transaction([
      this.prisma.item.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),

      this.prisma.item.count({ where }),
    ]);

    return { data: rows.map((r) => ItemMapper.toDomain(r)), total };
  }

  async findManyByIds(ids: string[]): Promise<Item[]> {
    const rows = await this.prisma.item.findMany({
      where: { id: { in: ids } },
    });

    return rows.map((r) => ItemMapper.toDomain(r));
  }

  async create(
    data: Pick<Item, 'sku' | 'name' | 'description' | 'unit'>,
  ): Promise<Item> {
    const raw = await this.prisma.item.create({ data });

    return ItemMapper.toDomain(raw);
  }
}
