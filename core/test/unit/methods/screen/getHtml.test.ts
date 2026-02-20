import { describe, it, expect, vi } from "vitest";
import { GetScreenHtmlHandler } from "../../../../src/methods/screen/getHtml/handler.js";

describe("GetScreenHtmlHandler", () => {
  it("returns success with HTML content directly", async () => {
    const mockClient = {
      callTool: vi.fn().mockResolvedValue({
        htmlCode: "<div>Hello World</div>",
      }),
    };

    const handler = new GetScreenHtmlHandler(mockClient as any);
    const result = await handler.execute({
      projectId: "proj-123",
      screenId: "screen-123",
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toBe("<div>Hello World</div>");
    }
  });

  it("returns success with fetched content from URL", async () => {
    const fakeUrl = "https://example.com/screen.html";
    const fakeContent = "<html>Fetched Content</html>";

    const mockClient = {
      callTool: vi.fn().mockResolvedValue({
        uri: fakeUrl,
      }),
    };

    const originalFetch = globalThis.fetch;
    globalThis.fetch = vi.fn().mockResolvedValue({
      text: () => Promise.resolve(fakeContent),
    } as any);

    try {
      const handler = new GetScreenHtmlHandler(mockClient as any);
      const result = await handler.execute({
        projectId: "proj-123",
        screenId: "screen-123",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe(fakeContent);
      }
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it("returns failure on API error", async () => {
    const mockClient = {
      callTool: vi.fn().mockRejectedValue(new Error("API error")),
    };

    const handler = new GetScreenHtmlHandler(mockClient as any);
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
