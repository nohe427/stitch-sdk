import { describe, it, expect, vi } from "vitest";
import { GenerateScreenHandler } from "../../../../src/methods/project/generate/handler.js";
import { Screen } from "../../../../src/screen.js";

describe("GenerateScreenHandler", () => {
  it("returns success with generated screen", async () => {
    const mockClient = {
      callTool: vi.fn().mockResolvedValue({
        id: "screen-new",
        sourceScreen: "Generated",
      }),
    };

    const handler = new GenerateScreenHandler(mockClient as any);
    const result = await handler.execute({
      projectId: "proj-123",
      prompt: "Login page",
      deviceType: "DESKTOP",
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toBeInstanceOf(Screen);
      expect(result.data.id).toBe("screen-new");
    }
  });

  it("returns failure on API error", async () => {
    const mockClient = {
      callTool: vi.fn().mockRejectedValue(new Error("Generation failed")),
    };

    const handler = new GenerateScreenHandler(mockClient as any);
    const result = await handler.execute({
      projectId: "proj-123",
      prompt: "Login page",
      deviceType: "DESKTOP",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe("UNKNOWN_ERROR");
    }
  });
});
