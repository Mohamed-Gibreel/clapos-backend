import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';

import { ApiTenantHeader } from 'src/utils/decorators/tenant-header.decorator';
import { Role, Roles } from 'src/utils/decorators/roles.decorator';
import { FeatureFlagService } from './feature-flag.service';
import { CreateFeatureFlagDTO } from './dto/create-feature-flag.dto';
import { UpdateFeatureFlagDTO } from './dto/update-feature-flag.dto';

@ApiBearerAuth()
@ApiTenantHeader()
@Controller('feature-flags')
export class FeatureFlagController {
  constructor(private readonly featureFlagService: FeatureFlagService) {}

  @Post()
  @Role([Roles.Owner])
  create(@Body() dto: CreateFeatureFlagDTO) {
    return this.featureFlagService.create(dto);
  }

  @Get()
  @Role([Roles.Cashier, Roles.Manager, Roles.Owner])
  findAll() {
    return this.featureFlagService.getAll();
  }

  @Patch(':id')
  @Role([Roles.Owner])
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateFeatureFlagDTO) {
    return this.featureFlagService.update(id, dto);
  }
}
