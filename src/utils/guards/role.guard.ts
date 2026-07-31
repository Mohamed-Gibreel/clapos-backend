import { Reflector } from '@nestjs/core';
import {
  CanActivate,
  ExecutionContext,
  forwardRef,
  Inject,
  Injectable,
} from '@nestjs/common';

import { Roles, ROLES_KEY } from '../decorators/roles.decorator';

import { UserService } from 'src/user/user.service';
import { IS_PUBLIC_KEY } from '../decorators/is-public.decorator';

@Injectable()
export class RoleGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    @Inject(forwardRef(() => UserService))
    private userService: UserService,
  ) {}

  async canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const request = context.switchToHttp().getRequest<Request>();
    const user = request['user'];
    if (!user) return false;
    let userRole = user.roleId;
    if (typeof userRole === 'undefined') return false;
    userRole = parseInt(userRole);

    const userInfo = await this.userService.findOne({
      where: {
        id: user.sub,
      },
      relations: ['role'],
    });
    if (!userInfo.isSuccess) return false;

    const isUserSuperAdmin = userInfo.value.role.name == Roles.SuperAdmin;

    if (isUserSuperAdmin) return true;

    const routeRoles =
      this.reflector.getAllAndOverride<Roles[]>(ROLES_KEY, [
        context.getHandler(),
        context.getClass(),
      ]) ?? [];
    if (routeRoles.length == 0) return false;

    const userHasRole = routeRoles.some(
      (role) => role.toString().localeCompare(userInfo.value.role.name) == 0,
    );

    return userHasRole;
  }
}
