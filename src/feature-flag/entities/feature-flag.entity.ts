import { Expose } from 'class-transformer';
import { Tenant } from 'src/tenant/entities/tenant.entity';
import { BaseEntity } from 'src/utils/entities/base.entity';
import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';

@Entity()
@Expose()
// Partial index so soft-deleted flags don't block reusing their key
@Index('UQ_feature_flag_key_tenant_active', ['key', 'tenantId'], {
  unique: true,
  where: '"deletedAt" IS NULL',
})
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
