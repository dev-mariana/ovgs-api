import { AuditAction } from '../enums/audit-action.enum';
import { AuditLog } from '../entities/audit-log.entity';

export type ListAuditLogsParams = {
  page: number;
  limit: number;
  entity?: string;
  entityId?: string;
  action?: AuditAction;
};

export type PaginatedResult<T> = {
  data: T[];
  total: number;
};

export type CreateAuditLogData = {
  entity: string;
  entityId: string;
  action: AuditAction;
  previousState?: Record<string, unknown> | null;
  nextState: Record<string, unknown>;
};

export interface IAuditLogRepository {
  create(data: CreateAuditLogData): Promise<AuditLog>;
  findAll(params: ListAuditLogsParams): Promise<PaginatedResult<AuditLog>>;
}
