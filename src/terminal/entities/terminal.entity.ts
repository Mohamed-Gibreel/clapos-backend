import { Exclude, Expose } from 'class-transformer';
import { Tenant } from 'src/tenant/entities/tenant.entity';
import { BaseEntity } from 'src/utils/entities/base.entity';
import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';

@Entity()
@Expose()
export class PosTerminal extends BaseEntity {
  @Column()
  name: string;

  // Never serialized — the raw token is only ever handed back once, at
  // creation/rotation time, via TerminalCredentialsDTO.
  @Column({ unique: true })
  @Exclude()
  deviceTokenHash: string;

  @Column({ default: true })
  isActive: boolean;

  @Column({ nullable: true })
  lastSeenAt?: Date;

  @JoinColumn()
  @ManyToOne(() => Tenant)
  tenant: Tenant;
}
