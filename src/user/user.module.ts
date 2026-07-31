import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { UserService } from './user.service';

import { UserController } from './user.controller';

import { User } from './entities/user.entity';
import { RoleModule } from 'src/role/role.module';
import { TenantModule } from 'src/tenant/tenant.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    forwardRef(() => RoleModule),
    TenantModule,
  ],
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule {}
