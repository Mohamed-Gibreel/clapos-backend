import { Module } from '@nestjs/common';
import { TenantEntityModule } from 'src/tenant/tenant-entity.module';
import { TenantModule } from 'src/tenant/tenant.module';
import { Product } from 'src/product/entities/product.entity';
import { Category } from 'src/category/entities/category.entity';
import { Customer } from 'src/customer/entities/customer.entity';
import { SyncController } from './sync.controller';
import { SyncService } from './sync.service';

@Module({
  imports: [
    TenantEntityModule.forFeature([Product, Category, Customer]),
    TenantModule,
  ],
  controllers: [SyncController],
  providers: [SyncService],
})
export class SyncModule {}
