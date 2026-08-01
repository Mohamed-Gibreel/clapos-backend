import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TenantEntityModule } from 'src/tenant/tenant-entity.module';
import { TenantModule } from 'src/tenant/tenant.module';
import { CustomerController } from './customer.controller';
import { CustomerService } from './customer.service';
import { MembershipService } from './membership.service';
import { Customer } from './entities/customer.entity';
import { Membership } from './entities/membership.entity';

@Module({
  imports: [TenantEntityModule.forFeature([Customer]), TypeOrmModule.forFeature([Membership]), TenantModule],
  controllers: [CustomerController],
  providers: [CustomerService, MembershipService],
  exports: [CustomerService],
})
export class CustomerModule {}
