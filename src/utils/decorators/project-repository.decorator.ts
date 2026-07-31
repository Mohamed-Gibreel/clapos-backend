import { Inject } from '@nestjs/common';

export const ProjectRepository = (entity: Function) =>
  Inject(`ProjectRepository_${entity.name}`);
