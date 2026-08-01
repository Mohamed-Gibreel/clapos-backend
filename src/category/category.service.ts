import { HttpStatus, Injectable } from '@nestjs/common';
import { FindOneOptions } from 'typeorm';

import { createResultClass } from 'src/utils/result';
import { convertToInstance } from 'src/utils/dto-validator';
import { TenantRepository } from 'src/utils/decorators/tenant-repository.decorator';
import { TenantScopedRepository } from 'src/tenant/tenant-scoped.repository';
import { ErrorCode } from 'src/utils/error-codes';

import { Category } from './entities/category.entity';
import { CreateCategoryDTO } from './dto/create-category.dto';
import { UpdateCategoryDTO } from './dto/update-category.dto';

@Injectable()
export class CategoryService {
  constructor(
    @TenantRepository(Category)
    private readonly categoryRepo: TenantScopedRepository<Category>,
  ) {}

  async create(dto: CreateCategoryDTO) {
    const Result = createResultClass<Category, string[]>();
    try {
      const isValid = convertToInstance(CreateCategoryDTO, dto);
      if (!isValid.isSuccess) {
        return Result.error({ error: isValid.error, errorCode: HttpStatus.BAD_REQUEST });
      }

      const category = this.categoryRepo.create();
      category.name = isValid.value.name;
      category.icon = isValid.value.icon;
      category.sortOrder = isValid.value.sortOrder ?? 0;
      category.isActive = isValid.value.isActive ?? true;

      const saved = await this.categoryRepo.saveWithTenant(category);
      return Result.success(saved);
    } catch (error) {
      if (error?.code === '23505') {
        return Result.error({ error: [ErrorCode.CATEGORY_NAME_CONFLICT], errorCode: HttpStatus.CONFLICT });
      }
      return Result.error({ error: [ErrorCode.INTERNAL_SERVER_ERROR], errorCode: HttpStatus.INTERNAL_SERVER_ERROR });
    }
  }

  async getAll() {
    const Result = createResultClass<Category[], string[]>();
    try {
      const categories = await this.categoryRepo.find({ order: { sortOrder: 'ASC' } });
      return Result.success(categories);
    } catch (error) {
      return Result.error({ error: [ErrorCode.INTERNAL_SERVER_ERROR], errorCode: HttpStatus.INTERNAL_SERVER_ERROR });
    }
  }

  async getById(id: string) {
    const Result = createResultClass<Category, string[]>();
    try {
      const res = await this.findOne({ where: { id } });
      if (!res.isSuccess) return Result.error({ error: res.error, errorCode: res.errorCode });
      return Result.success(res.value);
    } catch (error) {
      return Result.error({ error: [ErrorCode.INTERNAL_SERVER_ERROR], errorCode: HttpStatus.INTERNAL_SERVER_ERROR });
    }
  }

  async update(id: string, dto: UpdateCategoryDTO) {
    const Result = createResultClass<Category, string[]>();
    try {
      const isValid = convertToInstance(UpdateCategoryDTO, dto);
      if (!isValid.isSuccess) {
        return Result.error({ error: isValid.error, errorCode: HttpStatus.BAD_REQUEST });
      }

      const existing = await this.findOne({ where: { id } });
      if (!existing.isSuccess) {
        return Result.error({ error: existing.error, errorCode: existing.errorCode });
      }

      const merged = this.categoryRepo.merge(existing.value, isValid.value);
      const updateRes = await this.categoryRepo.update({ id }, merged);

      if ((updateRes.affected ?? 0) <= 0) {
        return Result.error({ error: [ErrorCode.CATEGORY_UPDATE_FAILED], errorCode: HttpStatus.UNPROCESSABLE_ENTITY });
      }
      return Result.success(merged);
    } catch (error) {
      if (error?.code === '23505') {
        return Result.error({ error: [ErrorCode.CATEGORY_NAME_CONFLICT], errorCode: HttpStatus.CONFLICT });
      }
      return Result.error({ error: [ErrorCode.INTERNAL_SERVER_ERROR], errorCode: HttpStatus.INTERNAL_SERVER_ERROR });
    }
  }

  async remove(id: string) {
    const Result = createResultClass<string, string[]>();
    try {
      const existing = await this.findOne({ where: { id } });
      if (!existing.isSuccess) {
        return Result.error({ error: existing.error, errorCode: existing.errorCode });
      }

      await this.categoryRepo.softDeleteWithTenant(id);
      return Result.success('Category deleted successfully');
    } catch (error) {
      return Result.error({ error: [ErrorCode.INTERNAL_SERVER_ERROR], errorCode: HttpStatus.INTERNAL_SERVER_ERROR });
    }
  }

  async findOne(options: FindOneOptions<Category>) {
    const Result = createResultClass<Category, string[]>();
    try {
      const category = await this.categoryRepo.findOne(options);
      if (!category) {
        return Result.error({ error: [ErrorCode.CATEGORY_NOT_FOUND], errorCode: HttpStatus.NOT_FOUND });
      }
      return Result.success(category);
    } catch (error) {
      return Result.error({ error: [ErrorCode.INTERNAL_SERVER_ERROR], errorCode: HttpStatus.INTERNAL_SERVER_ERROR });
    }
  }
}
