import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';

import { ApiTenantHeader } from 'src/utils/decorators/tenant-header.decorator';
import { Role, Roles } from 'src/utils/decorators/roles.decorator';
import { UserId } from 'src/utils/decorators/user.decorator';
import { EventService } from './event.service';
import { CreateEventDTO } from './dto/create-event.dto';
import { UpdateEventDTO } from './dto/update-event.dto';
import { AssignTerminalDTO } from './dto/assign-terminal.dto';

@ApiBearerAuth()
@ApiTenantHeader()
@Controller('events')
export class EventController {
  constructor(private readonly eventService: EventService) {}

  @Post()
  @Role([Roles.SuperAdmin])
  create(@Body() dto: CreateEventDTO) {
    return this.eventService.create(dto);
  }

  @Get()
  @Role([Roles.SuperAdmin])
  findAll() {
    return this.eventService.getAll();
  }

  @Get(':id')
  @Role([Roles.SuperAdmin])
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.eventService.getById(id);
  }

  @Patch(':id')
  @Role([Roles.SuperAdmin])
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateEventDTO) {
    return this.eventService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Role([Roles.SuperAdmin])
  delete(@Param('id', ParseUUIDPipe) id: string) {
    return this.eventService.delete(id);
  }

  @Get(':eventId/terminals')
  @Role([Roles.Manager, Roles.Owner, Roles.SuperAdmin])
  getTerminals(@Param('eventId', ParseUUIDPipe) eventId: string) {
    return this.eventService.getTerminalsForEvent(eventId);
  }

  @Post(':eventId/terminals')
  @Role([Roles.Manager, Roles.Owner, Roles.SuperAdmin])
  assignTerminal(
    @Param('eventId', ParseUUIDPipe) eventId: string,
    @Body() dto: AssignTerminalDTO,
    @UserId() userId: string,
  ) {
    return this.eventService.assignTerminal(eventId, dto.terminalId, userId);
  }

  @Delete(':eventId/terminals/:terminalId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Role([Roles.Manager, Roles.Owner, Roles.SuperAdmin])
  removeTerminal(
    @Param('eventId', ParseUUIDPipe) eventId: string,
    @Param('terminalId', ParseUUIDPipe) terminalId: string,
  ) {
    return this.eventService.removeTerminal(eventId, terminalId);
  }
}
