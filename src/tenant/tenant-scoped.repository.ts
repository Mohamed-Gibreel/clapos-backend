import { DeepPartial, Repository, UpdateResult } from 'typeorm';
import { TenantContextService } from './tenant-context.service';
import { BaseEntity } from 'src/utils/entities/base.entity';

export abstract class TenantScopedRepository<
  T extends BaseEntity,
> extends Repository<T> {
  constructor(
    target: any,
    private readonly tenantContext: TenantContextService,
  ) {
    super(target.target, target.manager, target.queryRunner);
  }

  private get tenantId(): string {
    return this.tenantContext.getTenantId();
  }

  async find(options: any = {}): Promise<T[]> {
    options.where = { ...options.where, tenantId: this.tenantId };
    return super.find(options);
  }

  async findOne(options: any): Promise<T | null> {
    options.where = { ...options.where, tenantId: this.tenantId };
    return super.findOne(options);
  }

  async saveWithTenant(entity: Partial<T>): Promise<T> {
    const withTenant = {
      ...entity,
      tenantId: this.tenantId,
    } as unknown as DeepPartial<T>;

    return super.save(withTenant);
  }

  async softDeleteWithTenant(id: string): Promise<UpdateResult> {
    return super.softDelete({ id, tenantId: this.tenantId } as any);
  }
}
