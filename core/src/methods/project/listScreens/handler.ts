import type { ListScreensSpec, ListScreensInput, ListScreensResult } from './spec.js';
import type { StitchMCPClient } from '../../../client.js';
import { Screen } from '../../../screen.js';
import type { ScreenInstance } from '../../../types.js';
import { ok, failFromError } from '../../../result.js';

export class ListScreensHandler implements ListScreensSpec {
  constructor(private client: StitchMCPClient) {}

  async execute(input: ListScreensInput): Promise<ListScreensResult> {
    try {
      const res = await this.client.callTool<{ screens: ScreenInstance[] }>('list_screens', {
        projectId: input.projectId,
      });
      const screens = (res.screens || []).map(
        (s) => new Screen(this.client, input.projectId, s)
      );
      return ok(screens);
    } catch (error) {
      return failFromError(error);
    }
  }
}
