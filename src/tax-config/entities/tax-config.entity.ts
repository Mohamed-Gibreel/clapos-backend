import { Expose } from 'class-transformer';
import { Tenant } from 'src/tenant/entities/tenant.entity';
import { BaseEntity } from 'src/utils/entities/base.entity';
import { LocalizedText } from 'src/utils/types/localized-text';
import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';

@Entity()
@Expose()
export class TaxConfig extends BaseEntity {
  @Column({ type: 'jsonb' })
  name: LocalizedText;

  @Column('decimal', { precision: 5, scale: 4 })
  rate: number;

  @Column({ default: true })
  isActive: boolean;

  @JoinColumn()
  @ManyToOne(() => Tenant)
  tenant: Tenant;
}
