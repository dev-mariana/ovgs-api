import { Customer } from '../entities/customer.entity';

export type ListCustomersParams = {
  page: number;
  limit: number;
  search?: string;
};

export type PaginatedResult<T> = {
  data: T[];
  total: number;
};

export interface ICustomerRepository {
  findById(id: string): Promise<Customer | null>;
  findAll(params: ListCustomersParams): Promise<PaginatedResult<Customer>>;
  create(
    data: Pick<Customer, 'name' | 'document' | 'email'>,
  ): Promise<Customer>;
  update(
    id: string,
    data: Partial<Pick<Customer, 'name' | 'email'>>,
  ): Promise<Customer>;
  setAuthorizedTransportTypes(
    customerId: string,
    transportTypeIds: string[],
  ): Promise<Customer>;
}
