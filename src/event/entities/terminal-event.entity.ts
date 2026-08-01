import { Expose } from 'class-transformer';
import { PosTerminal } from 'src/terminal/entities/terminal.entity';
import { User } from 'src/user/entities/user.entity';
import { BaseEntity } from 'src/utils/entities/base.entity';
import { Column, Entity, JoinColumn, ManyToOne, Unique } from 'typeorm';
import { Event } from './event.entity';

@Entity()
@Expose()
@Unique(['terminalId', 'eventId'])
export class TerminalEvent extends BaseEntity {
  @JoinColumn()
  @ManyToOne(() => PosTerminal)
  terminal: PosTerminal;

  @Column()
  terminalId: string;

  @JoinColumn()
  @ManyToOne(() => Event)
  event: Event;

  @Column()
  eventId: string;

  @JoinColumn()
  @ManyToOne(() => User, { nullable: true })
  assignedBy?: User;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  assignedAt: Date;
}
