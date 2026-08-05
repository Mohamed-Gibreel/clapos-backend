import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';

import { ApiTenantHeader } from 'src/utils/decorators/tenant-header.decorator';
import { Role, Roles } from 'src/utils/decorators/roles.decorator';
import { FolderService } from './folder.service';
import { CreateFolderDTO } from './dto/create-folder.dto';
import { UpdateFolderDTO } from './dto/update-folder.dto';

@ApiBearerAuth()
@ApiTenantHeader()
@Controller('folders')
export class FolderController {
  constructor(private readonly folderService: FolderService) {}

  @Post()
  @Role([Roles.Manager, Roles.Owner])
  create(@Body() dto: CreateFolderDTO) {
    return this.folderService.create(dto);
  }

  // Folders directly under ?parentId=, or root-level folders when omitted.
  @Get()
  @Role([Roles.Cashier, Roles.Manager, Roles.Owner])
  findAll(@Query('parentId', new ParseUUIDPipe({ optional: true })) parentId?: string) {
    return this.folderService.getAll(parentId);
  }

  @Get(':id')
  @Role([Roles.Cashier, Roles.Manager, Roles.Owner])
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.folderService.getById(id);
  }

  @Patch(':id')
  @Role([Roles.Manager, Roles.Owner])
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateFolderDTO) {
    return this.folderService.update(id, dto);
  }

  @Delete(':id')
  @Role([Roles.Manager, Roles.Owner])
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.folderService.remove(id);
  }
}
