import { Expose } from 'class-transformer';
import { PosTerminal } from 'src/terminal/entities/terminal.entity';
import { User } from 'src/user/entities/user.entity';
import { BaseEntity } from 'src/utils/entities/base.entity';
import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { Event } from './event.entity';

@Entity()
@Expose()
// Partial index so a terminal can be reassigned to an event it was
// previously unassigned from
@Index('UQ_terminal_event_terminal_event_active', ['terminalId', 'eventId'], {
  unique: true,
  where: '"deletedAt" IS NULL',
})
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
