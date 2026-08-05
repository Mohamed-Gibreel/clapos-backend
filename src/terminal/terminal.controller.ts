import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';

import { ApiTenantHeader } from 'src/utils/decorators/tenant-header.decorator';
import { Role, Roles } from 'src/utils/decorators/roles.decorator';
import { TerminalService } from './terminal.service';
import { EventService } from 'src/event/event.service';
import { CreateTerminalDTO } from './dto/create-terminal.dto';
import { UpdateTerminalDTO } from './dto/update-terminal.dto';

@ApiBearerAuth()
@ApiTenantHeader()
@Controller('terminals')
@Role([Roles.Manager, Roles.Owner])
export class TerminalController {
  constructor(
    private readonly terminalService: TerminalService,
    private readonly eventService: EventService,
  ) {}

  @Post()
  create(@Body() dto: CreateTerminalDTO) {
    return this.terminalService.create(dto);
  }

  @Get()
  findAll() {
    return this.terminalService.getAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.terminalService.getById(id);
  }

  @Patch(':id')
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateTerminalDTO) {
    return this.terminalService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.terminalService.remove(id);
  }

  @Post(':id/rotate-token')
  rotateToken(@Param('id', ParseUUIDPipe) id: string) {
    return this.terminalService.rotateToken(id);
  }

  @Get(':id/events')
  getEvents(@Param('id', ParseUUIDPipe) id: string) {
    return this.eventService.getEventsForTerminal(id);
  }
}
