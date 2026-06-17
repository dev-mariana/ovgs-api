import { TransportType } from '../entities/transport-type.entity';

export interface ITransportTypeRepository {
  findById(id: string): Promise<TransportType | null>;
  findAll(): Promise<TransportType[]>;
  findManyByIds(ids: string[]): Promise<TransportType[]>;
  create(
    data: Pick<TransportType, 'name' | 'description' | 'active'>,
  ): Promise<TransportType>;
  update(
    id: string,
    data: Partial<Pick<TransportType, 'name' | 'description' | 'active'>>,
  ): Promise<TransportType>;
}
