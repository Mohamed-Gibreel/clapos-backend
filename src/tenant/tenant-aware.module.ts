import { DataSource, ObjectLiteral, Repository } from 'typeorm';
import { DynamicModule, Module, Scope } from '@nestjs/common';
import { TenantContextService } from './tenant-context.service';

import { DeepPartial, UpdateResult } from 'typeorm';
import { TenantModule } from './tenant.module';

const createTenantScopedRepository = <T extends ObjectLiteral>(
  baseRepo: Repository<T>,
  tenantContext: TenantContextService,
): Repository<T> => {
  return baseRepo.extend({
    get tenantId(): string {
      return tenantContext.getTenantId();
    },

    async find(options: any = {}): Promise<T[]> {
      options.where = { ...options.where, tenant: { id: this.tenantId } };
      return baseRepo.find(options);
    },

    async findOne(options: any): Promise<T | null> {
      options.where = { ...options.where, tenant: { id: this.tenantId } };
      return baseRepo.findOne(options);
    },

    async saveWithTenant(entity: Partial<T>): Promise<T> {
      // Most tenant-scoped entities only declare `@ManyToOne(() => Tenant) tenant`
      // (no plain `tenantId` column TypeORM can bind a flat property to), so
      // setting `tenantId` alone left the join column NULL on every create —
      // new rows silently vanished from every tenant-scoped list (`find`/
      // `findOne` above filter via the `tenant: { id }` relation, which is why
      // reads looked fine while writes were broken). Setting the relation
      // itself is what TypeORM needs to populate the join column. `tenantId`
      // is kept too for the entities (e.g. `FeatureFlag`) that also declare an
      // explicit `tenantId` column alongside the relation.
      const withTenant = {
        ...entity,
        tenantId: this.tenantId,
        tenant: { id: this.tenantId },
      } as unknown as DeepPartial<T>;

      return baseRepo.save(withTenant);
    },

    async softDeleteWithTenant(id: string): Promise<UpdateResult> {
      return baseRepo.softDelete({ id, tenant: { id: this.tenantId } } as any);
    },
  });
};

@Module({})
export class TenantAwareModule {
  static forEntities(entities: Function[]): DynamicModule {
    const providers = entities.map((entity) => ({
      provide: `TenantRepository_${entity.name}`,
      scope: Scope.REQUEST,
      inject: [DataSource, TenantContextService],
      useFactory: (
        dataSource: DataSource,
        tenantContext: TenantContextService,
      ) => {
        const baseRepo = dataSource.getRepository(entity);
        return createTenantScopedRepository(baseRepo, tenantContext);
      },
    }));

    return {
      module: TenantAwareModule,
      imports: [TenantModule], // <== Important!
      providers,
      exports: providers,
    };
  }
}
