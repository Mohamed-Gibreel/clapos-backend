import { Module } from '@nestjs/common';
import { TenantEntityModule } from 'src/tenant/tenant-entity.module';
import { TenantModule } from 'src/tenant/tenant.module';
import { CategoryController } from './category.controller';
import { CategoryService } from './category.service';
import { Category } from './entities/category.entity';

@Module({
  imports: [TenantEntityModule.forFeature([Category]), TenantModule],
  controllers: [CategoryController],
  providers: [CategoryService],
  exports: [CategoryService],
})
export class CategoryModule {}
