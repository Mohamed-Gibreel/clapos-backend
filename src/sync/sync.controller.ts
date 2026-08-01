import { Controller, Get, Query } from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';

import { ApiTenantHeader } from 'src/utils/decorators/tenant-header.decorator';
import { Role, Roles } from 'src/utils/decorators/roles.decorator';
import { SyncService } from './sync.service';

@ApiBearerAuth()
@ApiTenantHeader()
@Controller('sync')
@Role([Roles.Admin, Roles.User])
export class SyncController {
  constructor(private readonly syncService: SyncService) {}

  @Get('catalog')
  getCatalog(@Query('updatedAfter') updatedAfter?: string) {
    return this.syncService.getCatalog(updatedAfter);
  }
}
