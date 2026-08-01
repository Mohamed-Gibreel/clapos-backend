import { Expose } from 'class-transformer';
import { Tenant } from 'src/tenant/entities/tenant.entity';
import { BaseEntity } from 'src/utils/entities/base.entity';
import { Column, Entity, JoinColumn, ManyToOne, Unique } from 'typeorm';

@Entity()
@Expose()
@Unique(['key', 'tenantId'])
export class FeatureFlag extends BaseEntity {
  @Column()
  key: string;

  @Column({ default: false })
  enabled: boolean;

  @Column({ nullable: true })
  description?: string;

  @Column({ nullable: true })
  tenantId: string;

  @JoinColumn()
  @ManyToOne(() => Tenant)
  tenant: Tenant;
}
