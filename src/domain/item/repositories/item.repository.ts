import { Item } from '../entities/item.entity';

export type ListItemsParams = {
  page: number;
  limit: number;
  search?: string;
};

export type PaginatedResult<T> = {
  data: T[];
  total: number;
};

export interface IItemRepository {
  findById(id: string): Promise<Item | null>;
  findAll(params: ListItemsParams): Promise<PaginatedResult<Item>>;
  findManyByIds(ids: string[]): Promise<Item[]>;
  create(
    data: Pick<Item, 'sku' | 'name' | 'description' | 'unit'>,
  ): Promise<Item>;
}
