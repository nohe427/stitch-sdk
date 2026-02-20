import type { ListProjectsSpec, ListProjectsInput, ListProjectsResult } from './spec.js';
import type { StitchMCPClient } from '../../../client.js';
import { Project } from '../../../project.js';
import type { ProjectData } from '../../../types.js';
import { ok, failFromError } from '../../../result.js';

export class ListProjectsHandler implements ListProjectsSpec {
  constructor(private client: StitchMCPClient) { }

  async execute(_input: ListProjectsInput): Promise<ListProjectsResult> {
    try {
      const res = await this.client.callTool<{ projects: ProjectData[] }>(
        'list_projects',
        {}
      );
      const projects = (res.projects || []).map(
        (p) => new Project(this.client, p.name, p)
      );
      return ok(projects);
    } catch (error) {
      return failFromError(error);
    }
  }
}
