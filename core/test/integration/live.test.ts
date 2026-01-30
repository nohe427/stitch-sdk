import { describe, it, expect, beforeAll } from "vitest";
import { Stitch } from "../../src/sdk.js";

const runIfConfigured = process.env.STITCH_ACCESS_TOKEN ? describe : describe.skip;

runIfConfigured("Stitch Live Integration", () => {
  let stitch: Stitch;
  let testProjectId: string;

  beforeAll(async () => {
    stitch = new Stitch();
    await stitch.connect();
  });

  it("should list projects", async () => {
    const projects = await stitch.projects();
    expect(Array.isArray(projects)).toBe(true);
    if (projects.length > 0) {
      expect(projects[0]).toHaveProperty("name");
    }
  });

  it("should create and retrieve a project", async () => {
    const project = await stitch.createProject(`Test Project ${Date.now()}`);
    expect(project.id).toContain("projects/");
    testProjectId = project.id;
    console.log("Created Project:", testProjectId);
  }, 30000);
});
