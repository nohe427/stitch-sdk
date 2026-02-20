import type { GetScreenImageSpec, GetScreenImageInput, GetScreenImageResult } from './spec.js';
import type { StitchMCPClient } from '../../../client.js';
import { ok, failFromError } from '../../../result.js';

export class GetScreenImageHandler implements GetScreenImageSpec {
  constructor(private client: StitchMCPClient) {}

  async execute(input: GetScreenImageInput): Promise<GetScreenImageResult> {
    try {
      const result = await this.client.callTool<any>('get_screen_image', {
        projectId: input.projectId,
        screenId: input.screenId,
      });
      return ok(result.uri || result.url || result.downloadUrl);
    } catch (error) {
      return failFromError(error);
    }
  }
}
