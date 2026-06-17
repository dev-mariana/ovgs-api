export interface Item {
  id: string;
  sku: string;
  name: string;
  description?: string;
  unit: string;
  createdAt: Date;
  updatedAt: Date;
}
