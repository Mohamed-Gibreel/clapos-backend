import { TenantMiddleware } from './tenant.middleware';
import { TenantContextService } from './tenant-context.service';
import { TenantService } from './tenant.service';

describe('TenantMiddleware', () => {
  it('should be defined', () => {
    const middleware = new TenantMiddleware(
      {} as TenantContextService,
      {} as TenantService,
    );
    expect(middleware).toBeDefined();
  });
});
