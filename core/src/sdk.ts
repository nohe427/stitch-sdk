import { StitchMCPClient } from "./client.js";
import { Project } from "./project.js";
import { StitchConfigInput, ProjectData } from "./types.js";
import { ListProjectsHandler } from "./methods/stitch/listProjects/handler.js";
import { CreateProjectHandler } from "./methods/stitch/createProject/handler.js";
import { ConnectHandler } from "./methods/stitch/connect/handler.js";
import { GetProjectHandler } from "./methods/stitch/getProject/handler.js";
import type { Result } from "./result.js";

/**
 * Main entry point for the Stitch SDK.
 * Provides access to projects and their screens.
 */
export class Stitch {
  private client: StitchMCPClient;
  private _listProjects: ListProjectsHandler;
  private _createProject: CreateProjectHandler;
  private _connect: ConnectHandler;
  private _getProject: GetProjectHandler;

  constructor(config?: StitchConfigInput) {
    this.client = new StitchMCPClient(config);
    this._listProjects = new ListProjectsHandler(this.client);
    this._createProject = new CreateProjectHandler(this.client);
    this._connect = new ConnectHandler(this.client);
    this._getProject = new GetProjectHandler(this.client);
  }

  /**
   * Connect to the Stitch MCP server.
   */
  async connect(): Promise<Result<void>> {
    return this._connect.execute({});
  }

  /**
   * Access a project by ID.
   */
  project(id: string): Result<Project> {
    return { success: true, data: new Project(this.client, id) };
  }

  /**
   * Create a new project.
   */
  async createProject(title: string): Promise<Result<Project>> {
    return this._createProject.execute({ title });
  }

  /**
   * List all projects.
   */
  async projects(): Promise<Result<Project[]>> {
    return this._listProjects.execute({});
  }
}