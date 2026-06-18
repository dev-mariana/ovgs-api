import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { AuditLog } from '../../../domain/audit/entities/audit-log.entity';
import {
  CreateAuditLogData,
  IAuditLogRepository,
  ListAuditLogsParams,
  PaginatedResult,
} from '../../../domain/audit/repositories/audit-log.repository';
import { AuditLogMapper } from '../prisma/mappers/audit-log.mapper';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PrismaAuditLogRepository implements IAuditLogRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    data: CreateAuditLogData,
    tx?: Prisma.TransactionClient,
  ): Promise<AuditLog> {
    const client = tx ?? this.prisma;

    const raw = await client.auditLog.create({
      data: {
        entity: data.entity,
        entityId: data.entityId,
        action: data.action,
        previousState: (data.previousState ?? undefined) as
          | Prisma.InputJsonObject
          | undefined,
        nextState: data.nextState as Prisma.InputJsonObject,
      },
    });

    return AuditLogMapper.toDomain(raw);
  }

  async findAll(
    params: ListAuditLogsParams,
  ): Promise<PaginatedResult<AuditLog>> {
    const { page, limit, entity, entityId, action } = params;
    const skip = (page - 1) * limit;
    const where: Prisma.AuditLogWhereInput = {};

    if (entity) where.entity = entity;
    if (entityId) where.entityId = entityId;
    if (action) where.action = action;

    const [rows, total] = await this.prisma.$transaction([
      this.prisma.auditLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: { occurredAt: 'desc' },
      }),

      this.prisma.auditLog.count({ where }),
    ]);

    return { data: rows.map((r) => AuditLogMapper.toDomain(r)), total };
  }
}
