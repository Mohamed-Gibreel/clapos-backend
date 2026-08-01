import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';

import { ApiTenantHeader } from 'src/utils/decorators/tenant-header.decorator';
import { Role, Roles } from 'src/utils/decorators/roles.decorator';
import { CategoryService } from './category.service';
import { CreateCategoryDTO } from './dto/create-category.dto';
import { UpdateCategoryDTO } from './dto/update-category.dto';

@ApiBearerAuth()
@ApiTenantHeader()
@Controller('categories')
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  @Post()
  @Role([Roles.Manager, Roles.Owner])
  create(@Body() dto: CreateCategoryDTO) {
    return this.categoryService.create(dto);
  }

  @Get()
  @Role([Roles.Cashier, Roles.Manager, Roles.Owner])
  findAll() {
    return this.categoryService.getAll();
  }

  @Get(':id')
  @Role([Roles.Cashier, Roles.Manager, Roles.Owner])
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.categoryService.getById(id);
  }

  @Patch(':id')
  @Role([Roles.Manager, Roles.Owner])
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateCategoryDTO) {
    return this.categoryService.update(id, dto);
  }

  @Delete(':id')
  @Role([Roles.Manager, Roles.Owner])
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.categoryService.remove(id);
  }
}
