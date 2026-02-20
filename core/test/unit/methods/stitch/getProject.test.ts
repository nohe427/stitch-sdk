import { describe, it, expect } from "vitest";
import { GetProjectHandler } from "../../../../src/methods/stitch/getProject/handler.js";
import { Project } from "../../../../src/project.js";

describe("GetProjectHandler", () => {
  it("returns success with project wrapper", async () => {
    const mockClient = {};

    const handler = new GetProjectHandler(mockClient as any);
    const result = await handler.execute({ id: "proj-123" });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toBeInstanceOf(Project);
      expect(result.data.id).toBe("proj-123");
    }
  });
});
