import { TypeOrmModule } from '@nestjs/typeorm';
import { DynamicModule, Module } from '@nestjs/common';

import { TenantAwareModule } from './tenant-aware.module';

@Module({})
export class TenantEntityModule {
  static forFeature(entities: Function[]): DynamicModule {
    return {
      module: TenantEntityModule,
      imports: [
        TypeOrmModule.forFeature(entities),
        TenantAwareModule.forEntities(entities),
      ],
      exports: [TenantAwareModule, TypeOrmModule],
    };
  }
}
