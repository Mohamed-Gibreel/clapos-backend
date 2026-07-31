import {
  createParamDecorator,
  ExecutionContext,
  UnprocessableEntityException,
} from '@nestjs/common';

export const UserId = createParamDecorator(
  (_: unknown, ctx: ExecutionContext): number => {
    const request = ctx.switchToHttp().getRequest();
    const userId = request.user.sub;
    if (typeof userId === 'undefined') {
      throw new UnprocessableEntityException('Unable to extract user id');
    }
    return +userId;
  },
);
