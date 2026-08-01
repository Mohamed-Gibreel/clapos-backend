import {
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Controller,
  ParseIntPipe,
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
  async findOne(@Param('id', ParseIntPipe) id: number) {
    // TODO: Implement
    return false;
  }

  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateUserDto: UpdateUserDTO,
  ) {
    // TODO: Implement
    return false;
  }

  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number) {
    return await this.userService.deleteUserById(id);
  }
}
