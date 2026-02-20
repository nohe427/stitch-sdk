import type { GenerateScreenSpec, GenerateScreenInput, GenerateScreenResult } from './spec.js';
import type { StitchMCPClient } from '../../../client.js';
import { Screen } from '../../../screen.js';
import type { ScreenInstance } from '../../../types.js';
import { ok, failFromError } from '../../../result.js';

export class GenerateScreenHandler implements GenerateScreenSpec {
  constructor(private client: StitchMCPClient) {}

  async execute(input: GenerateScreenInput): Promise<GenerateScreenResult> {
    try {
      const data = await this.client.callTool<ScreenInstance>('generate_screen_from_text', {
        projectId: input.projectId,
        prompt: input.prompt,
        deviceType: input.deviceType,
      });
      return ok(new Screen(this.client, input.projectId, data));
    } catch (error) {
      return failFromError(error);
    }
  }
}
