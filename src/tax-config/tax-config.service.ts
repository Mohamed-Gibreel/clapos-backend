import { HttpStatus, Injectable } from '@nestjs/common';
import { FindOneOptions } from 'typeorm';

import { createResultClass } from 'src/utils/result';
import { convertToInstance } from 'src/utils/dto-validator';
import { TenantRepository } from 'src/utils/decorators/tenant-repository.decorator';
import { TenantScopedRepository } from 'src/tenant/tenant-scoped.repository';
import { ErrorCode } from 'src/utils/error-codes';

import { TaxConfig } from './entities/tax-config.entity';
import { CreateTaxConfigDTO } from './dto/create-tax-config.dto';
import { UpdateTaxConfigDTO } from './dto/update-tax-config.dto';

@Injectable()
export class TaxConfigService {
  constructor(
    @TenantRepository(TaxConfig)
    private readonly taxConfigRepo: TenantScopedRepository<TaxConfig>,
  ) {}

  async create(dto: CreateTaxConfigDTO) {
    const Result = createResultClass<TaxConfig, string[]>();
    try {
      const isValid = convertToInstance(CreateTaxConfigDTO, dto);
      if (!isValid.isSuccess) {
        return Result.error({ error: isValid.error, errorCode: HttpStatus.BAD_REQUEST });
      }

      const config = this.taxConfigRepo.create();
      config.name = isValid.value.name;
      config.rate = isValid.value.rate;
      config.isActive = isValid.value.isActive ?? true;

      const saved = await this.taxConfigRepo.saveWithTenant(config);
      return Result.success(saved);
    } catch (error) {
      return Result.error({ error: [ErrorCode.INTERNAL_SERVER_ERROR], errorCode: HttpStatus.INTERNAL_SERVER_ERROR });
    }
  }

  async getAll() {
    const Result = createResultClass<TaxConfig[], string[]>();
    try {
      const configs = await this.taxConfigRepo.find({});
      return Result.success(configs);
    } catch (error) {
      return Result.error({ error: [ErrorCode.INTERNAL_SERVER_ERROR], errorCode: HttpStatus.INTERNAL_SERVER_ERROR });
    }
  }

  async getActive() {
    const Result = createResultClass<TaxConfig | null, string[]>();
    try {
      const config = await this.taxConfigRepo.findOne({ where: { isActive: true } });
      return Result.success(config ?? null);
    } catch (error) {
      return Result.error({ error: [ErrorCode.INTERNAL_SERVER_ERROR], errorCode: HttpStatus.INTERNAL_SERVER_ERROR });
    }
  }

  async update(id: string, dto: UpdateTaxConfigDTO) {
    const Result = createResultClass<TaxConfig, string[]>();
    try {
      const isValid = convertToInstance(UpdateTaxConfigDTO, dto);
      if (!isValid.isSuccess) {
        return Result.error({ error: isValid.error, errorCode: HttpStatus.BAD_REQUEST });
      }

      const existing = await this.findOne({ where: { id } });
      if (!existing.isSuccess) {
        return Result.error({ error: existing.error, errorCode: existing.errorCode });
      }

      const merged = this.taxConfigRepo.merge(existing.value, isValid.value);
      const updateRes = await this.taxConfigRepo.update({ id }, merged);

      if ((updateRes.affected ?? 0) <= 0) {
        return Result.error({ error: [ErrorCode.TAX_CONFIG_UPDATE_FAILED], errorCode: HttpStatus.UNPROCESSABLE_ENTITY });
      }
      return Result.success(merged);
    } catch (error) {
      return Result.error({ error: [ErrorCode.INTERNAL_SERVER_ERROR], errorCode: HttpStatus.INTERNAL_SERVER_ERROR });
    }
  }

  async findOne(options: FindOneOptions<TaxConfig>) {
    const Result = createResultClass<TaxConfig, string[]>();
    try {
      const config = await this.taxConfigRepo.findOne(options);
      if (!config) {
        return Result.error({ error: [ErrorCode.TAX_CONFIG_NOT_FOUND], errorCode: HttpStatus.NOT_FOUND });
      }
      return Result.success(config);
    } catch (error) {
      return Result.error({ error: [ErrorCode.INTERNAL_SERVER_ERROR], errorCode: HttpStatus.INTERNAL_SERVER_ERROR });
    }
  }
}
