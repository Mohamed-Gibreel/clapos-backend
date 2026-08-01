import { Expose } from 'class-transformer';
import { Tenant } from 'src/tenant/entities/tenant.entity';
import { BaseEntity } from 'src/utils/entities/base.entity';
import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';

export enum TableShape {
  Circle = 'circle',
  Square = 'square',
  Rectangle = 'rectangle',
}

export enum TableStatus {
  Available = 'available',
  Occupied = 'occupied',
  Reserved = 'reserved',
}

@Entity()
@Expose()
export class Table extends BaseEntity {
  @Column()
  name: string;

  @Column({ type: 'enum', enum: TableShape })
  shape: TableShape;

  @Column({ type: 'int' })
  capacity: number;

  @Column({ type: 'enum', enum: TableStatus, default: TableStatus.Available })
  status: TableStatus;

  @Column({ type: 'float' })
  posX: number;

  @Column({ type: 'float' })
  posY: number;

  @Column({ type: 'float' })
  width: number;

  @Column({ type: 'float' })
  height: number;

  @Column()
  color: string;

  @JoinColumn()
  @ManyToOne(() => Tenant)
  tenant: Tenant;
}
