import { HttpStatus, Injectable } from '@nestjs/common';
import { FindOneOptions } from 'typeorm';

import { createResultClass } from 'src/utils/result';
import { convertToInstance } from 'src/utils/dto-validator';
import { TenantRepository } from 'src/utils/decorators/tenant-repository.decorator';
import { TenantScopedRepository } from 'src/tenant/tenant-scoped.repository';
import { ErrorCode } from 'src/utils/error-codes';
import { isUniqueViolation } from 'src/utils/db-errors';

import { Discount } from './entities/discount.entity';
import { CreateDiscountDTO } from './dto/create-discount.dto';
import { UpdateDiscountDTO } from './dto/update-discount.dto';

@Injectable()
export class DiscountService {
  constructor(
    @TenantRepository(Discount)
    private readonly discountRepo: TenantScopedRepository<Discount>,
  ) {}

  async create(dto: CreateDiscountDTO) {
    const Result = createResultClass<Discount, string[]>();
    try {
      const isValid = convertToInstance(CreateDiscountDTO, dto);
      if (!isValid.isSuccess) {
        return Result.error({ error: isValid.error, errorCode: HttpStatus.BAD_REQUEST });
      }

      const discount = this.discountRepo.create();
      discount.name = isValid.value.name;
      discount.type = isValid.value.type;
      discount.value = isValid.value.value;
      discount.code = isValid.value.code;
      discount.isActive = isValid.value.isActive ?? true;
      discount.expiresAt = isValid.value.expiresAt ? new Date(isValid.value.expiresAt) : undefined;

      const saved = await this.discountRepo.saveWithTenant(discount);
      return Result.success(saved);
    } catch (error) {
      if (isUniqueViolation(error)) {
        return Result.error({ error: [ErrorCode.DISCOUNT_CODE_CONFLICT], errorCode: HttpStatus.CONFLICT });
      }
      return Result.error({ error: [ErrorCode.INTERNAL_SERVER_ERROR], errorCode: HttpStatus.INTERNAL_SERVER_ERROR });
    }
  }

  async getAll() {
    const Result = createResultClass<Discount[], string[]>();
    try {
      const discounts = await this.discountRepo.find({});
      return Result.success(discounts);
    } catch (error) {
      return Result.error({ error: [ErrorCode.INTERNAL_SERVER_ERROR], errorCode: HttpStatus.INTERNAL_SERVER_ERROR });
    }
  }

  async update(id: string, dto: UpdateDiscountDTO) {
    const Result = createResultClass<Discount, string[]>();
    try {
      const isValid = convertToInstance(UpdateDiscountDTO, dto);
      if (!isValid.isSuccess) {
        return Result.error({ error: isValid.error, errorCode: HttpStatus.BAD_REQUEST });
      }

      const existing = await this.findOne({ where: { id } });
      if (!existing.isSuccess) {
        return Result.error({ error: existing.error, errorCode: existing.errorCode });
      }

      const update: Partial<Discount> = { ...isValid.value as any };
      if (isValid.value.expiresAt) {
        update.expiresAt = new Date(isValid.value.expiresAt);
      }

      const merged = this.discountRepo.merge(existing.value, update);
      const updateRes = await this.discountRepo.update({ id }, merged);

      if ((updateRes.affected ?? 0) <= 0) {
        return Result.error({ error: [ErrorCode.DISCOUNT_UPDATE_FAILED], errorCode: HttpStatus.UNPROCESSABLE_ENTITY });
      }
      return Result.success(merged);
    } catch (error) {
      if (isUniqueViolation(error)) {
        return Result.error({ error: [ErrorCode.DISCOUNT_CODE_CONFLICT], errorCode: HttpStatus.CONFLICT });
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

      await this.discountRepo.softDeleteWithTenant(id);
      return Result.success('Discount deleted successfully');
    } catch (error) {
      return Result.error({ error: [ErrorCode.INTERNAL_SERVER_ERROR], errorCode: HttpStatus.INTERNAL_SERVER_ERROR });
    }
  }

  async validate(code: string) {
    const Result = createResultClass<Discount, string[]>();
    try {
      const discount = await this.discountRepo.findOne({ where: { code } });
      if (!discount) {
        return Result.error({ error: [ErrorCode.DISCOUNT_NOT_FOUND], errorCode: HttpStatus.NOT_FOUND });
      }
      if (!discount.isActive) {
        return Result.error({ error: [ErrorCode.DISCOUNT_INACTIVE], errorCode: HttpStatus.UNPROCESSABLE_ENTITY });
      }
      if (discount.expiresAt && discount.expiresAt < new Date()) {
        return Result.error({ error: [ErrorCode.DISCOUNT_EXPIRED], errorCode: HttpStatus.UNPROCESSABLE_ENTITY });
      }
      return Result.success(discount);
    } catch (error) {
      return Result.error({ error: [ErrorCode.INTERNAL_SERVER_ERROR], errorCode: HttpStatus.INTERNAL_SERVER_ERROR });
    }
  }

  async findOne(options: FindOneOptions<Discount>) {
    const Result = createResultClass<Discount, string[]>();
    try {
      const discount = await this.discountRepo.findOne(options);
      if (!discount) {
        return Result.error({ error: [ErrorCode.DISCOUNT_NOT_FOUND], errorCode: HttpStatus.NOT_FOUND });
      }
      return Result.success(discount);
    } catch (error) {
      return Result.error({ error: [ErrorCode.INTERNAL_SERVER_ERROR], errorCode: HttpStatus.INTERNAL_SERVER_ERROR });
    }
  }
}
