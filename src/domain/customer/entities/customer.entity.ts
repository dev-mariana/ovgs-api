import { TransportType } from '../../transport-type/entities/transport-type.entity';

export interface Customer {
  id: string;
  name: string;
  document: string;
  email: string;
  authorizedTransportTypes?: TransportType[];
  createdAt: Date;
  updatedAt: Date;
}
