import { Module } from '@nestjs/common';

import { TenantEntityModule } from 'src/tenant/tenant-entity.module';
import { TenantModule } from 'src/tenant/tenant.module';
import { Table } from './entities/table.entity';
import { TableService } from './table.service';
import { TableController } from './table.controller';

@Module({
  imports: [TenantEntityModule.forFeature([Table]), TenantModule],
  controllers: [TableController],
  providers: [TableService],
  exports: [TableService],
})
export class TableModule {}
