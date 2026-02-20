import { StitchMCPClient } from "./client.js";
import { ScreenInstance } from "./types.js";
import { GetScreenHtmlHandler } from "./methods/screen/getHtml/handler.js";
import { GetScreenImageHandler } from "./methods/screen/getImage/handler.js";
import type { Result } from "./result.js";

/**
 * Represents a specific Screen.
 * Allows fetching heavy assets (HTML/Image) only when requested.
 */
export class Screen {
  private _getHtml: GetScreenHtmlHandler;
  private _getImage: GetScreenImageHandler;

  constructor(
    private client: StitchMCPClient,
    public projectId: string,
    public data: ScreenInstance
  ) {
    this._getHtml = new GetScreenHtmlHandler(client);
    this._getImage = new GetScreenImageHandler(client);
  }

  get id() { return this.data.id; }

  /**
   * Fetches the raw HTML code for this screen.
   */
  async getHtml(): Promise<Result<string>> {
    return this._getHtml.execute({
      projectId: this.projectId,
      screenId: this.id,
    });
  }

  /**
   * Fetches the screenshot URL for this screen.
   */
  async getImage(): Promise<Result<string>> {
    return this._getImage.execute({
      projectId: this.projectId,
      screenId: this.id,
    });
  }
}
