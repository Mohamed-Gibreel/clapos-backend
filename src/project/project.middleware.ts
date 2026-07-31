import {
  Injectable,
  NestMiddleware,
  UnauthorizedException,
} from '@nestjs/common';
import { NextFunction } from 'express';
import { ProjectContextService } from './project-context.service';

@Injectable()
export class ProjectMiddleware implements NestMiddleware {
  constructor(private readonly projectContext: ProjectContextService) {}

  use(req: Request, _: Response, next: NextFunction) {
    const projectId = req.headers['x-project-id'];

    if (!projectId || typeof projectId !== 'string') {
      throw new UnauthorizedException(
        'Missing or invalid project id in header',
      );
    }

    // Optionally attach projectId to request object for downstream usage
    (req as any).projectId = projectId;
    this.projectContext.setProjectId(projectId);

    next();
  }
}
