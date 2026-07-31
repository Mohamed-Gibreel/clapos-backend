import {
  Injectable,
  NestMiddleware,
  UnauthorizedException,
} from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { TenantContextService } from './tenant-context.service';

@Injectable()
export class TenantMiddleware implements NestMiddleware {
  constructor(private readonly tenantContext: TenantContextService) {}

  use(req: Request, _: Response, next: NextFunction) {
    const tenantId = req.headers['x-tenant-id'];

    if (!tenantId || typeof tenantId !== 'string') {
      throw new UnauthorizedException('Missing or invalid tenant ID in header');
    }

    // Optionally attach tenantId to request object for downstream usage
    (req as any).tenantId = tenantId;

    this.tenantContext.setTenantId(tenantId);

    next();
  }
}
