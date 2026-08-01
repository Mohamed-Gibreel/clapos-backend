import { Expose } from 'class-transformer';
import { Product } from 'src/product/entities/product.entity';
import { BaseEntity } from 'src/utils/entities/base.entity';
import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { Order } from './order.entity';
import { OrderItemVariation } from './order-item-variation.entity';

@Entity()
@Expose()
export class OrderItem extends BaseEntity {
  @Column({ nullable: true })
  productId?: string;

  @Column()
  name: string;

  @Column('decimal', { precision: 10, scale: 2 })
  unitPrice: number;

  @Column()
  quantity: number;

  @Column('decimal', { precision: 10, scale: 2 })
  subtotal: number;

  @Column({ nullable: true })
  notes?: string;

  @JoinColumn()
  @ManyToOne(() => Order, (o) => o.items, { onDelete: 'CASCADE' })
  order: Order;

  @OneToMany(() => OrderItemVariation, (v) => v.orderItem, { cascade: true })
  variations: OrderItemVariation[];
}
