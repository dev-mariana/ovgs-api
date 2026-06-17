import { AuditAction } from '../enums/audit-action.enum';

export interface AuditLog {
  id: string;
  entity: string;
  entityId: string;
  action: AuditAction;
  previousState?: Record<string, unknown> | null;
  nextState: Record<string, unknown>;
  occurredAt: Date;
}
