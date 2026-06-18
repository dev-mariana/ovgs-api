import { Injectable } from '@nestjs/common';
import { TransportType } from '../../../domain/transport-type/entities/transport-type.entity';
import { ITransportTypeRepository } from '../../../domain/transport-type/repositories/transport-type.repository';
import { TransportTypeMapper } from '../prisma/mappers/transport-type.mapper';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PrismaTransportTypeRepository implements ITransportTypeRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<TransportType | null> {
    const raw = await this.prisma.transportType.findUnique({ where: { id } });

    return raw ? TransportTypeMapper.toDomain(raw) : null;
  }

  async findAll(): Promise<TransportType[]> {
    const rows = await this.prisma.transportType.findMany({
      where: { active: true },
    });

    return rows.map((r) => TransportTypeMapper.toDomain(r));
  }

  async findManyByIds(ids: string[]): Promise<TransportType[]> {
    const rows = await this.prisma.transportType.findMany({
      where: { id: { in: ids } },
    });

    return rows.map((r) => TransportTypeMapper.toDomain(r));
  }

  async create(
    data: Pick<TransportType, 'name' | 'description' | 'active'>,
  ): Promise<TransportType> {
    const raw = await this.prisma.transportType.create({ data });

    return TransportTypeMapper.toDomain(raw);
  }

  async update(
    id: string,
    data: Partial<Pick<TransportType, 'name' | 'description' | 'active'>>,
  ): Promise<TransportType> {
    const raw = await this.prisma.transportType.update({ where: { id }, data });

    return TransportTypeMapper.toDomain(raw);
  }
}
