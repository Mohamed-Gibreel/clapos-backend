import { HttpStatus, Injectable } from '@nestjs/common';
import { FindManyOptions, FindOneOptions, FindOptionsWhere } from 'typeorm';

import { createResultClass } from 'src/utils/result';
import { convertToInstance } from 'src/utils/dto-validator';
import { TenantRepository } from 'src/utils/decorators/tenant-repository.decorator';
import { TenantScopedRepository } from 'src/tenant/tenant-scoped.repository';
import { ErrorCode } from 'src/utils/error-codes';
import { isUniqueViolation } from 'src/utils/db-errors';
import { CategoryService } from 'src/category/category.service';
import { Category } from 'src/category/entities/category.entity';
import { MediaService } from 'src/media/media.service';
import { Media } from 'src/media/entities/media.entity';

import { Product, ProductStatus } from './entities/product.entity';
import { VariationGroup } from './entities/variation-group.entity';
import { VariationOption } from './entities/variation-option.entity';
import { CreateProductDTO } from './dto/create-product.dto';
import {
  UpdateProductDTO,
  UpdateVariationGroupDTO,
} from './dto/update-product.dto';

@Injectable()
export class ProductService {
  constructor(
    @TenantRepository(Product)
    private readonly productRepo: TenantScopedRepository<Product>,
    private readonly categoryService: CategoryService,
    private readonly mediaService: MediaService,
  ) {}

  async create(dto: CreateProductDTO) {
    const Result = createResultClass<Product, string[]>();
    try {
      const isValid = convertToInstance(CreateProductDTO, dto);
      if (!isValid.isSuccess) {
        return Result.error({
          error: isValid.error,
          errorCode: HttpStatus.BAD_REQUEST,
        });
      }

      const v = isValid.value;

      // Resolve category if provided
      let category: Category | null = null;
      if (v.categoryId) {
        const catRes = await this.categoryService.findOne({
          where: { id: v.categoryId },
        });
        if (!catRes.isSuccess) {
          return Result.error({
            error: [ErrorCode.CATEGORY_NOT_FOUND],
            errorCode: HttpStatus.BAD_REQUEST,
          });
        }
        category = catRes.value;
      }

      // Resolve image if provided
      let image: Media | null = null;
      if (v.imageId) {
        const mediaRes = await this.mediaService.getById(v.imageId);
        if (!mediaRes.isSuccess) {
          return Result.error({
            error: mediaRes.error,
            errorCode: HttpStatus.BAD_REQUEST,
          });
        }
        image = mediaRes.value;
      }

      const product = this.productRepo.create();
      product.name = v.name;
      product.description = v.description;
      product.sku = v.sku;
      product.price = v.price;
      product.status = v.status ?? ProductStatus.Active;
      product.category = category;
      product.image = image;

      // Build variation groups
      if (v.variationGroups?.length) {
        product.variationGroups = v.variationGroups.map((g) => {
          const group = new VariationGroup();
          group.name = g.name;
          group.required = g.required ?? false;
          group.maxSelect = g.maxSelect ?? 1;
          group.sortOrder = g.sortOrder ?? 0;
          group.options = (g.options ?? []).map((o) => {
            const opt = new VariationOption();
            opt.name = o.name;
            opt.priceModifier = o.priceModifier ?? 0;
            opt.sortOrder = o.sortOrder ?? 0;
            return opt;
          });
          return group;
        });
      }

      const saved = await this.productRepo.saveWithTenant(product);
      return Result.success(saved);
    } catch (error) {
      if (isUniqueViolation(error)) {
        return Result.error({
          error: [ErrorCode.PRODUCT_SKU_CONFLICT],
          errorCode: HttpStatus.CONFLICT,
        });
      }
      return Result.error({
        error: [ErrorCode.INTERNAL_SERVER_ERROR],
        errorCode: HttpStatus.INTERNAL_SERVER_ERROR,
      });
    }
  }

  async getAll(options: { status?: string } = {}) {
    const Result = createResultClass<Product[], string[]>();
    try {
      const where: FindOptionsWhere<Product> = {};
      if (options.status) where.status = options.status as ProductStatus;

      const products = await this.productRepo.find({
        where,
        relations: [
          'category',
          'image',
          'variationGroups',
          'variationGroups.options',
        ],
        order: { name: 'ASC' },
      });
      return Result.success(products);
    } catch (error) {
      return Result.error({
        error: [ErrorCode.INTERNAL_SERVER_ERROR],
        errorCode: HttpStatus.INTERNAL_SERVER_ERROR,
      });
    }
  }

  async getById(id: string) {
    const Result = createResultClass<Product, string[]>();
    try {
      const res = await this.findOne({
        where: { id },
        relations: [
          'category',
          'image',
          'variationGroups',
          'variationGroups.options',
        ],
      });
      if (!res.isSuccess)
        return Result.error({ error: res.error, errorCode: res.errorCode });
      return Result.success(res.value);
    } catch (error) {
      return Result.error({
        error: [ErrorCode.INTERNAL_SERVER_ERROR],
        errorCode: HttpStatus.INTERNAL_SERVER_ERROR,
      });
    }
  }

