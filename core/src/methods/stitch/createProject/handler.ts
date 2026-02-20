import type { CreateProjectSpec, CreateProjectInput, CreateProjectResult } from './spec.js';
import type { StitchMCPClient } from '../../../client.js';
import { Project } from '../../../project.js';
import type { ProjectData } from '../../../types.js';
import { ok, failFromError } from '../../../result.js';

export class CreateProjectHandler implements CreateProjectSpec {
  constructor(private client: StitchMCPClient) { }

  async execute(input: CreateProjectInput): Promise<CreateProjectResult> {
    try {
      const data = await this.client.callTool<ProjectData>(
        'create_project',
        { title: input.title }
      );
      return ok(new Project(this.client, data.name, data));
    } catch (error) {
      return failFromError(error);
    }
  }
}
