import { Expose } from 'class-transformer';
import { Category } from 'src/category/entities/category.entity';
import { Media } from 'src/media/entities/media.entity';
import { Tenant } from 'src/tenant/entities/tenant.entity';
import { BaseEntity } from 'src/utils/entities/base.entity';
import { LocalizedText } from 'src/utils/types/localized-text';
import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
} from 'typeorm';
import { VariationGroup } from './variation-group.entity';

export enum ProductStatus {
  Active = 'active',
  Inactive = 'inactive',
  Draft = 'draft',
}

@Entity()
@Expose()
// Partial index so soft-deleted products don't block reusing their SKU
@Index('UQ_product_sku_tenant_active', ['sku', 'tenant'], {
  unique: true,
  where: '"deletedAt" IS NULL',
})
export class Product extends BaseEntity {
  @Column({ type: 'jsonb' })
  name: LocalizedText;

  @Column({ type: 'jsonb', nullable: true })
  description?: LocalizedText;

  @Column()
  sku: string;

  @Column('decimal', { precision: 10, scale: 2 })
  price: number;

  @Column({ type: 'enum', enum: ProductStatus, default: ProductStatus.Active })
  status: ProductStatus;

  @JoinColumn()
  @ManyToOne(() => Category, { nullable: true, onDelete: 'SET NULL' })
  category: Category | null;

  @JoinColumn()
  @ManyToOne(() => Media, { nullable: true, onDelete: 'SET NULL' })
  image: Media | null;

  @JoinColumn()
  @ManyToOne(() => Tenant)
  tenant: Tenant;

  @OneToMany(() => VariationGroup, (vg) => vg.product, {
    cascade: true,
    orphanedRowAction: 'soft-delete',
  })
  variationGroups: VariationGroup[];
}
