import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { RoleService } from './role.service';
import { CreateRoleDTO } from './dto/create-role.dto';
import { UpdateRoleDTO } from './dto/update-role.dto';
import { ApiBearerAuth } from '@nestjs/swagger';
import { Role, Roles } from 'src/utils/decorators/roles.decorator';
import { RoleGuard } from 'src/utils/guards/role.guard';
import { ApiTenantHeader } from 'src/utils/decorators/tenant-header.decorator';

@ApiBearerAuth()
@ApiTenantHeader()
@Controller('role')
@Role([Roles.SuperAdmin])
export class RoleController {
  constructor(private readonly roleService: RoleService) {}

  @Post()
  create(@Body() createRoleDto: CreateRoleDTO) {
    return this.roleService.create(createRoleDto);
  }

  @Get()
  @UseGuards(RoleGuard)
  findAll() {
    return this.roleService.getAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.roleService.getById(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateRoleDto: UpdateRoleDTO) {
    return this.roleService.update(+id, updateRoleDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.roleService.remove(+id);
  }
}
