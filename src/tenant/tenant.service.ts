import { HttpStatus, Injectable } from '@nestjs/common';
import { CreateTenantDTO } from './dto/create-tenant.dto';
import { UpdateTenantDTO } from './dto/update-tenant.dto';
import {
  EntityManager,
  FindManyOptions,
  FindOneOptions,
  Repository,
} from 'typeorm';
import { createResultClass } from 'src/utils/result';
import { Tenant } from './entities/tenant.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { convertToInstance } from 'src/utils/dto-validator';
import { getRepo } from 'src/utils/get-repository';
import { ErrorCode } from 'src/utils/error-codes';

@Injectable()
export class TenantService {
  constructor(
    @InjectRepository(Tenant)
    private tenantsRepository: Repository<Tenant>,
  ) {}
  async create(createTenantDto: CreateTenantDTO) {
    const Result = createResultClass<Tenant, string[]>();
    try {
      const isBodyValid = convertToInstance(CreateTenantDTO, createTenantDto);
      if (!isBodyValid.isSuccess) {
        return Result.error({
          error: isBodyValid.error,
          errorCode: HttpStatus.BAD_REQUEST,
        });
      }
      const tenant = this.tenantsRepository.create();
      tenant.name = isBodyValid.value.name;

      const savedTenant = await this.tenantsRepository.save(tenant);
      return Result.success(savedTenant);
    } catch (error) {
      return Result.error({
        error: error,
        errorCode: HttpStatus.INTERNAL_SERVER_ERROR,
      });
    }
  }

  async getAll() {
    const Result = createResultClass<Tenant[], string[]>();
    try {
      const tenants = await this.tenantsRepository.find();
      return Result.success(tenants);
    } catch (error) {
      return Result.error({
        error: error,
        errorCode: HttpStatus.INTERNAL_SERVER_ERROR,
      });
    }
  }

  async getById(id: string, manager?: EntityManager) {
    const Result = createResultClass<Tenant, string[]>();
    try {
      const tenantRepo = getRepo(manager, this.tenantsRepository);
      const tenant = await tenantRepo.findOne({
        where: {
          id: id,
        },
      });

      if (!tenant) {
        return Result.error({
          error: [ErrorCode.TENANT_NOT_FOUND],
          errorCode: HttpStatus.NOT_FOUND,
        });
      }
      return Result.success(tenant);
    } catch (error) {
      return Result.error({
        error: error,
        errorCode: HttpStatus.INTERNAL_SERVER_ERROR,
      });
    }
  }

  async update(id: string, updateTenantDto: UpdateTenantDTO) {
    const Result = createResultClass<Tenant, string[]>();
    try {
      const isBodyValid = convertToInstance(UpdateTenantDTO, updateTenantDto);
      if (!isBodyValid.isSuccess) {
        return Result.error({
          error: isBodyValid.error,
          errorCode: HttpStatus.BAD_REQUEST,
        });
      }

      const existingTenant = await this.findOne({
        where: {
          id: id,
        },
      });
      if (!existingTenant.isSuccess) {
        return Result.error({
          error: existingTenant.error,
          errorCode: existingTenant.errorCode,
        });
      }
      const updatedTenant = this.tenantsRepository.merge(
        existingTenant.value,
        isBodyValid.value,
      );

      const updateResult = await this.tenantsRepository.update(
        {
          id: id,
        },
        updatedTenant,
      );

      if ((updateResult.affected ?? 0) <= 0) {
        return Result.error({
          error: [ErrorCode.TENANT_UPDATE_FAILED],
          errorCode: HttpStatus.UNPROCESSABLE_ENTITY,
        });
      }
      return Result.success(updatedTenant);
    } catch (error) {
      return Result.error({
        error: error,
        errorCode: HttpStatus.INTERNAL_SERVER_ERROR,
      });
    }
  }

  async remove(id: string) {
    const Result = createResultClass<string, string[]>();
    try {
      const existingTenant = await this.findOne({
        where: {
          id: id,
        },
      });
      if (!existingTenant.isSuccess) {
        return Result.error({
          error: existingTenant.error,
          errorCode: existingTenant.errorCode,
        });
      }

      const deleteResult = await this.tenantsRepository.delete({
        id: id,
      });

      if ((deleteResult.affected ?? 0) <= 0) {
        return Result.error({
          error: [ErrorCode.TENANT_DELETE_FAILED],
          errorCode: HttpStatus.UNPROCESSABLE_ENTITY,
        });
      }
      return Result.success('Deleted tenant successfully');
    } catch (error) {
      return Result.error({
        error: error,
        errorCode: HttpStatus.INTERNAL_SERVER_ERROR,
      });
    }
  }

  async find(options: FindManyOptions<Tenant>) {
    const Result = createResultClass<Tenant[], string[]>();
    try {
      const tenants = await this.tenantsRepository.find(options);
      return Result.success(tenants);
    } catch (error) {
      return Result.error({
        error: [error],
        errorCode: HttpStatus.INTERNAL_SERVER_ERROR,
      });
    }
  }

  async findOne(options: FindOneOptions<Tenant>) {
    const Result = createResultClass<Tenant, string[]>();
    try {
      const tenant = await this.tenantsRepository.findOne(options);
      if (tenant == null) {
        return Result.error({
          error: [ErrorCode.TENANT_NOT_FOUND],
          errorCode: HttpStatus.NOT_FOUND,
        });
      }
      return Result.success(tenant);
    } catch (error) {
      return Result.error({
        error: [error],
        errorCode: HttpStatus.INTERNAL_SERVER_ERROR,
      });
    }
  }
}
