import type { AuditLog as PrismaAuditLog } from '@prisma/client';
import { AuditLog } from '../../../../domain/audit/entities/audit-log.entity';
import { AuditAction } from '../../../../domain/audit/enums/audit-action.enum';

export class AuditLogMapper {
  static toDomain(raw: PrismaAuditLog): AuditLog {
    return {
      id: raw.id,
      entity: raw.entity,
      entityId: raw.entityId,
      action: raw.action as AuditAction,
      previousState:
        (raw.previousState as Record<string, unknown> | null) ?? undefined,
      nextState: raw.nextState as Record<string, unknown>,
      occurredAt: raw.occurredAt,
    };
  }
}
