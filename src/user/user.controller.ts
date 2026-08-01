import {
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Controller,
  ParseUUIDPipe,
} from '@nestjs/common';

import { UserService } from './user.service';

import { UpdateUserDTO } from './dto/update-user.dto';
import { CreateUserDTO } from './dto/create-user.dto';
import { ApiBearerAuth } from '@nestjs/swagger';
import { ApiTenantHeader } from 'src/utils/decorators/tenant-header.decorator';
import { Role, Roles } from 'src/utils/decorators/roles.decorator';
import { TenantId } from 'src/utils/decorators/tenant.decorator';

@ApiBearerAuth()
@ApiTenantHeader()
@Controller('user')
@Role([Roles.Manager, Roles.Owner])
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post()
  async create(@Body() createUserDto: CreateUserDTO) {
    return await this.userService.create(createUserDto);
  }

  @Get()
  async findAll(@TenantId() tenantId: string) {
    return await this.userService.getAll(tenantId);
  }

  @Get(':id')
  async findOne(@Param('id', ParseUUIDPipe) id: string, @TenantId() tenantId: string) {
    return await this.userService.getById(id, tenantId);
  }

  @Patch(':id')
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateUserDto: UpdateUserDTO,
    @TenantId() tenantId: string,
  ) {
    return await this.userService.update(id, updateUserDto, tenantId);
  }

  @Delete(':id')
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    return await this.userService.deleteUserById(id);
  }
}
