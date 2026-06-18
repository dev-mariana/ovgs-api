import { Inject, Injectable } from '@nestjs/common';
import { NotFoundException } from '../../../common/filters/errors/not-found.exception';
import type { Customer } from '../../../domain/customer/entities/customer.entity';
import type {
  ICustomerRepository,
  PaginatedResult,
} from '../../../domain/customer/repositories/customer.repository';
import type { ITransportTypeRepository } from '../../../domain/transport-type/repositories/transport-type.repository';
import { TRANSPORT_TYPE_REPOSITORY } from '../../transport-type/services/transport-types.service';
import type { CreateCustomerDto } from '../dto/create-customer.dto';
import type { ListCustomersDto } from '../dto/list-customers.dto';
import type { SetTransportTypesDto } from '../dto/set-transport-types.dto';
import type { UpdateCustomerDto } from '../dto/update-customer.dto';

export const CUSTOMER_REPOSITORY = 'ICustomerRepository';

@Injectable()
export class CustomersService {
  constructor(
    @Inject(CUSTOMER_REPOSITORY)
    private readonly repository: ICustomerRepository,
    @Inject(TRANSPORT_TYPE_REPOSITORY)
    private readonly transportTypeRepository: ITransportTypeRepository,
  ) {}

  async create(dto: CreateCustomerDto): Promise<Customer> {
    return this.repository.create(dto);
  }

  async findAll(
    params: ListCustomersDto,
  ): Promise<PaginatedResult<Customer> & { page: number; limit: number }> {
    const page = params.page ?? 1;
    const limit = params.limit ?? 20;

    const result = await this.repository.findAll({
      page,
      limit,
      search: params.search,
    });

    return { ...result, page, limit };
  }

  async findById(id: string): Promise<Customer> {
    const customer = await this.repository.findById(id);

    if (!customer) throw new NotFoundException('Customer not found.');

    return customer;
  }

  async update(id: string, dto: UpdateCustomerDto): Promise<Customer> {
    await this.findById(id);

    return this.repository.update(id, dto);
  }

  async setAuthorizedTransportTypes(
    id: string,
    dto: SetTransportTypesDto,
  ): Promise<Customer> {
    await this.findById(id);

    if (dto.transportTypeIds.length > 0) {
      const found = await this.transportTypeRepository.findManyByIds(
        dto.transportTypeIds,
      );

      if (found.length !== dto.transportTypeIds.length) {
        throw new NotFoundException('One or more transport types not found.');
      }
    }

    return this.repository.setAuthorizedTransportTypes(
      id,
      dto.transportTypeIds,
    );
  }
}
