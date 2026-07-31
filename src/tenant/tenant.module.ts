import { Module } from '@nestjs/common';
import { TenantService } from './tenant.service';
import { TenantController } from './tenant.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Tenant } from './entities/tenant.entity';
import { TenantContextService } from './tenant-context.service';

@Module({
  imports: [TypeOrmModule.forFeature([Tenant])],
  controllers: [TenantController],
  providers: [TenantService, TenantContextService],
  exports: [TenantService, TenantContextService],
})
export class TenantModule {}
