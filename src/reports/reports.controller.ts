import { Controller, Get, Query } from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';

import { ApiTenantHeader } from 'src/utils/decorators/tenant-header.decorator';
import { Role, Roles } from 'src/utils/decorators/roles.decorator';
import { ReportsService } from './reports.service';

@ApiBearerAuth()
@ApiTenantHeader()
@Controller('reports')
@Role([Roles.Manager, Roles.Owner])
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

  @Get('sales')
  getSales(
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('groupBy') groupBy?: 'day' | 'week' | 'month',
    @Query('terminalId') terminalId?: string,
  ) {
    return this.reportsService.getSales({ from, to, groupBy, terminalId });
  }

  @Get('top-products')
  getTopProducts(
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('limit') limit?: string,
    @Query('terminalId') terminalId?: string,
  ) {
    return this.reportsService.getTopProducts({
      from,
      to,
      limit: limit ? parseInt(limit, 10) : undefined,
      terminalId,
    });
  }

  @Get('product-status')
  getProductStatus() {
    return this.reportsService.getProductStatus();
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
