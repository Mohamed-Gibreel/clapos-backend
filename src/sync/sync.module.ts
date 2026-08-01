import { Module } from '@nestjs/common';
import { TenantEntityModule } from 'src/tenant/tenant-entity.module';
import { TenantModule } from 'src/tenant/tenant.module';
import { Product } from 'src/product/entities/product.entity';
import { Category } from 'src/category/entities/category.entity';
import { Customer } from 'src/customer/entities/customer.entity';
import { TaxConfig } from 'src/tax-config/entities/tax-config.entity';
import { FeatureFlag } from 'src/feature-flag/entities/feature-flag.entity';
import { SyncController } from './sync.controller';
import { SyncService } from './sync.service';

@Module({
  imports: [
    TenantEntityModule.forFeature([Product, Category, Customer, TaxConfig, FeatureFlag]),
    TenantModule,
  ],
  controllers: [SyncController],
  providers: [SyncService],
})
export class SyncModule {}
