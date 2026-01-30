import { StitchMCPClient } from "./client.js";
import { StitchConfigInput, ProjectData, ScreenInstance, GenerateScreenParams } from "./types.js";

/**
 * Represents a specific Screen.
 * Allows fetching heavy assets (HTML/Image) only when requested.
 */
export class Screen {
  constructor(
    private client: StitchMCPClient,
    public projectId: string,
    public data: ScreenInstance
  ) { }

  get id() { return this.data.id; }

  /**
   * Fetches the raw HTML code for this screen.
   * Maps to: get_screen_html
   */
  async getHtml(): Promise<string> {
    const result = await this.client.callTool<any>("get_screen_html", {
      projectId: this.projectId,
      screenId: this.id
    });

    // Handle signed URL vs direct content
    const url = result.uri || result.url || result.downloadUrl;
    if (url) {
      const res = await fetch(url);
      return res.text();
    }
    return result.htmlCode || "";
  }

  /**
   * Fetches the screenshot URL or binary for this screen.
   * Maps to: get_screen_image
   */
  async getImage(): Promise<string> {
    const result = await this.client.callTool<any>("get_screen_image", {
      projectId: this.projectId,
      screenId: this.id
    });
    return result.uri || result.url || result.downloadUrl;
  }
}

export class Project {
  constructor(
    private client: StitchMCPClient,
    public id: string,
    public data?: ProjectData
  ) { }

  /**
   * Generates a screen and returns a Screen object.
   */
  async generate(prompt: string, deviceType: "DESKTOP" | "MOBILE" = "DESKTOP"): Promise<Screen> {
    const data = await this.client.callTool<ScreenInstance>("generate_screen_from_text", {
      projectId: this.id,
      prompt,
      deviceType
    });

    // Return the Screen wrapper, not just the raw data
    return new Screen(this.client, this.id, data);
  }

  /**
   * List all screens in this project.
   */
  async screens(): Promise<Screen[]> {
    const res = await this.client.callTool<{ screens: ScreenInstance[] }>("list_screens", {
      projectId: this.id
    });

    // Map raw data to Screen objects
    return (res.screens || []).map((s: ScreenInstance) => new Screen(this.client, this.id, s));
  }
}

export class Stitch {
  private client: StitchMCPClient;

  constructor(config?: StitchConfigInput) {
    this.client = new StitchMCPClient(config);
  }

  async connect() {
    await this.client.connect();
  }

  /**
   * Access a project by ID.
   */
  project(id: string): Project {
    return new Project(this.client, id);
  }

  /**
   * Create a new project.
   */
  async createProject(title: string): Promise<Project> {
    const data = await this.client.callTool<ProjectData>("create_project", { title });
    return new Project(this.client, data.name, data);
  }

  /**
   * List all projects.
   */
  async projects(): Promise<Project[]> {
    const res = await this.client.callTool<{ projects: ProjectData[] }>("list_projects", {});
    return (res.projects || []).map((p: ProjectData) => new Project(this.client, p.name, p));
  }
}

/** Lazily-initialized default Stitch instance */
let _stitch: Stitch | null = null;

function getStitchInstance(): Stitch {
  if (!_stitch) {
    _stitch = new Stitch({
      apiKey: process.env.STITCH_API_KEY,
      baseUrl: process.env.STITCH_HOST || "https://stitch.googleapis.com/mcp",
    });
  }
  return _stitch;
}

/**
 * Default Stitch instance using environment variables.
 * Lazily initialized on first access.
 * 
 * @example
 * import { stitch } from '@google/stitch-sdk';
 * const projects = await stitch.projects();
 */
export const stitch = new Proxy<Stitch>({} as Stitch, {
  get(_target, prop: string | symbol) {
    const instance = getStitchInstance();
    const value = instance[prop as keyof Stitch];
    // Bind methods to preserve `this` context
    if (typeof value === 'function') {
      return value.bind(instance);
    }
    return value;
  },
});