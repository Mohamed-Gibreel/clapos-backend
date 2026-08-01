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
import { ProductService } from './product.service';
import { CreateProductDTO } from './dto/create-product.dto';
import { UpdateProductDTO } from './dto/update-product.dto';

@ApiBearerAuth()
@ApiTenantHeader()
@Controller('products')
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @Post()
  @Role([Roles.Admin])
  create(@Body() dto: CreateProductDTO) {
    return this.productService.create(dto);
  }

  @Get()
  @Role([Roles.Admin, Roles.User])
  findAll(@Query('status') status?: string) {
    return this.productService.getAll({ status });
  }

  @Get(':id')
  @Role([Roles.Admin, Roles.User])
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.productService.getById(id);
  }

  @Patch(':id')
  @Role([Roles.Admin])
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateProductDTO) {
    return this.productService.update(id, dto);
  }

  @Delete(':id')
  @Role([Roles.Admin])
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.productService.remove(id);
  }
}
