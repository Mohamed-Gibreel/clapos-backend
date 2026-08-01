import { HttpStatus, Injectable } from '@nestjs/common';
import { IsNull, MoreThan } from 'typeorm';

import { createResultClass } from 'src/utils/result';
import { TenantRepository } from 'src/utils/decorators/tenant-repository.decorator';
import { TenantScopedRepository } from 'src/tenant/tenant-scoped.repository';
import { ErrorCode } from 'src/utils/error-codes';
import { Product } from 'src/product/entities/product.entity';
import { Category } from 'src/category/entities/category.entity';

@Injectable()
export class SyncService {
  constructor(
    @TenantRepository(Product)
    private readonly productRepo: TenantScopedRepository<Product>,
    @TenantRepository(Category)
    private readonly categoryRepo: TenantScopedRepository<Category>,
  ) {}

  async getCatalog(updatedAfter?: string) {
    const Result = createResultClass<any, string[]>();
    try {
      const since = updatedAfter ? new Date(updatedAfter) : undefined;

      const { liveProducts, deletedProductIds } = await this.fetchProducts(since);
      const { liveCategories, deletedCategoryIds } = await this.fetchCategories(since);

      return Result.success({
        products: liveProducts,
        deletedProductIds,
        categories: liveCategories,
        deletedCategoryIds,
        taxConfig: null,    // Phase 2
        featureFlags: null, // Phase 2
        syncedAt: new Date().toISOString(),
      });
    } catch (error) {
      return Result.error({ error: [ErrorCode.INTERNAL_SERVER_ERROR], errorCode: HttpStatus.INTERNAL_SERVER_ERROR });
    }
  }

  private async fetchProducts(since?: Date) {
    const liveQuery: any = { deletedAt: IsNull() };
    if (since) liveQuery.updatedAt = MoreThan(since);

    const liveProducts = await this.productRepo.find({
      where: liveQuery,
      relations: ['category', 'variationGroups', 'variationGroups.options'],
    });

    let deletedProductIds: string[] = [];
    if (since) {
      const deleted = await this.productRepo.find({
        where: { deletedAt: MoreThan(since) },
        withDeleted: true,
        select: ['id'],
      });
      deletedProductIds = deleted.map((p) => p.id);
    }

    return { liveProducts, deletedProductIds };
  }

  private async fetchCategories(since?: Date) {
    const liveQuery: any = { deletedAt: IsNull() };
    if (since) liveQuery.updatedAt = MoreThan(since);

    const liveCategories = await this.categoryRepo.find({
      where: liveQuery,
      order: { sortOrder: 'ASC' },
    });

    let deletedCategoryIds: string[] = [];
    if (since) {
      const deleted = await this.categoryRepo.find({
        where: { deletedAt: MoreThan(since) },
        withDeleted: true,
        select: ['id'],
      });
      deletedCategoryIds = deleted.map((c) => c.id);
    }

    return { liveCategories, deletedCategoryIds };
  }
}
