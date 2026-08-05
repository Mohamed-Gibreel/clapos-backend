import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { TenantEntityModule } from 'src/tenant/tenant-entity.module';
import { TenantModule } from 'src/tenant/tenant.module';
import { Media } from 'src/media/entities/media.entity';
import { FolderController } from './folder.controller';
import { FolderService } from './folder.service';
import { Folder } from './entities/folder.entity';

@Module({
  imports: [
    TenantEntityModule.forFeature([Folder]),
    TypeOrmModule.forFeature([Media]),
    TenantModule,
  ],
  controllers: [FolderController],
  providers: [FolderService],
  exports: [FolderService],
})
export class FolderModule {}
