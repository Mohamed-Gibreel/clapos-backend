import { randomUUID } from 'crypto';
import { HttpStatus, Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { FindOptionsWhere, IsNull, Repository } from 'typeorm';
import { Client } from 'minio';

import { createResultClass } from 'src/utils/result';
import { TenantContextService } from 'src/tenant/tenant-context.service';
import { ErrorCode } from 'src/utils/error-codes';
import { MINIO_BUCKET, MINIO_CLIENT } from 'src/utils/constants';

import { Media } from './entities/media.entity';

@Injectable()
export class MediaService implements OnModuleInit {
  private readonly bucket: string;

  constructor(
    @InjectRepository(Media)
    private readonly mediaRepo: Repository<Media>,
    private readonly tenantContext: TenantContextService,
    @Inject(MINIO_CLIENT) private readonly minioClient: Client,
    private readonly configService: ConfigService,
  ) {
    this.bucket = this.configService.get<string>(MINIO_BUCKET)!;
  }

  async onModuleInit() {
    const exists = await this.minioClient.bucketExists(this.bucket);
    if (!exists) {
      await this.minioClient.makeBucket(this.bucket);
    }
  }

  async upload(file: Express.Multer.File) {
    return this.uploadInternal(file, { id: this.tenantContext.getTenantId() });
  }

  async uploadGlobal(file: Express.Multer.File) {
    return this.uploadInternal(file, null);
  }

  private async uploadInternal(
    file: Express.Multer.File,
    tenant: { id: string } | null,
  ) {
    const Result = createResultClass<Media, string[]>();
    try {
      const key = `${randomUUID()}-${file.originalname}`;

      await this.minioClient.putObject(
        this.bucket,
        key,
        file.buffer,
        file.size,
        {
          'Content-Type': file.mimetype,
        },
      );

      const media = this.mediaRepo.create();
      media.key = key;
      media.originalName = file.originalname;
      media.mimeType = file.mimetype;
      media.size = file.size;
      media.tenant = tenant as Media['tenant'];

      const saved = await this.mediaRepo.save(media);
      return Result.success(saved);
    } catch {
      return Result.error({
        error: [ErrorCode.INTERNAL_SERVER_ERROR],
        errorCode: HttpStatus.INTERNAL_SERVER_ERROR,
      });
    }
  }

  // Everything owned by the caller's tenant, plus every global file.
  async list() {
    const Result = createResultClass<Media[], string[]>();
    try {
      const tenantId = this.tenantContext.getTenantId();
      const media = await this.mediaRepo.find({
        where: [{ tenant: { id: tenantId } }, { tenant: IsNull() }],
        relations: ['tenant'],
        order: { createdAt: 'DESC' },
      });
      return Result.success(media);
    } catch {
      return Result.error({
        error: [ErrorCode.INTERNAL_SERVER_ERROR],
        errorCode: HttpStatus.INTERNAL_SERVER_ERROR,
      });
    }
  }

  // Visible if it's owned by the caller's tenant, or global (no owning tenant).
  async getById(id: string) {
    const Result = createResultClass<Media, string[]>();
    try {
      const tenantId = this.tenantContext.getTenantId();
      const media = await this.mediaRepo.findOne({
        where: [
          { id, tenant: { id: tenantId } },
          { id, tenant: IsNull() },
        ],
        relations: ['tenant'],
      });
      if (!media) {
        return Result.error({
          error: [ErrorCode.MEDIA_NOT_FOUND],
          errorCode: HttpStatus.NOT_FOUND,
        });
      }
      return Result.success(media);
    } catch {
      return Result.error({
        error: [ErrorCode.INTERNAL_SERVER_ERROR],
        errorCode: HttpStatus.INTERNAL_SERVER_ERROR,
      });
    }
  }

  async getObjectStream(id: string) {
    const Result = createResultClass<
      { media: Media; stream: NodeJS.ReadableStream },
      string[]
    >();
    const mediaRes = await this.getById(id);
    if (!mediaRes.isSuccess) {
      return Result.error({
        error: mediaRes.error,
        errorCode: mediaRes.errorCode,
      });
    }

    try {
      const stream = await this.minioClient.getObject(
        this.bucket,
        mediaRes.value.key,
      );
      return Result.success({ media: mediaRes.value, stream });
    } catch {
      return Result.error({
        error: [ErrorCode.INTERNAL_SERVER_ERROR],
        errorCode: HttpStatus.INTERNAL_SERVER_ERROR,
      });
    }
  }

  // Only deletes media owned by the caller's tenant — global media is
  // managed separately via removeGlobal.
  async remove(id: string) {
    return this.removeInternal({
      id,
      tenant: { id: this.tenantContext.getTenantId() },
    });
  }

  // Only deletes global media — never a tenant's private files.
  async removeGlobal(id: string) {
    return this.removeInternal({ id, tenant: IsNull() });
  }

  private async removeInternal(where: FindOptionsWhere<Media>) {
    const Result = createResultClass<string, string[]>();
    try {
      const media = await this.mediaRepo.findOne({ where });
      if (!media) {
        return Result.error({
          error: [ErrorCode.MEDIA_NOT_FOUND],
          errorCode: HttpStatus.NOT_FOUND,
        });
      }

      await this.minioClient.removeObject(this.bucket, media.key);
      await this.mediaRepo.softDelete(where);
      return Result.success('Media deleted successfully');
    } catch {
      return Result.error({
        error: [ErrorCode.INTERNAL_SERVER_ERROR],
        errorCode: HttpStatus.INTERNAL_SERVER_ERROR,
      });
    }
  }
}
