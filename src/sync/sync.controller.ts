import { Body, Controller, Get, HttpCode, HttpStatus, Post, Query } from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';

import { ApiTenantHeader } from 'src/utils/decorators/tenant-header.decorator';
import { Role, Roles } from 'src/utils/decorators/roles.decorator';
import { SyncService } from './sync.service';
import { SyncCustomersDTO } from './dto/sync-customers.dto';

@ApiBearerAuth()
@ApiTenantHeader()
@Controller('sync')
@Role([Roles.Cashier, Roles.Manager, Roles.Owner])
export class SyncController {
  constructor(private readonly syncService: SyncService) {}

  @Get('catalog')
  getCatalog(@Query('updatedAfter') updatedAfter?: string) {
    return this.syncService.getCatalog(updatedAfter);
  }

  @Post('customers')
  @HttpCode(HttpStatus.OK)
  syncCustomers(@Body() dto: SyncCustomersDTO) {
    return this.syncService.syncCustomers(dto);
  }
}
