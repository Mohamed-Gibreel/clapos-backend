import { HttpStatus, Injectable } from '@nestjs/common';

import { createResultClass } from 'src/utils/result';
import { ErrorCode } from 'src/utils/error-codes';
import { TenantRepository } from 'src/utils/decorators/tenant-repository.decorator';
import { TenantScopedRepository } from 'src/tenant/tenant-scoped.repository';

import { Table, TableStatus } from './entities/table.entity';
import { CreateTableDTO } from './dto/create-table.dto';
import { UpdateTableDTO } from './dto/update-table.dto';

@Injectable()
export class TableService {
  constructor(
    @TenantRepository(Table)
    private readonly tableRepo: TenantScopedRepository<Table>,
  ) {}

  async create(dto: CreateTableDTO) {
    const Result = createResultClass<Table, string[]>();
    try {
      const table = this.tableRepo.create();
      table.name = dto.name;
      table.shape = dto.shape;
      table.capacity = dto.capacity;
      table.status = dto.status ?? TableStatus.Available;
      table.posX = dto.posX;
      table.posY = dto.posY;
      table.width = dto.width;
      table.height = dto.height;
      table.color = dto.color;
      const saved = await this.tableRepo.saveWithTenant(table);
      return Result.success(saved);
    } catch (error) {
      return Result.error({ error: [ErrorCode.INTERNAL_SERVER_ERROR], errorCode: HttpStatus.INTERNAL_SERVER_ERROR });
    }
  }

  async getAll() {
    const Result = createResultClass<Table[], string[]>();
    try {
      const tables = await this.tableRepo.find({ order: { name: 'ASC' } });
      return Result.success(tables);
    } catch (error) {
      return Result.error({ error: [ErrorCode.INTERNAL_SERVER_ERROR], errorCode: HttpStatus.INTERNAL_SERVER_ERROR });
    }
  }

  async getById(id: string) {
    const Result = createResultClass<Table, string[]>();
    try {
      const table = await this.tableRepo.findOne({ where: { id } });
      if (!table) {
        return Result.error({ error: [ErrorCode.TABLE_NOT_FOUND], errorCode: HttpStatus.NOT_FOUND });
      }
      return Result.success(table);
    } catch (error) {
      return Result.error({ error: [ErrorCode.INTERNAL_SERVER_ERROR], errorCode: HttpStatus.INTERNAL_SERVER_ERROR });
    }
  }

  async update(id: string, dto: UpdateTableDTO) {
    const Result = createResultClass<Table, string[]>();
    try {
      const existing = await this.getById(id);
      if (!existing.isSuccess) return existing;
      const merged = this.tableRepo.merge(existing.value, dto);
      const saved = await this.tableRepo.save(merged);
      return Result.success(saved);
    } catch (error) {
      return Result.error({ error: [ErrorCode.INTERNAL_SERVER_ERROR], errorCode: HttpStatus.INTERNAL_SERVER_ERROR });
    }
  }

  async updateStatus(id: string, status: TableStatus) {
    const Result = createResultClass<Table, string[]>();
    try {
      const existing = await this.getById(id);
      if (!existing.isSuccess) return existing;
      await this.tableRepo.update({ id }, { status });
      existing.value.status = status;
      return Result.success(existing.value);
    } catch (error) {
      return Result.error({ error: [ErrorCode.INTERNAL_SERVER_ERROR], errorCode: HttpStatus.INTERNAL_SERVER_ERROR });
    }
  }

  async delete(id: string) {
    const Result = createResultClass<void, string[]>();
    try {
      const existing = await this.getById(id);
      if (!existing.isSuccess) return Result.error({ error: existing.error, errorCode: existing.errorCode });
      await this.tableRepo.softDeleteWithTenant(id);
      return Result.success(undefined);
    } catch (error) {
      return Result.error({ error: [ErrorCode.INTERNAL_SERVER_ERROR], errorCode: HttpStatus.INTERNAL_SERVER_ERROR });
    }
  }
}
