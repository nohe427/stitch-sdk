import type { GetProjectSpec, GetProjectInput, GetProjectResult } from './spec.js';
import type { StitchMCPClient } from '../../../client.js';
import { Project } from '../../../project.js';
import { ok } from '../../../result.js';

export class GetProjectHandler implements GetProjectSpec {
  constructor(private client: StitchMCPClient) { }

  async execute(input: GetProjectInput): Promise<GetProjectResult> {
    // This is a synchronous operation - just creates a Project wrapper
    // No network call needed, so no try/catch required
    return ok(new Project(this.client, input.id));
  }
}
