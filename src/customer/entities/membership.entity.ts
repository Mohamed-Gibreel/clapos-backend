import { Expose } from 'class-transformer';
import { BaseEntity } from 'src/utils/entities/base.entity';
import { Column, Entity, JoinColumn, OneToOne } from 'typeorm';
import { Customer } from './customer.entity';

export enum MembershipType {
  Lifetime = 'lifetime',
  Monthly = 'monthly',
  Annual = 'annual',
}

@Entity()
@Expose()
export class Membership extends BaseEntity {
  @OneToOne(() => Customer)
  @JoinColumn()
  customer: Customer;

  @Column()
  customerId: string;

  @Column({ type: 'enum', enum: MembershipType })
  type: MembershipType;

  @Column({ type: 'date' })
  startDate: Date;

  @Column({ type: 'date', nullable: true })
  expiryDate?: Date;

  @Column({ default: true })
  isActive: boolean;
}
