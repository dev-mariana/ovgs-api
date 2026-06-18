import { Injectable } from '@nestjs/common';
import { Customer } from '../../../domain/customer/entities/customer.entity';
import {
  ICustomerRepository,
  ListCustomersParams,
  PaginatedResult,
} from '../../../domain/customer/repositories/customer.repository';
import { CustomerMapper } from '../prisma/mappers/customer.mapper';
import { PrismaService } from '../prisma/prisma.service';

const WITH_TRANSPORT = {
  authorizedTransportTypes: { include: { transportType: true } },
};

@Injectable()
export class PrismaCustomerRepository implements ICustomerRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<Customer | null> {
    const raw = await this.prisma.customer.findUnique({
      where: { id },
      include: WITH_TRANSPORT,
    });

    return raw ? CustomerMapper.toDomain(raw) : null;
  }

  async findAll(
    params: ListCustomersParams,
  ): Promise<PaginatedResult<Customer>> {
    const { page, limit, search } = params;
    const skip = (page - 1) * limit;

    const where = search
      ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' as const } },
            { document: { contains: search, mode: 'insensitive' as const } },
          ],
        }
      : {};

    const [rows, total] = await this.prisma.$transaction([
      this.prisma.customer.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: WITH_TRANSPORT,
      }),

      this.prisma.customer.count({ where }),
    ]);

    return { data: rows.map((r) => CustomerMapper.toDomain(r)), total };
  }

  async create(
    data: Pick<Customer, 'name' | 'document' | 'email'>,
  ): Promise<Customer> {
    const raw = await this.prisma.customer.create({
      data,
      include: WITH_TRANSPORT,
    });

    return CustomerMapper.toDomain(raw);
  }

  async update(
    id: string,
    data: Partial<Pick<Customer, 'name' | 'email'>>,
  ): Promise<Customer> {
    const raw = await this.prisma.customer.update({
      where: { id },
      data,
      include: WITH_TRANSPORT,
    });

    return CustomerMapper.toDomain(raw);
  }

  async setAuthorizedTransportTypes(
    customerId: string,
    transportTypeIds: string[],
  ): Promise<Customer> {
    await this.prisma.$transaction([
      this.prisma.customerTransportType.deleteMany({ where: { customerId } }),
      this.prisma.customerTransportType.createMany({
        data: transportTypeIds.map((transportTypeId) => ({
          customerId,
          transportTypeId,
        })),
      }),
    ]);

    const raw = await this.prisma.customer.findUniqueOrThrow({
      where: { id: customerId },
      include: WITH_TRANSPORT,
    });

    return CustomerMapper.toDomain(raw);
  }
}
