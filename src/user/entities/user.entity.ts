import {
  Column,
  Entity,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { Exclude, Expose } from 'class-transformer';

import { Role } from 'src/role/entities/role.entity';
import { Tenant } from 'src/tenant/entities/tenant.entity';

@Entity()
@Expose()
@Unique(['emailAddress', 'tenant']) // email must be unique per tenant, not globally
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  emailAddress: string;

  @Column()
  name: string;

  @Column()
  @Expose({ groups: ['show-password'] })
  password: string;

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
