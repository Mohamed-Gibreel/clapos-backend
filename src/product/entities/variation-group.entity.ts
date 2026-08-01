import { Expose } from 'class-transformer';
import { BaseEntity } from 'src/utils/entities/base.entity';
import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { Product } from './product.entity';
import { VariationOption } from './variation-option.entity';

@Entity()
@Expose()
export class VariationGroup extends BaseEntity {
  @Column()
  name: string;

  @Column({ default: false })
  required: boolean;

  @Column({ default: 1 })
  maxSelect: number;

  @Column({ default: 0 })
  sortOrder: number;

  @JoinColumn()
  @ManyToOne(() => Product, (p) => p.variationGroups, { onDelete: 'CASCADE' })
  product: Product;

  @OneToMany(() => VariationOption, (vo) => vo.group, { cascade: true })
  options: VariationOption[];
}
