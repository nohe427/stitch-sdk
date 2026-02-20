import { describe, it, expect, vi } from "vitest";
import { GetScreenImageHandler } from "../../../../src/methods/screen/getImage/handler.js";

describe("GetScreenImageHandler", () => {
  it("returns success with image URL", async () => {
    const imageUrl = "https://example.com/image.png";
    const mockClient = {
      callTool: vi.fn().mockResolvedValue({
        url: imageUrl,
      }),
    };

    const handler = new GetScreenImageHandler(mockClient as any);
    const result = await handler.execute({
      projectId: "proj-123",
      screenId: "screen-123",
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toBe(imageUrl);
    }
  });

  it("returns failure on API error", async () => {
    const mockClient = {
      callTool: vi.fn().mockRejectedValue(new Error("API error")),
    };

    const handler = new GetScreenImageHandler(mockClient as any);
    const result = await handler.execute({
      projectId: "proj-123",
      screenId: "screen-123",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe("UNKNOWN_ERROR");
    }
  });
});
