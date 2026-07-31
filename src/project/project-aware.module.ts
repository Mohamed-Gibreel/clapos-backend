import { DataSource, ObjectLiteral, Repository } from 'typeorm';
import { DynamicModule, Module, Scope } from '@nestjs/common';
import { ProjectContextService } from './project-context.service';

import { UpdateResult } from 'typeorm';
import { ProjectModule } from './project.module';
import { TenantModule } from 'src/tenant/tenant.module';
import { TenantContextService } from 'src/tenant/tenant-context.service';

const createProjectScopedRepository = <T extends ObjectLiteral>(
  baseRepo: Repository<T>,
  projectContext: ProjectContextService,
  tenantContext: TenantContextService,
): Repository<T> => {
  return baseRepo.extend({
    get projectId(): string {
      return projectContext.getProjectId();
    },

    get tenantId(): string {
      return tenantContext.getTenantId();
    },

    async find(options: any = {}): Promise<T[]> {
      options.where = {
        ...options.where,
        project: {
          id: this.projectId,
          tenant: {
            id: this.tenantId,
          },
        },
      };
      return baseRepo.find(options);
    },

    async findOne(options: any): Promise<T | null> {
      options.where = {
        ...options.where,
        project: {
          id: this.projectId,
          tenant: {
            id: this.tenantId,
          },
        },
      };
      return baseRepo.findOne(options);
    },

    async softDeleteWithProject(id: string): Promise<UpdateResult> {
      return baseRepo.softDelete({
        id,
        project: { id: this.projectId },
      } as any);
    },
  });
};

@Module({})
export class ProjectAwareModule {
  static forEntities(entities: Function[]): DynamicModule {
    const providers = entities.map((entity) => ({
      provide: `ProjectRepository_${entity.name}`,
      scope: Scope.REQUEST,
      inject: [DataSource, ProjectContextService, TenantContextService],
      useFactory: (
        dataSource: DataSource,
        projectContext: ProjectContextService,
        tenantContext: TenantContextService,
      ) => {
        const baseRepo = dataSource.getRepository(entity);

        return createProjectScopedRepository(
          baseRepo,
          projectContext,
          tenantContext,
        );
      },
    }));

    return {
      module: ProjectAwareModule,
      imports: [ProjectModule, TenantModule],
      providers,
      exports: providers,
    };
  }
}
