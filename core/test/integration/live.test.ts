import { describe, it, expect, beforeAll } from "vitest";
import { Stitch } from "../../src/sdk.js";

const runIfConfigured = process.env.STITCH_ACCESS_TOKEN ? describe : describe.skip;

runIfConfigured("Stitch Live Integration", () => {
  let stitch: Stitch;
  let testProjectId: string;

  beforeAll(async () => {
    stitch = new Stitch();
    const connectResult = await stitch.connect();
    expect(connectResult.success).toBe(true);
  });

  it("should list projects", async () => {
    const result = await stitch.projects();
    expect(result.success).toBe(true);
    if (result.success) {
      expect(Array.isArray(result.data)).toBe(true);
      if (result.data.length > 0) {
        expect(result.data[0]).toHaveProperty("id");
      }
    }
  });

  it("should create and retrieve a project", async () => {
    const result = await stitch.createProject(`Test Project ${Date.now()}`);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.id).toContain("projects/");
      testProjectId = result.data.id;
      console.log("Created Project:", testProjectId);
    }
  }, 30000);
});
