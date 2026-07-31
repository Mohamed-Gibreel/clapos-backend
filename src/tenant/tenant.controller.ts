import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseUUIDPipe,
} from '@nestjs/common';
import { TenantService } from './tenant.service';
import { CreateTenantDTO } from './dto/create-tenant.dto';
import { UpdateTenantDTO } from './dto/update-tenant.dto';
import { Role, Roles } from 'src/utils/decorators/roles.decorator';
import { ApiBearerAuth } from '@nestjs/swagger';
import { ApiTenantHeader } from 'src/utils/decorators/tenant-header.decorator';

@ApiBearerAuth()
@ApiTenantHeader()
@Controller('tenant')
@Role([Roles.SuperAdmin])
export class TenantController {
  constructor(private readonly tenantService: TenantService) {}

  @Post()
  create(@Body() createTenantDto: CreateTenantDTO) {
    return this.tenantService.create(createTenantDto);
  }

  @Get()
  async findAll() {
    return await this.tenantService.getAll();
  }

  @Get(':id')
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return await this.tenantService.getById(id);
  }

  @Patch(':id')
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateTenantDto: UpdateTenantDTO,
  ) {
    return await this.tenantService.update(id, updateTenantDto);
  }

  @Delete(':id')
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    return await this.tenantService.remove(id);
  }
}
