import { HttpStatus, Injectable } from '@nestjs/common';
import { randomBytes } from 'crypto';
import { FindOneOptions } from 'typeorm';

import { createResultClass } from 'src/utils/result';
import { convertToInstance } from 'src/utils/dto-validator';
import { TenantRepository } from 'src/utils/decorators/tenant-repository.decorator';
import { TenantScopedRepository } from 'src/tenant/tenant-scoped.repository';
import { ErrorCode } from 'src/utils/error-codes';
import { hashDeviceToken } from 'src/utils/hash-device-token';

import { PosTerminal } from './entities/terminal.entity';
import { CreateTerminalDTO } from './dto/create-terminal.dto';
import { UpdateTerminalDTO } from './dto/update-terminal.dto';
import { TerminalCredentialsDTO } from './dto/terminal-credentials.dto';

@Injectable()
export class TerminalService {
  constructor(
    @TenantRepository(PosTerminal)
    private readonly terminalRepo: TenantScopedRepository<PosTerminal>,
  ) {}

  async create(dto: CreateTerminalDTO) {
    const Result = createResultClass<TerminalCredentialsDTO, string[]>();
    try {
      const isValid = convertToInstance(CreateTerminalDTO, dto);
      if (!isValid.isSuccess) {
        return Result.error({ error: isValid.error, errorCode: HttpStatus.BAD_REQUEST });
      }

      const deviceToken = randomBytes(32).toString('hex');

      const terminal = this.terminalRepo.create();
      terminal.name = isValid.value.name;
      terminal.deviceTokenHash = hashDeviceToken(deviceToken);
      terminal.isActive = true;

      const saved = await this.terminalRepo.saveWithTenant(terminal);
      const credentials = convertToInstance(TerminalCredentialsDTO, {
        id: saved.id,
        name: saved.name,
        isActive: saved.isActive,
        deviceToken,
      });
      if (!credentials.isSuccess) {
        return Result.error({ error: [ErrorCode.INTERNAL_SERVER_ERROR], errorCode: HttpStatus.INTERNAL_SERVER_ERROR });
      }
      return Result.success(credentials.value);
    } catch (error) {
      return Result.error({ error: [ErrorCode.INTERNAL_SERVER_ERROR], errorCode: HttpStatus.INTERNAL_SERVER_ERROR });
    }
  }

  async rotateToken(id: string) {
    const Result = createResultClass<TerminalCredentialsDTO, string[]>();
    try {
      const existing = await this.findOne({ where: { id } });
      if (!existing.isSuccess) {
        return Result.error({ error: existing.error, errorCode: existing.errorCode });
      }

      const deviceToken = randomBytes(32).toString('hex');
      const updateRes = await this.terminalRepo.update(
        { id },
        { deviceTokenHash: hashDeviceToken(deviceToken) },
      );
      if ((updateRes.affected ?? 0) <= 0) {
        return Result.error({ error: [ErrorCode.TERMINAL_UPDATE_FAILED], errorCode: HttpStatus.UNPROCESSABLE_ENTITY });
      }

      const credentials = convertToInstance(TerminalCredentialsDTO, {
        id: existing.value.id,
        name: existing.value.name,
        isActive: existing.value.isActive,
        deviceToken,
      });
      if (!credentials.isSuccess) {
        return Result.error({ error: [ErrorCode.INTERNAL_SERVER_ERROR], errorCode: HttpStatus.INTERNAL_SERVER_ERROR });
      }
      return Result.success(credentials.value);
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
