import { Inject, Injectable } from '@nestjs/common';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
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
    @InjectPinoLogger(CustomersService.name)
    private readonly logger: PinoLogger,
    @Inject(CUSTOMER_REPOSITORY)
    private readonly repository: ICustomerRepository,
    @Inject(TRANSPORT_TYPE_REPOSITORY)
    private readonly transportTypeRepository: ITransportTypeRepository,
  ) {}

  async create(dto: CreateCustomerDto): Promise<Customer> {
    const customer = await this.repository.create(dto);
    this.logger.info(
      {
        customerId: customer.id,
        document: customer.document,
        email: customer.email,
      },
      'Customer created',
    );
    return customer;
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

    const customer = await this.repository.update(id, dto);
    this.logger.info(
      { customerId: id, fields: Object.keys(dto) },
      'Customer updated',
    );
    return customer;
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

    const customer = await this.repository.setAuthorizedTransportTypes(
      id,
      dto.transportTypeIds,
    );

    this.logger.info(
      { customerId: id, transportTypeIds: dto.transportTypeIds },
      'Customer authorized transport types updated',
    );

    return customer;
  }
}
