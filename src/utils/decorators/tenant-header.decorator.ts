import { applyDecorators } from '@nestjs/common';
import { ApiHeader } from '@nestjs/swagger';

export function ApiTenantHeader() {
  return applyDecorators(
    ApiHeader({
      name: 'x-tenant-id',
      description: 'Tenant ID to scope the request',
      required: true,
    }),
  );
}
