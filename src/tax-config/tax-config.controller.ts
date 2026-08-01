import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';

import { ApiTenantHeader } from 'src/utils/decorators/tenant-header.decorator';
import { Role, Roles } from 'src/utils/decorators/roles.decorator';
import { TaxConfigService } from './tax-config.service';
import { CreateTaxConfigDTO } from './dto/create-tax-config.dto';
import { UpdateTaxConfigDTO } from './dto/update-tax-config.dto';

@ApiBearerAuth()
@ApiTenantHeader()
@Controller('tax-config')
export class TaxConfigController {
  constructor(private readonly taxConfigService: TaxConfigService) {}

  @Post()
  @Role([Roles.Manager, Roles.Owner])
  create(@Body() dto: CreateTaxConfigDTO) {
    return this.taxConfigService.create(dto);
  }

  @Get()
  @Role([Roles.Manager, Roles.Owner])
  findAll() {
    return this.taxConfigService.getAll();
  }

  @Patch(':id')
  @Role([Roles.Manager, Roles.Owner])
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateTaxConfigDTO) {
    return this.taxConfigService.update(id, dto);
  }
}
