import { HttpStatus, Injectable } from '@nestjs/common';
import { FindOneOptions } from 'typeorm';

import { createResultClass } from 'src/utils/result';
import { convertToInstance } from 'src/utils/dto-validator';
import { TenantRepository } from 'src/utils/decorators/tenant-repository.decorator';
import { TenantScopedRepository } from 'src/tenant/tenant-scoped.repository';
import { ErrorCode } from 'src/utils/error-codes';
import { isUniqueViolation } from 'src/utils/db-errors';

import { FeatureFlag } from './entities/feature-flag.entity';
import { CreateFeatureFlagDTO } from './dto/create-feature-flag.dto';
import { UpdateFeatureFlagDTO } from './dto/update-feature-flag.dto';

@Injectable()
export class FeatureFlagService {
  constructor(
    @TenantRepository(FeatureFlag)
    private readonly flagRepo: TenantScopedRepository<FeatureFlag>,
  ) {}

  async create(dto: CreateFeatureFlagDTO) {
    const Result = createResultClass<FeatureFlag, string[]>();
    try {
      const isValid = convertToInstance(CreateFeatureFlagDTO, dto);
      if (!isValid.isSuccess) {
        return Result.error({ error: isValid.error, errorCode: HttpStatus.BAD_REQUEST });
      }

      const flag = this.flagRepo.create();
      flag.key = isValid.value.key;
      flag.enabled = isValid.value.enabled;
      flag.description = isValid.value.description;

      const saved = await this.flagRepo.saveWithTenant(flag);
      return Result.success(saved);
    } catch (error) {
      if (isUniqueViolation(error)) {
        return Result.error({ error: [ErrorCode.FEATURE_FLAG_KEY_CONFLICT], errorCode: HttpStatus.CONFLICT });
      }
      return Result.error({ error: [ErrorCode.INTERNAL_SERVER_ERROR], errorCode: HttpStatus.INTERNAL_SERVER_ERROR });
    }
  }

  async getAll() {
    const Result = createResultClass<FeatureFlag[], string[]>();
    try {
      const flags = await this.flagRepo.find({});
      return Result.success(flags);
    } catch (error) {
      return Result.error({ error: [ErrorCode.INTERNAL_SERVER_ERROR], errorCode: HttpStatus.INTERNAL_SERVER_ERROR });
    }
  }

  async getAsMap(): Promise<Record<string, boolean>> {
    const flags = await this.flagRepo.find({});
    return flags.reduce<Record<string, boolean>>((acc, f) => {
      acc[f.key] = f.enabled;
      return acc;
    }, {});
  }

  async update(id: string, dto: UpdateFeatureFlagDTO) {
    const Result = createResultClass<FeatureFlag, string[]>();
    try {
      const isValid = convertToInstance(UpdateFeatureFlagDTO, dto);
      if (!isValid.isSuccess) {
        return Result.error({ error: isValid.error, errorCode: HttpStatus.BAD_REQUEST });
      }

      const existing = await this.findOne({ where: { id } });
      if (!existing.isSuccess) {
        return Result.error({ error: existing.error, errorCode: existing.errorCode });
      }

      const merged = this.flagRepo.merge(existing.value, isValid.value);
      const updateRes = await this.flagRepo.update({ id }, merged);

      if ((updateRes.affected ?? 0) <= 0) {
        return Result.error({ error: [ErrorCode.FEATURE_FLAG_UPDATE_FAILED], errorCode: HttpStatus.UNPROCESSABLE_ENTITY });
      }
      return Result.success(merged);
    } catch (error) {
      return Result.error({ error: [ErrorCode.INTERNAL_SERVER_ERROR], errorCode: HttpStatus.INTERNAL_SERVER_ERROR });
    }
  }

  async delete(id: string) {
    const Result = createResultClass<void, string[]>();
    try {
      const existing = await this.findOne({ where: { id } });
      if (!existing.isSuccess) {
        return Result.error({ error: existing.error, errorCode: existing.errorCode });
      }
      await this.flagRepo.softDeleteWithTenant(id);
      return Result.success(undefined);
    } catch (error) {
      return Result.error({ error: [ErrorCode.INTERNAL_SERVER_ERROR], errorCode: HttpStatus.INTERNAL_SERVER_ERROR });
    }
  }

  async findOne(options: FindOneOptions<FeatureFlag>) {
    const Result = createResultClass<FeatureFlag, string[]>();
    try {
      const flag = await this.flagRepo.findOne(options);
      if (!flag) {
        return Result.error({ error: [ErrorCode.FEATURE_FLAG_NOT_FOUND], errorCode: HttpStatus.NOT_FOUND });
      }
      return Result.success(flag);
    } catch (error) {
      return Result.error({ error: [ErrorCode.INTERNAL_SERVER_ERROR], errorCode: HttpStatus.INTERNAL_SERVER_ERROR });
    }
  }
}
