import { Module } from '@nestjs/common';
import { TenantEntityModule } from 'src/tenant/tenant-entity.module';
import { TenantModule } from 'src/tenant/tenant.module';
import { CustomerController } from './customer.controller';
import { CustomerService } from './customer.service';
import { Customer } from './entities/customer.entity';

@Module({
  imports: [TenantEntityModule.forFeature([Customer]), TenantModule],
  controllers: [CustomerController],
  providers: [CustomerService],
  exports: [CustomerService],
})
export class CustomerModule {}
