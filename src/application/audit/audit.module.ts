import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../infra/database/database.module';
import { PrismaAuditLogRepository } from '../../infra/database/repositories/audit-log.repository';
import { AUDIT_LOG_REPOSITORY, AuditService } from './services/audit.service';

@Module({
  imports: [DatabaseModule],
  providers: [
    AuditService,
    {
      provide: AUDIT_LOG_REPOSITORY,
      useClass: PrismaAuditLogRepository,
    },
  ],
  exports: [AuditService],
})
export class AuditModule {}
