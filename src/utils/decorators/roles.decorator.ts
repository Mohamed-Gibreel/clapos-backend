import { SetMetadata } from '@nestjs/common';

export const ROLES_KEY = 'Roles';

export enum Roles {
  Cashier = 'cashier',
  Manager = 'manager',
  Owner = 'owner',
  SuperAdmin = 'SuperAdmin',
}

export const Role = (roles: Roles[]) => SetMetadata(ROLES_KEY, roles);
