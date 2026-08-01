import { Module } from '@nestjs/common';
import { TenantEntityModule } from 'src/tenant/tenant-entity.module';
import { TenantModule } from 'src/tenant/tenant.module';
import { TaxConfig } from './entities/tax-config.entity';
import { TaxConfigController } from './tax-config.controller';
import { TaxConfigService } from './tax-config.service';

@Module({
  imports: [
    TenantEntityModule.forFeature([TaxConfig]),
    TenantModule,
  ],
  controllers: [TaxConfigController],
  providers: [TaxConfigService],
  exports: [TaxConfigService],
})
export class TaxConfigModule {}
