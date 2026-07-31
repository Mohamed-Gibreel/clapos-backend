import { Inject } from '@nestjs/common';

export const TenantRepository = (entity: Function) =>
  Inject(`TenantRepository_${entity.name}`);
