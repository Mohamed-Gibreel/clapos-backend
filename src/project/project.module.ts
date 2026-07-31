import { Module } from '@nestjs/common';
import { ProjectService } from './project.service';
import { ProjectController } from './project.controller';
import { Project } from './entities/project.entity';
import { TenantModule } from 'src/tenant/tenant.module';
import { TenantEntityModule } from 'src/tenant/tenant-entity.module';
import { ProjectContextService } from './project-context.service';

@Module({
  imports: [TenantEntityModule.forFeature([Project]), TenantModule],
  controllers: [ProjectController],
  providers: [ProjectService, ProjectContextService],
  exports: [ProjectService, ProjectContextService],
})
export class ProjectModule {}
