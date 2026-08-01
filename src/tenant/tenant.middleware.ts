import {
  Injectable,
  NestMiddleware,
  UnauthorizedException,
} from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { TenantContextService } from './tenant-context.service';
import { TenantService } from './tenant.service';
import { ErrorCode } from 'src/utils/error-codes';

@Injectable()
export class TenantMiddleware implements NestMiddleware {
  constructor(
    private readonly tenantContext: TenantContextService,
    private readonly tenantService: TenantService,
  ) {}

  async use(req: Request, _: Response, next: NextFunction) {
    const tenantId = req.headers['x-tenant-id'];

    if (!tenantId || typeof tenantId !== 'string') {
      throw new UnauthorizedException(ErrorCode.MISSING_TENANT_ID);
    }

    const tenant = await this.tenantService.findOne({ where: { id: tenantId } });
    if (!tenant.isSuccess) {
      throw new UnauthorizedException(ErrorCode.TENANT_NOT_FOUND);
    }

    (req as any).tenantId = tenantId;
    this.tenantContext.setTenantId(tenantId);

    next();
  }
}
