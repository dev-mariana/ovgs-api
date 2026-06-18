import type { TransportType as PrismaTransportType } from '@prisma/client';
import { TransportType } from '../../../../domain/transport-type/entities/transport-type.entity';

export class TransportTypeMapper {
  static toDomain(raw: PrismaTransportType): TransportType {
    return {
      id: raw.id,
      name: raw.name,
      description: raw.description ?? undefined,
      active: raw.active,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
    };
  }
}
