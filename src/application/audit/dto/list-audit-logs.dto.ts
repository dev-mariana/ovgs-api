import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { AuditAction } from '../../../domain/audit/enums/audit-action.enum';

export class ListAuditLogsDto {
  @IsString()
  @IsOptional()
  entity?: string;

  @IsString()
  @IsOptional()
  entityId?: string;

  @IsEnum(AuditAction)
  @IsOptional()
  action?: AuditAction;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  page?: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  @IsOptional()
  limit?: number;
}
