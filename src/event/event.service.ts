import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { createResultClass } from 'src/utils/result';
import { ErrorCode } from 'src/utils/error-codes';

import { Event } from './entities/event.entity';
import { TerminalEvent } from './entities/terminal-event.entity';
import { CreateEventDTO } from './dto/create-event.dto';
import { UpdateEventDTO } from './dto/update-event.dto';

@Injectable()
export class EventService {
  constructor(
    @InjectRepository(Event)
    private readonly eventRepo: Repository<Event>,
    @InjectRepository(TerminalEvent)
    private readonly terminalEventRepo: Repository<TerminalEvent>,
  ) {}

  async create(dto: CreateEventDTO) {
    const Result = createResultClass<Event, string[]>();
    try {
      const event = this.eventRepo.create({
        name: dto.name,
        description: dto.description,
        location: dto.location,
        startDate: new Date(dto.startDate),
        endDate: new Date(dto.endDate),
        isActive: dto.isActive ?? true,
      });
      const saved = await this.eventRepo.save(event);
      return Result.success(saved);
    } catch (error) {
      return Result.error({ error: [ErrorCode.INTERNAL_SERVER_ERROR], errorCode: HttpStatus.INTERNAL_SERVER_ERROR });
    }
  }

  async getAll() {
    const Result = createResultClass<Event[], string[]>();
    try {
      const events = await this.eventRepo.find({ where: { deletedAt: undefined }, order: { startDate: 'DESC' } });
      return Result.success(events);
    } catch (error) {
      return Result.error({ error: [ErrorCode.INTERNAL_SERVER_ERROR], errorCode: HttpStatus.INTERNAL_SERVER_ERROR });
    }
  }

  async getById(id: string) {
    const Result = createResultClass<Event, string[]>();
    try {
      const event = await this.eventRepo.findOne({ where: { id } });
      if (!event) {
        return Result.error({ error: [ErrorCode.EVENT_NOT_FOUND], errorCode: HttpStatus.NOT_FOUND });
      }
      return Result.success(event);
    } catch (error) {
      return Result.error({ error: [ErrorCode.INTERNAL_SERVER_ERROR], errorCode: HttpStatus.INTERNAL_SERVER_ERROR });
    }
  }

  async update(id: string, dto: UpdateEventDTO) {
    const Result = createResultClass<Event, string[]>();
    try {
      const existing = await this.getById(id);
      if (!existing.isSuccess) return existing;

      const merged = this.eventRepo.merge(existing.value, {
        ...dto,
        startDate: dto.startDate ? new Date(dto.startDate) : existing.value.startDate,
        endDate: dto.endDate ? new Date(dto.endDate) : existing.value.endDate,
      });
      const saved = await this.eventRepo.save(merged);
      return Result.success(saved);
    } catch (error) {
      return Result.error({ error: [ErrorCode.INTERNAL_SERVER_ERROR], errorCode: HttpStatus.INTERNAL_SERVER_ERROR });
    }
  }

  async delete(id: string) {
    const Result = createResultClass<void, string[]>();
    try {
      const existing = await this.getById(id);
      if (!existing.isSuccess) return Result.error({ error: existing.error, errorCode: existing.errorCode });
      await this.eventRepo.softDelete({ id });
      return Result.success(undefined);
    } catch (error) {
      return Result.error({ error: [ErrorCode.INTERNAL_SERVER_ERROR], errorCode: HttpStatus.INTERNAL_SERVER_ERROR });
    }
  }

  async assignTerminal(eventId: string, terminalId: string, assignedById: string) {
    const Result = createResultClass<TerminalEvent, string[]>();
    try {
      const existing = await this.terminalEventRepo.findOne({ where: { eventId, terminalId } });
      if (existing) {
        return Result.error({ error: [ErrorCode.TERMINAL_ALREADY_ASSIGNED_TO_EVENT], errorCode: HttpStatus.CONFLICT });
      }

      const assignment = this.terminalEventRepo.create({ eventId, terminalId, assignedAt: new Date() });
      if (assignedById) {
        (assignment as any).assignedBy = { id: assignedById };
      }
      const saved = await this.terminalEventRepo.save(assignment);
      const withRelations = await this.terminalEventRepo.findOne({
        where: { id: saved.id },
        relations: ['terminal', 'event'],
      });
      return Result.success(withRelations!);
    } catch (error) {
      if (error?.code === '23505') {
        return Result.error({ error: [ErrorCode.TERMINAL_ALREADY_ASSIGNED_TO_EVENT], errorCode: HttpStatus.CONFLICT });
      }
      return Result.error({ error: [ErrorCode.INTERNAL_SERVER_ERROR], errorCode: HttpStatus.INTERNAL_SERVER_ERROR });
    }
  }

  async removeTerminal(eventId: string, terminalId: string) {
    const Result = createResultClass<void, string[]>();
    try {
      const existing = await this.terminalEventRepo.findOne({ where: { eventId, terminalId } });
      if (!existing) {
        return Result.error({ error: [ErrorCode.TERMINAL_EVENT_NOT_FOUND], errorCode: HttpStatus.NOT_FOUND });
      }
      await this.terminalEventRepo.softDelete({ id: existing.id });
      return Result.success(undefined);
    } catch (error) {
      return Result.error({ error: [ErrorCode.INTERNAL_SERVER_ERROR], errorCode: HttpStatus.INTERNAL_SERVER_ERROR });
    }
  }

  async getTerminalsForEvent(eventId: string) {
    const Result = createResultClass<TerminalEvent[], string[]>();
    try {
      const assignments = await this.terminalEventRepo.find({
        where: { eventId },
        relations: ['terminal', 'terminal.tenant'],
        order: { assignedAt: 'DESC' },
      });
      return Result.success(assignments);
    } catch (error) {
      return Result.error({ error: [ErrorCode.INTERNAL_SERVER_ERROR], errorCode: HttpStatus.INTERNAL_SERVER_ERROR });
    }
  }

  async getEventsForTerminal(terminalId: string) {
    const Result = createResultClass<TerminalEvent[], string[]>();
    try {
      const assignments = await this.terminalEventRepo.find({
        where: { terminalId },
        relations: ['event'],
        order: { assignedAt: 'DESC' },
      });
      return Result.success(assignments);
    } catch (error) {
      return Result.error({ error: [ErrorCode.INTERNAL_SERVER_ERROR], errorCode: HttpStatus.INTERNAL_SERVER_ERROR });
    }
  }
}
