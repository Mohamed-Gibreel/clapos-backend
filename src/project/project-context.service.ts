import { Injectable, Scope } from '@nestjs/common';

@Injectable({ scope: Scope.REQUEST })
export class ProjectContextService {
  private projectId: string;

  setProjectId(projectId: string) {
    this.projectId = projectId;
  }

  getProjectId(): string {
    if (!this.projectId) throw new Error('Project ID not set in context');
    return this.projectId;
  }
}
