import { Controller, Get, Query } from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';

import { ApiTenantHeader } from 'src/utils/decorators/tenant-header.decorator';
import { Role, Roles } from 'src/utils/decorators/roles.decorator';
import { ReportsService } from './reports.service';

@ApiBearerAuth()
@ApiTenantHeader()
@Controller('reports')
@Role([Roles.Admin, Roles.User])
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('summary')
  getSummary(
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('terminalId') terminalId?: string,
  ) {
    return this.reportsService.getSummary({ from, to, terminalId });
  }

  @Get('recent-orders')
  getRecentOrders(
    @Query('limit') limit?: string,
    @Query('terminalId') terminalId?: string,
  ) {
    return this.reportsService.getRecentOrders({
      limit: limit ? parseInt(limit, 10) : undefined,
      terminalId,
    });
  }
}
