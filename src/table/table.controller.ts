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
import { TableService } from './table.service';
import { CreateTableDTO } from './dto/create-table.dto';
import { UpdateTableDTO } from './dto/update-table.dto';
import { UpdateTableStatusDTO } from './dto/update-table-status.dto';

@ApiBearerAuth()
@ApiTenantHeader()
@Controller('tables')
export class TableController {
  constructor(private readonly tableService: TableService) {}

  @Post()
  @Role([Roles.Manager, Roles.Owner])
  create(@Body() dto: CreateTableDTO) {
    return this.tableService.create(dto);
  }

  @Get()
  @Role([Roles.Cashier, Roles.Manager, Roles.Owner])
  findAll() {
    return this.tableService.getAll();
  }

  @Get(':id')
  @Role([Roles.Cashier, Roles.Manager, Roles.Owner])
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.tableService.getById(id);
  }

  @Patch(':id')
  @Role([Roles.Manager, Roles.Owner])
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateTableDTO) {
    return this.tableService.update(id, dto);
  }

  @Patch(':id/status')
  @Role([Roles.Cashier, Roles.Manager, Roles.Owner])
  updateStatus(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateTableStatusDTO) {
    return this.tableService.updateStatus(id, dto.status);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Role([Roles.Manager, Roles.Owner])
  delete(@Param('id', ParseUUIDPipe) id: string) {
    return this.tableService.delete(id);
  }
}
