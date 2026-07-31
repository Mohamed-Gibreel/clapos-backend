import { TypeOrmModule } from '@nestjs/typeorm';
import { DynamicModule, Module } from '@nestjs/common';

import { ProjectAwareModule } from './project-aware.module';

@Module({})
export class ProjectEntityModule {
  static forFeature(entities: Function[]): DynamicModule {
    return {
      module: ProjectEntityModule,
      imports: [
        TypeOrmModule.forFeature(entities),
        ProjectAwareModule.forEntities(entities),
      ],
      exports: [ProjectAwareModule, TypeOrmModule],
    };
  }
}
