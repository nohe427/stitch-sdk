import { StitchMCPClient } from "./client.js";
import { Screen } from "./screen.js";
import { ProjectData } from "./types.js";
import { GenerateScreenHandler } from "./methods/project/generate/handler.js";
import { ListScreensHandler } from "./methods/project/listScreens/handler.js";
import type { Result } from "./result.js";

/**
 * Represents a Stitch Project.
 * Provides methods to generate and list screens.
 */
export class Project {
  private _generate: GenerateScreenHandler;
  private _listScreens: ListScreensHandler;

  constructor(
    private client: StitchMCPClient,
    public id: string,
    public data?: ProjectData
  ) {
    this._generate = new GenerateScreenHandler(client);
    this._listScreens = new ListScreensHandler(client);
  }

  /**
   * Generates a screen and returns a Screen object.
   */
  async generate(prompt: string, deviceType: "DESKTOP" | "MOBILE" = "DESKTOP"): Promise<Result<Screen>> {
    return this._generate.execute({
      projectId: this.id,
      prompt,
      deviceType,
    });
  }

  /**
   * List all screens in this project.
   */
  async screens(): Promise<Result<Screen[]>> {
    return this._listScreens.execute({ projectId: this.id });
  }
}
