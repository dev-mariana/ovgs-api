import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ListAuditLogsDto } from '../dto/list-audit-logs.dto';
import { AuditService } from '../services/audit.service';

@ApiTags('Audit')
@Controller('audit-logs')
export class AuditController {
  constructor(private readonly service: AuditService) {}

  @Get()
  @ApiOperation({ summary: 'List audit logs with optional filters' })
  @ApiResponse({ status: 200, description: 'Paginated audit log entries.' })
  findAll(@Query() query: ListAuditLogsDto) {
    return this.service.findAll(query);
  }
}
