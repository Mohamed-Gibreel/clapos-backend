import {
  createParamDecorator,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';

export const ProjectId = createParamDecorator(
  (_: unknown, ctx: ExecutionContext): string => {
    const request = ctx.switchToHttp().getRequest();
    const projectId = request.projectId; // assumes it's already set by middleware
    if (!projectId) {
      throw new UnauthorizedException('Missing project Id from middleware');
    }

    return projectId;
  },
);
