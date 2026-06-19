import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../infra/database/database.module';
import { PrismaAuditLogRepository } from '../../infra/database/repositories/audit-log.repository';
import { AuditController } from './controllers/audit.controller';
import { AUDIT_LOG_REPOSITORY, AuditService } from './services/audit.service';

@Module({
  imports: [DatabaseModule],
  controllers: [AuditController],
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
