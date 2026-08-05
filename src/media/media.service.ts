import { randomUUID } from 'crypto';
import { HttpStatus, Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { FindOptionsWhere, IsNull, Repository } from 'typeorm';
import { Client } from 'minio';

import { createResultClass } from 'src/utils/result';
import { convertToInstance } from 'src/utils/dto-validator';
import { TenantContextService } from 'src/tenant/tenant-context.service';
import { ErrorCode } from 'src/utils/error-codes';
import { MINIO_BUCKET, MINIO_CLIENT } from 'src/utils/constants';
import { FolderService } from 'src/folder/folder.service';
import { Folder } from 'src/folder/entities/folder.entity';

import { Media } from './entities/media.entity';
import { MoveMediaDTO } from './dto/move-media.dto';

@Injectable()
export class MediaService implements OnModuleInit {
  private readonly bucket: string;

  constructor(
    @InjectRepository(Media)
    private readonly mediaRepo: Repository<Media>,
    private readonly tenantContext: TenantContextService,
    @Inject(MINIO_CLIENT) private readonly minioClient: Client,
    private readonly configService: ConfigService,
    private readonly folderService: FolderService,
  ) {
    this.bucket = this.configService.get<string>(MINIO_BUCKET)!;
  }

  async onModuleInit() {
    const exists = await this.minioClient.bucketExists(this.bucket);
    if (!exists) {
      await this.minioClient.makeBucket(this.bucket);
    }
  }

  async upload(file: Express.Multer.File, folderId?: string) {
    const folderRes = await this.resolveFolder(folderId);
    if (!folderRes.isSuccess) {
      return createResultClass<Media, string[]>().error({
        error: folderRes.error,
        errorCode: folderRes.errorCode,
      });
    }
    return this.uploadInternal(
      file,
      { id: this.tenantContext.getTenantId() },
      folderRes.value,
    );
  }

  async uploadGlobal(file: Express.Multer.File) {
    return this.uploadInternal(file, null, null);
  }

  // A folderId always belongs to the caller's tenant, so global uploads
  // (no owning tenant) never accept one.
  private async resolveFolder(folderId?: string) {
    const Result = createResultClass<Folder | null, string[]>();
    if (!folderId) return Result.success(null);
    const folderRes = await this.folderService.getById(folderId);
    if (!folderRes.isSuccess) {
      return Result.error({ error: folderRes.error, errorCode: HttpStatus.BAD_REQUEST });
    }
    return Result.success(folderRes.value);
  }

  private async uploadInternal(
    file: Express.Multer.File,
    tenant: { id: string } | null,
    folder: Folder | null,
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
      media.folder = folder;

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
  // When `folderId` is given, only files directly inside that folder; when
  // omitted, only files at the root (not organized into any folder).
  async list(folderId?: string) {
    const Result = createResultClass<Media[], string[]>();
    try {
      const tenantId = this.tenantContext.getTenantId();
      const folder = folderId ? { id: folderId } : IsNull();
      const media = await this.mediaRepo.find({
        where: [
          { tenant: { id: tenantId }, folder },
          { tenant: IsNull(), folder },
        ],
        relations: ['tenant', 'folder'],
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

  // Moves a tenant-owned media file into `folderId`, or back to the root
  // when null. Global media isn't organized into (tenant-owned) folders.
  async moveToFolder(id: string, dto: MoveMediaDTO) {
    const Result = createResultClass<Media, string[]>();
    try {
      const isValid = convertToInstance(MoveMediaDTO, dto);
      if (!isValid.isSuccess) {
        return Result.error({ error: isValid.error, errorCode: HttpStatus.BAD_REQUEST });
      }

      const folderRes = await this.resolveFolder(isValid.value.folderId ?? undefined);
      if (!folderRes.isSuccess) {
        return Result.error({ error: folderRes.error, errorCode: folderRes.errorCode });
      }

      const tenantId = this.tenantContext.getTenantId();
      const media = await this.mediaRepo.findOne({
        where: { id, tenant: { id: tenantId } },
      });
      if (!media) {
        return Result.error({ error: [ErrorCode.MEDIA_NOT_FOUND], errorCode: HttpStatus.NOT_FOUND });
      }

      media.folder = folderRes.value;
      const saved = await this.mediaRepo.save(media);
      return Result.success(saved);
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
