import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Client } from 'minio';

import { TenantModule } from 'src/tenant/tenant.module';
import { FolderModule } from 'src/folder/folder.module';
import {
  MINIO_ACCESS_KEY,
  MINIO_CLIENT,
  MINIO_ENDPOINT,
  MINIO_PORT,
  MINIO_SECRET_KEY,
  MINIO_USE_SSL,
} from 'src/utils/constants';

import { MediaController } from './media.controller';
import { MediaService } from './media.service';
import { Media } from './entities/media.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Media]),
    TenantModule,
    ConfigModule,
    FolderModule,
  ],
  controllers: [MediaController],
  providers: [
    MediaService,
    {
      provide: MINIO_CLIENT,
      inject: [ConfigService],
      useFactory: (configService: ConfigService) =>
        new Client({
          endPoint: configService.get<string>(MINIO_ENDPOINT)!,
          port: Number(configService.get(MINIO_PORT)),
          useSSL: configService.get<string>(MINIO_USE_SSL) === 'true',
          accessKey: configService.get<string>(MINIO_ACCESS_KEY)!,
          secretKey: configService.get<string>(MINIO_SECRET_KEY)!,
        }),
    },
  ],
  exports: [MediaService],
})
export class MediaModule {}
