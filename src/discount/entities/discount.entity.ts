import { Expose } from 'class-transformer';
import { Tenant } from 'src/tenant/entities/tenant.entity';
import { BaseEntity } from 'src/utils/entities/base.entity';
import { LocalizedText } from 'src/utils/types/localized-text';
import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';

export enum DiscountType {
  Percentage = 'percentage',
  Amount = 'amount',
}

@Entity()
@Expose()
export class Discount extends BaseEntity {
  @Column({ type: 'jsonb' })
  name: LocalizedText;

  @Column({ type: 'enum', enum: DiscountType })
  type: DiscountType;

  @Column('decimal', { precision: 10, scale: 2 })
  value: number;

  @Column({ nullable: true, unique: true })
  code?: string;

  @Column({ default: true })
  isActive: boolean;

  @Column({ type: 'timestamptz', nullable: true })
  expiresAt?: Date;

  @JoinColumn()
  @ManyToOne(() => Tenant)
  tenant: Tenant;
}
