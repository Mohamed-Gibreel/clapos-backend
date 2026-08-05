import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { createResultClass } from 'src/utils/result';
import { ErrorCode } from 'src/utils/error-codes';
import { hashDeviceToken } from 'src/utils/hash-device-token';

import { PosTerminal } from './entities/terminal.entity';

// Plain singleton, deliberately NOT built on @TenantRepository — it must work
// for terminal-login requests that carry no tenant context at all (device
// token alone resolves the tenant). Injecting the request-scoped
// TenantScopedRepository here instead would make AuthService/AuthController
// request-scoped too, which breaks terminal-login (see terminal-auth.service
// crash: constructing the tenant-scoped repo eagerly reads
// TenantContextService.getTenantId(), which throws with no tenant context).
@Injectable()
export class TerminalAuthService {
  constructor(
    @InjectRepository(PosTerminal)
    private readonly terminalRepo: Repository<PosTerminal>,
  ) {}

  async findByDeviceToken(rawToken: string) {
    const Result = createResultClass<PosTerminal, string[]>();
    try {
      const terminal = await this.terminalRepo.findOne({
        where: { deviceTokenHash: hashDeviceToken(rawToken), isActive: true },
        relations: ['tenant'],
      });
      if (!terminal) {
        return Result.error({ error: [ErrorCode.TERMINAL_NOT_FOUND], errorCode: HttpStatus.NOT_FOUND });
      }
      return Result.success(terminal);
    } catch (error) {
      return Result.error({ error: [ErrorCode.INTERNAL_SERVER_ERROR], errorCode: HttpStatus.INTERNAL_SERVER_ERROR });
    }
  }

  // Used by cashier-login, which already has an explicit tenantId in hand
  // (from the x-tenant-id header) — no need for the request-scoped tenant
  // machinery, just an explicit filter.
  async findActiveByIdAndTenant(id: string, tenantId: string) {
    const Result = createResultClass<PosTerminal, string[]>();
    try {
      const terminal = await this.terminalRepo.findOne({
        where: { id, isActive: true, tenant: { id: tenantId } },
      });
      if (!terminal) {
        return Result.error({ error: [ErrorCode.TERMINAL_NOT_FOUND], errorCode: HttpStatus.NOT_FOUND });
      }
      return Result.success(terminal);
    } catch (error) {
      return Result.error({ error: [ErrorCode.INTERNAL_SERVER_ERROR], errorCode: HttpStatus.INTERNAL_SERVER_ERROR });
    }
  }

  async markSeen(id: string) {
    await this.terminalRepo.update({ id }, { lastSeenAt: new Date() });
  }
}
