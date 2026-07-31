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
      const withTenant = {
        ...entity,
        tenantId: this.tenantId,
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
