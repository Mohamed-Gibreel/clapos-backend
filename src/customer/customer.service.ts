import { HttpStatus, Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { FindOneOptions } from 'typeorm';

import { createResultClass } from 'src/utils/result';
import { convertToInstance } from 'src/utils/dto-validator';
import { TenantRepository } from 'src/utils/decorators/tenant-repository.decorator';
import { TenantScopedRepository } from 'src/tenant/tenant-scoped.repository';
import { TenantContextService } from 'src/tenant/tenant-context.service';

import { Customer } from './entities/customer.entity';
import { CreateCustomerDTO } from './dto/create-customer.dto';
import { UpdateCustomerDTO } from './dto/update-customer.dto';

@Injectable()
export class CustomerService {
  constructor(
    @TenantRepository(Customer)
    private readonly customerRepo: TenantScopedRepository<Customer>,
    private readonly tenantContext: TenantContextService,
  ) {}

  async create(dto: CreateCustomerDTO) {
    const Result = createResultClass<Customer, string[]>();
    try {
      const isValid = convertToInstance(CreateCustomerDTO, dto);
      if (!isValid.isSuccess) {
        return Result.error({ error: isValid.error, errorCode: HttpStatus.BAD_REQUEST });
      }

      const v = isValid.value;
      const clientId = v.clientId ?? randomUUID();

      // Idempotency: if clientId already exists return existing record
      const existingByClientId = await this.customerRepo.findOne({ where: { clientId } });
      if (existingByClientId) {
        return Result.success(existingByClientId);
      }

      const customer = this.customerRepo.create();
      customer.clientId = clientId;
      customer.firstName = v.firstName;
      customer.lastName = v.lastName;
      customer.gender = v.gender;
      customer.phone = v.phone;
      customer.email = v.email;
      customer.address = v.address;
      customer.birthDate = v.birthDate;
      customer.isMember = v.isMember ?? false;

      const saved = await this.customerRepo.saveWithTenant(customer);
      return Result.success(saved);
    } catch (error) {
      return Result.error({ error: [error.message], errorCode: HttpStatus.INTERNAL_SERVER_ERROR });
    }
  }

  async getAll(query: { search?: string; isMember?: boolean; page?: number; limit?: number }) {
    const Result = createResultClass<{ data: Customer[]; total: number }, string[]>();
    try {
      const page = query.page ?? 1;
      const limit = Math.min(query.limit ?? 20, 100);
      const skip = (page - 1) * limit;

      const qb = this.customerRepo.createQueryBuilder('customer')
        .innerJoin('customer.tenant', 'tenant')
        .where('tenant.id = :tenantId', { tenantId: this.tenantContext.getTenantId() })
        .andWhere('customer.deletedAt IS NULL')
        .orderBy('customer.createdAt', 'DESC')
        .skip(skip)
        .take(limit);

      if (query.search) {
        qb.andWhere(
          '(customer.firstName ILIKE :search OR customer.lastName ILIKE :search OR customer.phone ILIKE :search)',
          { search: `%${query.search}%` },
        );
      }

      if (query.isMember !== undefined) {
        qb.andWhere('customer.isMember = :isMember', { isMember: query.isMember });
      }

      const [data, total] = await qb.getManyAndCount();
      return Result.success({ data, total });
    } catch (error) {
      return Result.error({ error: [error.message], errorCode: HttpStatus.INTERNAL_SERVER_ERROR });
    }
  }

  async getById(id: string) {
    const Result = createResultClass<Customer, string[]>();
    try {
      const res = await this.findOne({ where: { id } });
      if (!res.isSuccess) return Result.error({ error: res.error, errorCode: res.errorCode });
      return Result.success(res.value);
    } catch (error) {
      return Result.error({ error: [error.message], errorCode: HttpStatus.INTERNAL_SERVER_ERROR });
    }
  }

  async update(id: string, dto: UpdateCustomerDTO) {
    const Result = createResultClass<Customer, string[]>();
    try {
      const isValid = convertToInstance(UpdateCustomerDTO, dto);
      if (!isValid.isSuccess) {
        return Result.error({ error: isValid.error, errorCode: HttpStatus.BAD_REQUEST });
      }

      const existing = await this.findOne({ where: { id } });
      if (!existing.isSuccess) {
        return Result.error({ error: existing.error, errorCode: existing.errorCode });
      }

      const merged = this.customerRepo.merge(existing.value, isValid.value);
      await this.customerRepo.save(merged);
      return Result.success(merged);
    } catch (error) {
      return Result.error({ error: [error.message], errorCode: HttpStatus.INTERNAL_SERVER_ERROR });
    }
  }

  async remove(id: string) {
    const Result = createResultClass<string, string[]>();
    try {
      const existing = await this.findOne({ where: { id } });
      if (!existing.isSuccess) {
        return Result.error({ error: existing.error, errorCode: existing.errorCode });
      }

      await this.customerRepo.softDeleteWithTenant(id);
      return Result.success('Customer deleted successfully');
    } catch (error) {
      return Result.error({ error: [error.message], errorCode: HttpStatus.INTERNAL_SERVER_ERROR });
    }
  }

  async findOne(options: FindOneOptions<Customer>) {
    const Result = createResultClass<Customer, string[]>();
    try {
      const customer = await this.customerRepo.findOne(options);
      if (!customer) {
        return Result.error({ error: ['Customer not found'], errorCode: HttpStatus.NOT_FOUND });
      }
      return Result.success(customer);
    } catch (error) {
      return Result.error({ error: [error.message], errorCode: HttpStatus.INTERNAL_SERVER_ERROR });
    }
  }
}
