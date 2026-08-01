import { HttpStatus, Injectable } from '@nestjs/common';
import { IsNull, MoreThan } from 'typeorm';
import { randomUUID } from 'crypto';

import { createResultClass } from 'src/utils/result';
import { TenantRepository } from 'src/utils/decorators/tenant-repository.decorator';
import { TenantScopedRepository } from 'src/tenant/tenant-scoped.repository';
import { ErrorCode } from 'src/utils/error-codes';
import { Product } from 'src/product/entities/product.entity';
import { Category } from 'src/category/entities/category.entity';
import { Customer } from 'src/customer/entities/customer.entity';
import { TaxConfig } from 'src/tax-config/entities/tax-config.entity';
import { FeatureFlag } from 'src/feature-flag/entities/feature-flag.entity';

import { SyncCustomersDTO } from './dto/sync-customers.dto';

@Injectable()
export class SyncService {
  constructor(
    @TenantRepository(Product)
    private readonly productRepo: TenantScopedRepository<Product>,
    @TenantRepository(Category)
    private readonly categoryRepo: TenantScopedRepository<Category>,
    @TenantRepository(Customer)
    private readonly customerRepo: TenantScopedRepository<Customer>,
    @TenantRepository(TaxConfig)
    private readonly taxConfigRepo: TenantScopedRepository<TaxConfig>,
    @TenantRepository(FeatureFlag)
    private readonly featureFlagRepo: TenantScopedRepository<FeatureFlag>,
  ) {}

  async getCatalog(updatedAfter?: string) {
    const Result = createResultClass<any, string[]>();
    try {
      const since = updatedAfter ? new Date(updatedAfter) : undefined;

      const { liveProducts, deletedProductIds } = await this.fetchProducts(since);
      const { liveCategories, deletedCategoryIds } = await this.fetchCategories(since);

      const activeTaxConfig = await this.taxConfigRepo.findOne({ where: { isActive: true } });
      const featureFlags = await this.fetchFeatureFlags();

      return Result.success({
        products: liveProducts,
        deletedProductIds,
        categories: liveCategories,
        deletedCategoryIds,
        taxConfig: activeTaxConfig ?? null,
        featureFlags,
        syncedAt: new Date().toISOString(),
      });
    } catch (error) {
      return Result.error({ error: [ErrorCode.INTERNAL_SERVER_ERROR], errorCode: HttpStatus.INTERNAL_SERVER_ERROR });
    }
  }

  async syncCustomers(dto: SyncCustomersDTO) {
    type SyncResult = { clientId: string; serverId: string | null; status: string };
    const Result = createResultClass<{ results: SyncResult[] }, string[]>();
    const results: SyncResult[] = [];

    for (const customerDto of dto.customers) {
      const clientId = customerDto.clientId ?? randomUUID();
      try {
        // Idempotency check by clientId
        const existingByClientId = await this.customerRepo.findOne({ where: { clientId } });
        if (existingByClientId) {
          results.push({ clientId, serverId: existingByClientId.id, status: 'already_exists' });
          continue;
        }

        // Duplicate phone check
        if (customerDto.phone) {
          const existingByPhone = await this.customerRepo.findOne({ where: { phone: customerDto.phone } });
          if (existingByPhone) {
            results.push({ clientId, serverId: existingByPhone.id, status: 'duplicate_phone' });
            continue;
          }
        }

        const customer = this.customerRepo.create();
        customer.clientId = clientId;
        customer.firstName = customerDto.firstName;
        customer.lastName = customerDto.lastName;
        customer.gender = customerDto.gender;
        customer.phone = customerDto.phone;
        customer.email = customerDto.email;
        customer.address = customerDto.address;
        customer.birthDate = customerDto.birthDate;
        customer.isMember = customerDto.isMember ?? false;
        customer.syncedAt = new Date();

        const saved = await this.customerRepo.saveWithTenant(customer);
        results.push({ clientId, serverId: saved.id, status: 'created' });
      } catch (error) {
        results.push({ clientId, serverId: null, status: 'failed' });
      }
    }

    return Result.success({ results });
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

  private async fetchFeatureFlags(): Promise<Record<string, boolean>> {
    const flags = await this.featureFlagRepo.find({});
    return flags.reduce<Record<string, boolean>>((acc, f) => {
      acc[f.key] = f.enabled;
      return acc;
    }, {});
  }
}
