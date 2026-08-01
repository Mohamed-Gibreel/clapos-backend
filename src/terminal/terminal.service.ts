import { HttpStatus, Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { FindOneOptions } from 'typeorm';

import { createResultClass } from 'src/utils/result';
import { convertToInstance } from 'src/utils/dto-validator';
import { TenantRepository } from 'src/utils/decorators/tenant-repository.decorator';
import { TenantScopedRepository } from 'src/tenant/tenant-scoped.repository';
import { ErrorCode } from 'src/utils/error-codes';

import { PosTerminal } from './entities/terminal.entity';
import { CreateTerminalDTO } from './dto/create-terminal.dto';
import { UpdateTerminalDTO } from './dto/update-terminal.dto';

@Injectable()
export class TerminalService {
  constructor(
    @TenantRepository(PosTerminal)
    private readonly terminalRepo: TenantScopedRepository<PosTerminal>,
  ) {}

  async create(dto: CreateTerminalDTO) {
    const Result = createResultClass<PosTerminal, string[]>();
    try {
      const isValid = convertToInstance(CreateTerminalDTO, dto);
      if (!isValid.isSuccess) {
        return Result.error({ error: isValid.error, errorCode: HttpStatus.BAD_REQUEST });
      }

      const terminal = this.terminalRepo.create();
      terminal.name = isValid.value.name;
      terminal.deviceToken = randomUUID();
      terminal.isActive = true;

      const saved = await this.terminalRepo.saveWithTenant(terminal);
      return Result.success(saved);
    } catch (error) {
      return Result.error({ error: [ErrorCode.INTERNAL_SERVER_ERROR], errorCode: HttpStatus.INTERNAL_SERVER_ERROR });
    }
  }

  async getAll() {
    const Result = createResultClass<PosTerminal[], string[]>();
    try {
      const terminals = await this.terminalRepo.find({});
      return Result.success(terminals);
    } catch (error) {
      return Result.error({ error: [ErrorCode.INTERNAL_SERVER_ERROR], errorCode: HttpStatus.INTERNAL_SERVER_ERROR });
    }
  }

  async getById(id: string) {
    const Result = createResultClass<PosTerminal, string[]>();
    try {
      const res = await this.findOne({ where: { id } });
      if (!res.isSuccess) return Result.error({ error: res.error, errorCode: res.errorCode });
      return Result.success(res.value);
    } catch (error) {
      return Result.error({ error: [ErrorCode.INTERNAL_SERVER_ERROR], errorCode: HttpStatus.INTERNAL_SERVER_ERROR });
    }
  }

  async update(id: string, dto: UpdateTerminalDTO) {
    const Result = createResultClass<PosTerminal, string[]>();
    try {
      const isValid = convertToInstance(UpdateTerminalDTO, dto);
      if (!isValid.isSuccess) {
        return Result.error({ error: isValid.error, errorCode: HttpStatus.BAD_REQUEST });
      }

      const existing = await this.findOne({ where: { id } });
      if (!existing.isSuccess) {
        return Result.error({ error: existing.error, errorCode: existing.errorCode });
      }

      const merged = this.terminalRepo.merge(existing.value, isValid.value);
      const updateRes = await this.terminalRepo.update({ id }, merged);

      if ((updateRes.affected ?? 0) <= 0) {
        return Result.error({ error: [ErrorCode.TERMINAL_UPDATE_FAILED], errorCode: HttpStatus.UNPROCESSABLE_ENTITY });
      }
      return Result.success(merged);
    } catch (error) {
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

      await this.terminalRepo.softDeleteWithTenant(id);
      return Result.success('Terminal deleted successfully');
    } catch (error) {
      return Result.error({ error: [ErrorCode.INTERNAL_SERVER_ERROR], errorCode: HttpStatus.INTERNAL_SERVER_ERROR });
    }
  }

  async findOne(options: FindOneOptions<PosTerminal>) {
    const Result = createResultClass<PosTerminal, string[]>();
    try {
      const terminal = await this.terminalRepo.findOne(options);
      if (!terminal) {
        return Result.error({ error: [ErrorCode.TERMINAL_NOT_FOUND], errorCode: HttpStatus.NOT_FOUND });
      }
      return Result.success(terminal);
    } catch (error) {
      return Result.error({ error: [ErrorCode.INTERNAL_SERVER_ERROR], errorCode: HttpStatus.INTERNAL_SERVER_ERROR });
    }
  }
}
