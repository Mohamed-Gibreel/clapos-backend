import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TenantEntityModule } from 'src/tenant/tenant-entity.module';
import { TenantModule } from 'src/tenant/tenant.module';
import { CategoryModule } from 'src/category/category.module';
import { ProductController } from './product.controller';
import { ProductService } from './product.service';
import { Product } from './entities/product.entity';
import { VariationGroup } from './entities/variation-group.entity';
import { VariationOption } from './entities/variation-option.entity';

@Module({
  imports: [
    TenantEntityModule.forFeature([Product]),
    TypeOrmModule.forFeature([VariationGroup, VariationOption]),
    TenantModule,
    CategoryModule,
  ],
  controllers: [ProductController],
  providers: [ProductService],
  exports: [ProductService],
})
export class ProductModule {}
