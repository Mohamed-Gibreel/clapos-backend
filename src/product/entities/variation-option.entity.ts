import { Expose } from 'class-transformer';
import { BaseEntity } from 'src/utils/entities/base.entity';
import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { VariationGroup } from './variation-group.entity';

@Entity()
@Expose()
export class VariationOption extends BaseEntity {
  @Column()
  name: string;

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  priceModifier: number;

  @Column({ default: 0 })
  sortOrder: number;

  @JoinColumn()
  @ManyToOne(() => VariationGroup, (g) => g.options, { onDelete: 'CASCADE' })
  group: VariationGroup;
}
