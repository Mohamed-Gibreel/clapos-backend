import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOneOptions, IsNull, Not, Repository } from 'typeorm';

import { createResultClass } from 'src/utils/result';
import { convertToInstance } from 'src/utils/dto-validator';
import { TenantRepository } from 'src/utils/decorators/tenant-repository.decorator';
import { TenantScopedRepository } from 'src/tenant/tenant-scoped.repository';
import { ErrorCode } from 'src/utils/error-codes';
import { isUniqueViolation } from 'src/utils/db-errors';
import { Media } from 'src/media/entities/media.entity';

import { Folder } from './entities/folder.entity';
import { CreateFolderDTO } from './dto/create-folder.dto';
import { UpdateFolderDTO } from './dto/update-folder.dto';

@Injectable()
export class FolderService {
  constructor(
    @TenantRepository(Folder)
    private readonly folderRepo: TenantScopedRepository<Folder>,
    @InjectRepository(Media)
    private readonly mediaRepo: Repository<Media>,
  ) {}

  async create(dto: CreateFolderDTO) {
    const Result = createResultClass<Folder, string[]>();
    try {
      const isValid = convertToInstance(CreateFolderDTO, dto);
      if (!isValid.isSuccess) {
        return Result.error({ error: isValid.error, errorCode: HttpStatus.BAD_REQUEST });
      }

      const v = isValid.value;

      let parent: Folder | null = null;
      if (v.parentId) {
        const parentRes = await this.findOne({ where: { id: v.parentId } });
        if (!parentRes.isSuccess) {
          return Result.error({ error: [ErrorCode.FOLDER_NOT_FOUND], errorCode: HttpStatus.BAD_REQUEST });
        }
        parent = parentRes.value;
      }

      const duplicate = await this.folderRepo.findOne({
        where: { name: v.name, parent: parent ? { id: parent.id } : IsNull() },
      });
      if (duplicate) {
        return Result.error({ error: [ErrorCode.FOLDER_NAME_CONFLICT], errorCode: HttpStatus.CONFLICT });
      }

      const folder = this.folderRepo.create();
      folder.name = v.name;
      folder.parent = parent;

      const saved = await this.folderRepo.saveWithTenant(folder);
      return Result.success(saved);
    } catch (error) {
      if (isUniqueViolation(error)) {
        return Result.error({ error: [ErrorCode.FOLDER_NAME_CONFLICT], errorCode: HttpStatus.CONFLICT });
      }
      return Result.error({ error: [ErrorCode.INTERNAL_SERVER_ERROR], errorCode: HttpStatus.INTERNAL_SERVER_ERROR });
    }
  }

  // Folders directly under `parentId`, or root-level folders when omitted.
  async getAll(parentId?: string) {
    const Result = createResultClass<Folder[], string[]>();
    try {
      const folders = await this.folderRepo.find({
        where: { parent: parentId ? { id: parentId } : IsNull() },
        relations: ['parent'],
        order: { name: 'ASC' },
      });
      return Result.success(folders);
    } catch (error) {
      return Result.error({ error: [ErrorCode.INTERNAL_SERVER_ERROR], errorCode: HttpStatus.INTERNAL_SERVER_ERROR });
    }
  }

  async getById(id: string) {
    const Result = createResultClass<Folder, string[]>();
    try {
      const res = await this.findOne({ where: { id }, relations: ['parent'] });
      if (!res.isSuccess) return Result.error({ error: res.error, errorCode: res.errorCode });
      return Result.success(res.value);
    } catch (error) {
      return Result.error({ error: [ErrorCode.INTERNAL_SERVER_ERROR], errorCode: HttpStatus.INTERNAL_SERVER_ERROR });
    }
  }

