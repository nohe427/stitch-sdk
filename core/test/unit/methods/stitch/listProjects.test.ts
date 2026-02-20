import { describe, it, expect, vi } from "vitest";
import { ListProjectsHandler } from "../../../../src/methods/stitch/listProjects/handler.js";
import { Project } from "../../../../src/project.js";

describe("ListProjectsHandler", () => {
  it("returns success with projects array", async () => {
    const mockClient = {
      callTool: vi.fn().mockResolvedValue({
        projects: [
          { name: "proj-1", title: "Project 1" },
          { name: "proj-2", title: "Project 2" },
        ],
      }),
    };

    const handler = new ListProjectsHandler(mockClient as any);
    const result = await handler.execute({});

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toHaveLength(2);
      expect(result.data[0]).toBeInstanceOf(Project);
    }
  });

  it("returns failure on network error", async () => {
    const mockClient = {
      callTool: vi.fn().mockRejectedValue(new Error("Network error")),
    };

    const handler = new ListProjectsHandler(mockClient as any);
    const result = await handler.execute({});

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe("UNKNOWN_ERROR");
      expect(result.error.message).toBe("Network error");
    }
  });
});
