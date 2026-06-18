import type {
  Customer as PrismaCustomer,
  CustomerTransportType as PrismaCustomerTransportType,
  TransportType as PrismaTransportType,
} from '@prisma/client';
import { Customer } from '../../../../domain/customer/entities/customer.entity';
import { TransportTypeMapper } from './transport-type.mapper';

type PrismaCustomerWithRelations = PrismaCustomer & {
  authorizedTransportTypes?: (PrismaCustomerTransportType & {
    transportType: PrismaTransportType;
  })[];
};

export class CustomerMapper {
  static toDomain(raw: PrismaCustomerWithRelations): Customer {
    return {
      id: raw.id,
      name: raw.name,
      document: raw.document,
      email: raw.email,
      authorizedTransportTypes: raw.authorizedTransportTypes?.map((ctt) =>
        TransportTypeMapper.toDomain(ctt.transportType),
      ),
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
    };
  }
}
