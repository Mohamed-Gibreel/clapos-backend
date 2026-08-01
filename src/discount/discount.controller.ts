import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, ParseUUIDPipe, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';

import { ApiTenantHeader } from 'src/utils/decorators/tenant-header.decorator';
import { Role, Roles } from 'src/utils/decorators/roles.decorator';
import { DiscountService } from './discount.service';
import { CreateDiscountDTO } from './dto/create-discount.dto';
import { UpdateDiscountDTO } from './dto/update-discount.dto';
import { ValidateDiscountDTO } from './dto/validate-discount.dto';

@ApiBearerAuth()
@ApiTenantHeader()
@Controller('discounts')
export class DiscountController {
  constructor(private readonly discountService: DiscountService) {}

  @Post()
  @Role([Roles.Manager, Roles.Owner])
  create(@Body() dto: CreateDiscountDTO) {
    return this.discountService.create(dto);
  }

  @Get()
  @Role([Roles.Cashier, Roles.Manager, Roles.Owner])
  findAll() {
    return this.discountService.getAll();
  }

  @Post('validate')
  @HttpCode(HttpStatus.OK)
  @Role([Roles.Cashier, Roles.Manager, Roles.Owner])
  validate(@Body() dto: ValidateDiscountDTO) {
    return this.discountService.validate(dto.code);
  }

  @Patch(':id')
  @Role([Roles.Manager, Roles.Owner])
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateDiscountDTO) {
    return this.discountService.update(id, dto);
  }

  @Delete(':id')
  @Role([Roles.Manager, Roles.Owner])
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.discountService.remove(id);
  }
}
