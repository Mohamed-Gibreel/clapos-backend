import { Expose } from 'class-transformer';
import { Tenant } from 'src/tenant/entities/tenant.entity';
import { BaseEntity } from 'src/utils/entities/base.entity';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  Unique,
} from 'typeorm';

@Entity()
@Expose()
@Unique(['name', 'tenant']) // No duplicate project for the same tenant
export class Project extends BaseEntity {
  @Column()
  name: string;

  @JoinColumn()
  @ManyToOne(() => Tenant, (t) => t.projects)
  tenant: Tenant;
}
