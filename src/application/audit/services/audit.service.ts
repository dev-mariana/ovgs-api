import { Inject, Injectable } from '@nestjs/common';
import type { AuditLog } from '../../../domain/audit/entities/audit-log.entity';
import type {
  CreateAuditLogData,
  IAuditLogRepository,
  ListAuditLogsParams,
  PaginatedResult,
} from '../../../domain/audit/repositories/audit-log.repository';

export const AUDIT_LOG_REPOSITORY = 'IAuditLogRepository';

@Injectable()
export class AuditService {
  constructor(
    @Inject(AUDIT_LOG_REPOSITORY)
    private readonly repository: IAuditLogRepository,
  ) {}

  async record(data: CreateAuditLogData): Promise<AuditLog> {
    return this.repository.create(data);
  }

  async findAll(
    params: Partial<Pick<ListAuditLogsParams, 'page' | 'limit'>> &
      Omit<ListAuditLogsParams, 'page' | 'limit'>,
  ): Promise<PaginatedResult<AuditLog> & { page: number; limit: number }> {
    const page = params.page ?? 1;
    const limit = params.limit ?? 50;

    const result = await this.repository.findAll({ ...params, page, limit });

    return { ...result, page, limit };
  }
}
