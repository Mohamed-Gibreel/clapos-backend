import { Expose } from 'class-transformer';
import { BaseEntity } from 'src/utils/entities/base.entity';
import { LocalizedText } from 'src/utils/types/localized-text';
import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { VariationGroup } from './variation-group.entity';

@Entity()
@Expose()
export class VariationOption extends BaseEntity {
  @Column({ type: 'jsonb' })
  name: LocalizedText;

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  priceModifier: number;

  @Column({ default: 0 })
  sortOrder: number;

  @JoinColumn()
  @ManyToOne(() => VariationGroup, (g) => g.options, { onDelete: 'CASCADE' })
  group: VariationGroup;
}
