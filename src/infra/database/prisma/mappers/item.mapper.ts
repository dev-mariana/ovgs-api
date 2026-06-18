import type { Item as PrismaItem } from '@prisma/client';
import { Item } from '../../../../domain/item/entities/item.entity';

export class ItemMapper {
  static toDomain(raw: PrismaItem): Item {
    return {
      id: raw.id,
      sku: raw.sku,
      name: raw.name,
      description: raw.description ?? undefined,
      unit: raw.unit,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
    };
  }
}