  async update(id: string, dto: UpdateFolderDTO) {
    const Result = createResultClass<Folder, string[]>();
    try {
      const isValid = convertToInstance(UpdateFolderDTO, dto);
      if (!isValid.isSuccess) {
        return Result.error({ error: isValid.error, errorCode: HttpStatus.BAD_REQUEST });
      }

      const existing = await this.findOne({ where: { id }, relations: ['parent'] });
      if (!existing.isSuccess) {
        return Result.error({ error: existing.error, errorCode: existing.errorCode });
      }

      const v = isValid.value;
      const folder = existing.value;

      let parent = folder.parent;
      if (v.parentId !== undefined) {
        if (v.parentId === null) {
          parent = null;
        } else {
          if (await this.wouldCreateCycle(id, v.parentId)) {
            return Result.error({ error: [ErrorCode.FOLDER_INVALID_PARENT], errorCode: HttpStatus.BAD_REQUEST });
          }
          const parentRes = await this.findOne({ where: { id: v.parentId } });
          if (!parentRes.isSuccess) {
            return Result.error({ error: [ErrorCode.FOLDER_NOT_FOUND], errorCode: HttpStatus.BAD_REQUEST });
          }
          parent = parentRes.value;
        }
      }

      const name = v.name ?? folder.name;

      const duplicate = await this.folderRepo.findOne({
        where: { id: Not(id), name, parent: parent ? { id: parent.id } : IsNull() },
      });
      if (duplicate) {
        return Result.error({ error: [ErrorCode.FOLDER_NAME_CONFLICT], errorCode: HttpStatus.CONFLICT });
      }

      const { parentId, ...rest } = v;
      const merged = this.folderRepo.merge(folder, rest);
      merged.parent = parent;

      const updateRes = await this.folderRepo.update({ id }, merged);
      if ((updateRes.affected ?? 0) <= 0) {
        return Result.error({ error: [ErrorCode.FOLDER_UPDATE_FAILED], errorCode: HttpStatus.UNPROCESSABLE_ENTITY });
      }
      return Result.success(merged);
    } catch (error) {
      if (isUniqueViolation(error)) {
        return Result.error({ error: [ErrorCode.FOLDER_NAME_CONFLICT], errorCode: HttpStatus.CONFLICT });
      }
      return Result.error({ error: [ErrorCode.INTERNAL_SERVER_ERROR], errorCode: HttpStatus.INTERNAL_SERVER_ERROR });
    }
  }

  async remove(id: string) {
    const Result = createResultClass<string, string[]>();
    try {
      const existing = await this.findOne({ where: { id } });
      if (!existing.isSuccess) {
        return Result.error({ error: existing.error, errorCode: existing.errorCode });
      }

      const [childCount, mediaCount] = await Promise.all([
        this.folderRepo.count({ where: { parent: { id } } }),
        this.mediaRepo.count({ where: { folder: { id } } }),
      ]);
      if (childCount > 0 || mediaCount > 0) {
        return Result.error({ error: [ErrorCode.FOLDER_NOT_EMPTY], errorCode: HttpStatus.CONFLICT });
      }

      await this.folderRepo.softDeleteWithTenant(id);
      return Result.success('Folder deleted successfully');
    } catch (error) {
      return Result.error({ error: [ErrorCode.INTERNAL_SERVER_ERROR], errorCode: HttpStatus.INTERNAL_SERVER_ERROR });
    }
  }

  async findOne(options: FindOneOptions<Folder>) {
    const Result = createResultClass<Folder, string[]>();
    try {
      const folder = await this.folderRepo.findOne(options);
      if (!folder) {
        return Result.error({ error: [ErrorCode.FOLDER_NOT_FOUND], errorCode: HttpStatus.NOT_FOUND });
      }
      return Result.success(folder);
    } catch (error) {
      return Result.error({ error: [ErrorCode.INTERNAL_SERVER_ERROR], errorCode: HttpStatus.INTERNAL_SERVER_ERROR });
    }
  }

  // True if `newParentId` is `folderId` itself or one of its descendants —
  // i.e. attaching `folderId` there would create a cycle.
  private async wouldCreateCycle(folderId: string, newParentId: string): Promise<boolean> {
    const maxDepth = 100;
    let current: Folder | null = await this.folderRepo.findOne({
      where: { id: newParentId },
      relations: ['parent'],
    });
    let depth = 0;
    while (current && depth < maxDepth) {
      if (current.id === folderId) return true;
      if (!current.parent) return false;
      current = await this.folderRepo.findOne({
        where: { id: current.parent.id },
        relations: ['parent'],
      });
      depth++;
    }
    return false;
  }
}
