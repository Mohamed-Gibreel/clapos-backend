import { SetMetadata } from '@nestjs/common';

export const ROLES_KEY = 'Roles';

export enum Roles {
  User = 'User',
  Admin = 'Admin',
  SuperAdmin = 'SuperAdmin',
}

export const Role = (roles: Roles[]) => SetMetadata(ROLES_KEY, roles);
