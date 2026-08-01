import { Module } from '@nestjs/common';
import { TenantAwareModule } from 'src/tenant/tenant-aware.module';
import { TenantEntityModule } from 'src/tenant/tenant-entity.module';
import { TenantModule } from 'src/tenant/tenant.module';
import { Product } from 'src/product/entities/product.entity';
import { Category } from 'src/category/entities/category.entity';
import { SyncController } from './sync.controller';
import { SyncService } from './sync.service';

@Module({
  imports: [
    TenantEntityModule.forFeature([Product, Category]),
    TenantModule,
  ],
  controllers: [SyncController],
  providers: [SyncService],
})
export class SyncModule {}
