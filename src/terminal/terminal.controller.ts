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
import { CreateTerminalDTO } from './dto/create-terminal.dto';
import { UpdateTerminalDTO } from './dto/update-terminal.dto';

@ApiBearerAuth()
@ApiTenantHeader()
@Controller('terminals')
@Role([Roles.Admin])
export class TerminalController {
  constructor(private readonly terminalService: TerminalService) {}

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
}
