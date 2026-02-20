import { describe, it, expect, vi } from "vitest";
import { ListScreensHandler } from "../../../../src/methods/project/listScreens/handler.js";
import { Screen } from "../../../../src/screen.js";

describe("ListScreensHandler", () => {
  it("returns success with screens array", async () => {
    const mockClient = {
      callTool: vi.fn().mockResolvedValue({
        screens: [
          { id: "s1", sourceScreen: "S1" },
          { id: "s2", sourceScreen: "S2" },
        ],
      }),
    };

    const handler = new ListScreensHandler(mockClient as any);
    const result = await handler.execute({ projectId: "proj-123" });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toHaveLength(2);
      expect(result.data[0]).toBeInstanceOf(Screen);
    }
  });

  it("returns failure on API error", async () => {
    const mockClient = {
      callTool: vi.fn().mockRejectedValue(new Error("API error")),
    };

    const handler = new ListScreensHandler(mockClient as any);
    const result = await handler.execute({ projectId: "proj-123" });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe("UNKNOWN_ERROR");
    }
  });
});
