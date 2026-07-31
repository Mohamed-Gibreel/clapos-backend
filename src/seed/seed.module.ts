import { Module } from '@nestjs/common';
import { SeedService } from './seed.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Tenant } from 'src/tenant/entities/tenant.entity';
import { Role } from 'src/role/entities/role.entity';
import { User } from 'src/user/entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User, Tenant, Role])],
  providers: [SeedService],
})
export class SeedModule {}
