import { Expose } from 'class-transformer';
import { Media } from 'src/media/entities/media.entity';
import { Tenant } from 'src/tenant/entities/tenant.entity';
import { BaseEntity } from 'src/utils/entities/base.entity';
import { LocalizedText } from 'src/utils/types/localized-text';
import { Column, Entity, Index, JoinColumn, ManyToOne, OneToMany } from 'typeorm';

@Entity()
@Expose()
// Partial index so soft-deleted categories don't block reusing their name
@Index('UQ_category_name_tenant_active', ['name', 'tenant'], {
  unique: true,
  where: '"deletedAt" IS NULL',
})
export class Category extends BaseEntity {
  @Column({ type: 'jsonb' })
  name: LocalizedText;

  @JoinColumn()
  @ManyToOne(() => Media, { nullable: true, onDelete: 'SET NULL' })
  icon: Media | null;

  @Column({ default: 0 })
  sortOrder: number;

  @Column({ default: true })
  isActive: boolean;

  @JoinColumn()
  @ManyToOne(() => Tenant)
  tenant: Tenant;
}
