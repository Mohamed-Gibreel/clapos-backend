import { Expose } from 'class-transformer';
import { Tenant } from 'src/tenant/entities/tenant.entity';
import { BaseEntity } from 'src/utils/entities/base.entity';
import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';

export enum Gender {
  Male = 'male',
  Female = 'female',
  Other = 'other',
}

@Entity()
@Expose()
export class Customer extends BaseEntity {
  @Column({ unique: true })
  clientId: string;

  @Column()
  firstName: string;

  @Column()
  lastName: string;

  @Column({ type: 'enum', enum: Gender, nullable: true })
  gender?: Gender;

  @Column({ nullable: true })
  phone?: string;

  @Column({ nullable: true })
  email?: string;

  @Column({ nullable: true })
  address?: string;

  @Column({ type: 'date', nullable: true })
  birthDate?: Date;

  @Column({ default: false })
  isMember: boolean;

  @Column({ nullable: true })
  syncedAt?: Date;

  @JoinColumn()
  @ManyToOne(() => Tenant)
  tenant: Tenant;
}
