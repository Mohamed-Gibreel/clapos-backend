import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
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
    const roleNames = [Roles.SuperAdmin, Roles.Owner, Roles.Manager, Roles.Cashier];
    for (const name of roleNames) {
      const exists = await this.roleRepo.findOne({ where: { name } });
      if (!exists) {
        await this.roleRepo.save({ name });
        this.logger.log(`[SeedService] - Created role: ${name}`);
      }
    }

    const superAdminRole = await this.roleRepo.findOne({ where: { name: Roles.SuperAdmin } });
    if (!superAdminRole) return;

    // 3. Create SuperAdmin User
    const adminEmail = 'user@example.com';
    const existingUser = await this.userRepo.findOne({
      where: { emailAddress: adminEmail },
    });
    if (!existingUser) {
      const user = this.userRepo.create();
      user.role = superAdminRole;
      user.name = 'superadmin';
      user.tenant = tenant;
      user.password = await bcrypt.hash('admin123', 10);
      user.emailAddress = adminEmail;
      await this.userRepo.save(user);
      this.logger.log('[SeedService] - ✅ Created super admin successfully');
    }
  }
}
