import { Expose } from 'class-transformer';
import { Customer } from 'src/customer/entities/customer.entity';
import { Tenant } from 'src/tenant/entities/tenant.entity';
import { User } from 'src/user/entities/user.entity';
import { BaseEntity } from 'src/utils/entities/base.entity';
import { PosTerminal } from 'src/terminal/entities/terminal.entity';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
} from 'typeorm';
import { OrderItem } from './order-item.entity';

export enum OrderStatus {
  Open = 'open',
  InProgress = 'in_progress',
  Completed = 'completed',
  Cancelled = 'cancelled',
  Voided = 'voided',
  Refunded = 'refunded',
}

export enum OrderType {
  DineIn = 'dine_in',
  TakeAway = 'take_away',
}

export enum DiscountType {
  Percentage = 'percentage',
  Amount = 'amount',
  None = 'none',
}

export enum PaymentMethod {
  Cash = 'cash',
  Card = 'card',
}

@Entity()
@Expose()
export class Order extends BaseEntity {
  @Column({ unique: true })
  clientId: string;

  @Column({ unique: true, nullable: true })
  orderNumber?: string;

  @Column({ type: 'enum', enum: OrderStatus, default: OrderStatus.Completed })
  status: OrderStatus;

  @Column({ type: 'enum', enum: OrderType })
  orderType: OrderType;

  @Column({ type: 'enum', enum: DiscountType, default: DiscountType.None })
  discountType: DiscountType;

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  discountValue: number;

  // Snapshot of the voucher code the cashier entered, if the discount came
  // from one — kept as plain text (not a FK) so the receipt still shows it
  // after the discount is edited or deleted.
  @Column({ type: 'varchar', nullable: true })
  discountCode?: string | null;

  @Column('decimal', { precision: 10, scale: 2 })
  subtotal: number;

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  tax: number;

  @Column('decimal', { precision: 10, scale: 2 })
  total: number;

  @Column({ type: 'enum', enum: PaymentMethod })
  paymentMethod: PaymentMethod;

  @Column('decimal', { precision: 10, scale: 2 })
  amountPaid: number;

  @Column('decimal', { precision: 10, scale: 2 })
  change: number;

  @Column({ nullable: true })
  notes?: string;

  @Column({ nullable: true })
  reason?: string;

  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  refundAmount?: number;

  @Column({ type: 'timestamptz' })
  clientCreatedAt: Date;

  @Column({ default: false })
  hadOfflineConflict: boolean;

  @JoinColumn()
  @ManyToOne(() => Tenant)
  tenant: Tenant;

  @JoinColumn()
  @ManyToOne(() => PosTerminal, { nullable: true })
  terminal: PosTerminal | null;

  @JoinColumn()
  @ManyToOne(() => Customer, { nullable: true })
  customer: Customer | null;

  @JoinColumn()
  @ManyToOne(() => User)
  cashier: User;

  @OneToMany(() => OrderItem, (item) => item.order, { cascade: true })
  items: OrderItem[];
}
