import { Expose } from 'class-transformer';
import { BaseEntity } from 'src/utils/entities/base.entity';
import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { OrderItem } from './order-item.entity';

@Entity()
@Expose()
export class OrderItemVariation extends BaseEntity {
  @Column()
  groupName: string;

  @Column()
  optionName: string;

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  priceModifier: number;

  @JoinColumn()
  @ManyToOne(() => OrderItem, (i) => i.variations, { onDelete: 'CASCADE' })
  orderItem: OrderItem;
}
