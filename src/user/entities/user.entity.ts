import {
  Column,
  Entity,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  PrimaryGeneratedColumn,
  Index,
} from 'typeorm';
import { Exclude, Expose } from 'class-transformer';

import { Role } from 'src/role/entities/role.entity';
import { Tenant } from 'src/tenant/entities/tenant.entity';

@Entity()
@Expose()
// Email must be unique per tenant, not globally. Partial index so a
// soft-deleted user doesn't permanently reserve their email address.
@Index('UQ_user_email_tenant_active', ['emailAddress', 'tenant'], {
  unique: true,
  where: '"deletedAt" IS NULL',
})
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  emailAddress: string;

  @Column()
  name: string;

  @Column()
  @Expose({ groups: ['show-password'] })
  password: string;

  @Column({ nullable: true })
  @Expose({ groups: ['show-password'] })
  pin?: string;

  @JoinColumn()
  @ManyToOne(() => Role, (r) => r.users)
  role: Role;

  @JoinColumn()
  @ManyToOne(() => Tenant, (t) => t.users)
  tenant: Tenant;

  @Column({ nullable: true })
  last_login_at?: Date;

  @Exclude()
  @CreateDateColumn()
  createdAt: Date;

  @Exclude()
  @UpdateDateColumn()
  updatedAt: Date;

  @Exclude()
  @DeleteDateColumn()
  deletedAt?: Date;
}
