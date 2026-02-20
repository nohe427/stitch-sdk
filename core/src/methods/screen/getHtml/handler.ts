import type { GetScreenHtmlSpec, GetScreenHtmlInput, GetScreenHtmlResult } from './spec.js';
import type { StitchMCPClient } from '../../../client.js';
import { ok, failFromError } from '../../../result.js';

export class GetScreenHtmlHandler implements GetScreenHtmlSpec {
  constructor(private client: StitchMCPClient) {}

  async execute(input: GetScreenHtmlInput): Promise<GetScreenHtmlResult> {
    try {
      const result = await this.client.callTool<any>('get_screen_html', {
        projectId: input.projectId,
        screenId: input.screenId,
      });

      // Handle signed URL vs direct content
      const url = result.uri || result.url || result.downloadUrl;
      if (url) {
        const res = await fetch(url);
        return ok(await res.text());
      }
      return ok(result.htmlCode || '');
    } catch (error) {
      return failFromError(error);
    }
  }
}
