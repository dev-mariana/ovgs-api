import { Inject, Injectable } from '@nestjs/common';
import { NotFoundException } from '../../../common/filters/errors/not-found.exception';
import type { TransportType } from '../../../domain/transport-type/entities/transport-type.entity';
import type { ITransportTypeRepository } from '../../../domain/transport-type/repositories/transport-type.repository';
import type { CreateTransportTypeDto } from '../dto/create-transport-type.dto';
import type { UpdateTransportTypeDto } from '../dto/update-transport-type.dto';

export const TRANSPORT_TYPE_REPOSITORY = 'ITransportTypeRepository';

@Injectable()
export class TransportTypesService {
  constructor(
    @Inject(TRANSPORT_TYPE_REPOSITORY)
    private readonly repository: ITransportTypeRepository,
  ) {}

  async create(dto: CreateTransportTypeDto): Promise<TransportType> {
    return this.repository.create({
      name: dto.name,
      description: dto.description,
      active: dto.active ?? true,
    });
  }

  async findAll(): Promise<TransportType[]> {
    return this.repository.findAll();
  }

  async findById(id: string): Promise<TransportType> {
    const transportType = await this.repository.findById(id);

    if (!transportType)
      throw new NotFoundException('Transport type not found.');

    return transportType;
  }

  async update(
    id: string,
    dto: UpdateTransportTypeDto,
  ): Promise<TransportType> {
    await this.findById(id);

    return this.repository.update(id, dto);
  }
}
