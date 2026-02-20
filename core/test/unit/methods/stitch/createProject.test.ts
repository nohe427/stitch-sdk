import { describe, it, expect, vi } from "vitest";
import { CreateProjectHandler } from "../../../../src/methods/stitch/createProject/handler.js";
import { Project } from "../../../../src/project.js";

describe("CreateProjectHandler", () => {
  it("returns success with created project", async () => {
    const mockClient = {
      callTool: vi.fn().mockResolvedValue({
        name: "proj-new",
        title: "New Project",
      }),
    };

    const handler = new CreateProjectHandler(mockClient as any);
    const result = await handler.execute({ title: "New Project" });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toBeInstanceOf(Project);
      expect(result.data.id).toBe("proj-new");
    }
  });

  it("returns failure on API error", async () => {
    const mockClient = {
      callTool: vi.fn().mockRejectedValue(new Error("API error")),
    };

    const handler = new CreateProjectHandler(mockClient as any);
    const result = await handler.execute({ title: "New Project" });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe("UNKNOWN_ERROR");
    }
  });
});
