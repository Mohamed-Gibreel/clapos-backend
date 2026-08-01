import { Expose } from 'class-transformer';
import { Category } from 'src/category/entities/category.entity';
import { Tenant } from 'src/tenant/entities/tenant.entity';
import { BaseEntity } from 'src/utils/entities/base.entity';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  Unique,
} from 'typeorm';
import { VariationGroup } from './variation-group.entity';

export enum ProductStatus {
  Active = 'active',
  Inactive = 'inactive',
  Draft = 'draft',
}

@Entity()
@Expose()
@Unique(['sku', 'tenant'])
export class Product extends BaseEntity {
  @Column()
  name: string;

  @Column({ nullable: true })
  description?: string;

  @Column()
  sku: string;

  @Column('decimal', { precision: 10, scale: 2 })
  price: number;

  @Column({ nullable: true })
  imageUrl?: string;

  @Column({ type: 'enum', enum: ProductStatus, default: ProductStatus.Active })
  status: ProductStatus;

  @JoinColumn()
  @ManyToOne(() => Category, { nullable: true, onDelete: 'SET NULL' })
  category?: Category;

  @JoinColumn()
  @ManyToOne(() => Tenant)
  tenant: Tenant;

  @OneToMany(() => VariationGroup, (vg) => vg.product, { cascade: true })
  variationGroups: VariationGroup[];
}
