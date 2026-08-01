import { ProjectMiddleware } from './project.middleware';
import { ProjectContextService } from './project-context.service';

describe('ProjectMiddleware', () => {
  it('should be defined', () => {
    const middleware = new ProjectMiddleware({} as ProjectContextService);
    expect(middleware).toBeDefined();
  });
});
