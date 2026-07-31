import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Role } from 'src/role/entities/role.entity';
import { Tenant } from 'src/tenant/entities/tenant.entity';
import { User } from 'src/user/entities/user.entity';
import { Roles } from 'src/utils/decorators/roles.decorator';
import { Repository } from 'typeorm';

@Injectable()
export class SeedService implements OnApplicationBootstrap {
  logger = new Logger();

  constructor(
    @InjectRepository(User) private userRepo: Repository<User>,
    @InjectRepository(Role) private roleRepo: Repository<Role>,
    @InjectRepository(Tenant) private tenantRepo: Repository<Tenant>,
  ) {}

  async onApplicationBootstrap() {
    // 1. Create Tenant
    let tenant = await this.tenantRepo.findOne({
      where: { name: 'SuperAdmins' },
    });
    if (!tenant) {
      tenant = await this.tenantRepo.save({ name: 'SuperAdmins' });
      this.logger.log('[SeedService] - ✅ Created tenant successfully');
    }

    // 2. Create Roles
    let role = await this.roleRepo.findOne({
      where: { name: Roles.SuperAdmin },
    });
    if (!role) {
      role = await this.roleRepo.save({ name: Roles.SuperAdmin });
      this.logger.log('[SeedService] - Created SuperAdmin role successfully');
    }

    let adminRole = await this.roleRepo.findOne({
      where: { name: Roles.Admin },
    });
    if (!adminRole) {
      adminRole = await this.roleRepo.save({ name: Roles.Admin });
      this.logger.log('[SeedService] - Created Admin role successfully');
    }

    let userRole = await this.roleRepo.findOne({
      where: { name: Roles.User },
    });
    if (!userRole) {
      userRole = await this.roleRepo.save({ name: Roles.User });
      this.logger.log('[SeedService] - Created User role successfully');
    }

    // 3. Create SuperAdmin User
    const adminEmail = 'user@example.com';
    let user = await this.userRepo.findOne({
      where: { emailAddress: adminEmail },
    });
    if (!user) {
      user = this.userRepo.create({
        role: role,
        name: 'string',
        tenant: tenant,
        password: 'string',
        emailAddress: adminEmail,
      });
      await this.userRepo.save(user);
      this.logger.log('[SeedService] - ✅ Created super admin successfully');
    }
  }
}