  async update(id: string, dto: UpdateProductDTO) {
    const Result = createResultClass<Product, string[]>();
    try {
      const isValid = convertToInstance(UpdateProductDTO, dto);
      if (!isValid.isSuccess) {
        return Result.error({
          error: isValid.error,
          errorCode: HttpStatus.BAD_REQUEST,
        });
      }

      const existing = await this.findOne({
        where: { id },
        relations: ['variationGroups', 'variationGroups.options'],
      });
      if (!existing.isSuccess) {
        return Result.error({
          error: existing.error,
          errorCode: existing.errorCode,
        });
      }

      const { categoryId, imageId, variationGroups, ...rest } = isValid.value;

      if (categoryId !== undefined) {
        if (categoryId === null) {
          existing.value.category = null;
        } else {
          const catRes = await this.categoryService.findOne({
            where: { id: categoryId },
          });
          if (!catRes.isSuccess) {
            return Result.error({
              error: [ErrorCode.CATEGORY_NOT_FOUND],
              errorCode: HttpStatus.BAD_REQUEST,
            });
          }
          existing.value.category = catRes.value;
        }
      }

      if (imageId !== undefined) {
        if (imageId === null) {
          existing.value.image = null;
        } else {
          const mediaRes = await this.mediaService.getById(imageId);
          if (!mediaRes.isSuccess) {
            return Result.error({
              error: mediaRes.error,
              errorCode: HttpStatus.BAD_REQUEST,
            });
          }
          existing.value.image = mediaRes.value;
        }
      }

      if (variationGroups !== undefined) {
        const mergedGroups = this.mergeVariationGroups(
          existing.value.variationGroups ?? [],
          variationGroups,
        );
        if (!mergedGroups.isSuccess) {
          return Result.error({
            error: mergedGroups.error,
            errorCode: mergedGroups.errorCode,
          });
        }
        existing.value.variationGroups = mergedGroups.value;
      }

      const merged = this.productRepo.merge(existing.value, rest);
      await this.productRepo.save(merged);
      return Result.success(merged);
    } catch (error) {
      if (isUniqueViolation(error)) {
        return Result.error({
          error: [ErrorCode.PRODUCT_SKU_CONFLICT],
          errorCode: HttpStatus.CONFLICT,
        });
      }
      return Result.error({
        error: [ErrorCode.INTERNAL_SERVER_ERROR],
        errorCode: HttpStatus.INTERNAL_SERVER_ERROR,
      });
    }
  }

  private mergeVariationGroups(
    existingGroups: VariationGroup[],
    incomingGroups: UpdateVariationGroupDTO[],
  ) {
    const Result = createResultClass<VariationGroup[], string[]>();
    const existingGroupsById = new Map(existingGroups.map((g) => [g.id, g]));

    const mergedGroups: VariationGroup[] = [];
    for (const g of incomingGroups) {
      const existingGroup = g.id ? existingGroupsById.get(g.id) : undefined;
      if (g.id && !existingGroup) {
        return Result.error({
          error: [ErrorCode.VARIATION_GROUP_NOT_FOUND],
          errorCode: HttpStatus.BAD_REQUEST,
        });
      }
      const group = existingGroup ?? new VariationGroup();
      group.name = g.name;
      group.required = g.required ?? false;
      group.maxSelect = g.maxSelect ?? 1;
      group.sortOrder = g.sortOrder ?? 0;

      const existingOptionsById = new Map(
        (existingGroup?.options ?? []).map((o) => [o.id, o]),
      );
      const mergedOptions: VariationOption[] = [];
      for (const o of g.options) {
        const existingOption = o.id ? existingOptionsById.get(o.id) : undefined;
        if (o.id && !existingOption) {
          return Result.error({
            error: [ErrorCode.VARIATION_OPTION_NOT_FOUND],
            errorCode: HttpStatus.BAD_REQUEST,
          });
        }
        const option = existingOption ?? new VariationOption();
        option.name = o.name;
        option.priceModifier = o.priceModifier ?? 0;
        option.sortOrder = o.sortOrder ?? 0;
        mergedOptions.push(option);
      }
      group.options = mergedOptions;
      mergedGroups.push(group);
    }

    return Result.success(mergedGroups);
  }

  async remove(id: string) {
    const Result = createResultClass<string, string[]>();
    try {
      const existing = await this.findOne({ where: { id } });
      if (!existing.isSuccess) {
        return Result.error({
          error: existing.error,
          errorCode: existing.errorCode,
        });
      }

      await this.productRepo.softDeleteWithTenant(id);
      return Result.success('Product deleted successfully');
    } catch (error) {
      return Result.error({
        error: [ErrorCode.INTERNAL_SERVER_ERROR],
        errorCode: HttpStatus.INTERNAL_SERVER_ERROR,
      });
    }
  }

  async findOne(options: FindOneOptions<Product>) {
    const Result = createResultClass<Product, string[]>();
    try {
      const product = await this.productRepo.findOne(options);
      if (!product) {
        return Result.error({
          error: [ErrorCode.PRODUCT_NOT_FOUND],
          errorCode: HttpStatus.NOT_FOUND,
        });
      }
      return Result.success(product);
    } catch (error) {
      return Result.error({
        error: [ErrorCode.INTERNAL_SERVER_ERROR],
        errorCode: HttpStatus.INTERNAL_SERVER_ERROR,
      });
    }
  }

  async find(options: FindManyOptions<Product>) {
    const Result = createResultClass<Product[], string[]>();
    try {
      const products = await this.productRepo.find(options);
      return Result.success(products);
    } catch (error) {
      return Result.error({
        error: [ErrorCode.INTERNAL_SERVER_ERROR],
        errorCode: HttpStatus.INTERNAL_SERVER_ERROR,
      });
    }
  }
}
