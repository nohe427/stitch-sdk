import { describe, it, expect, vi } from "vitest";
import { ConnectHandler } from "../../../../src/methods/stitch/connect/handler.js";

describe("ConnectHandler", () => {
  it("returns success on successful connection", async () => {
    const mockClient = {
      connect: vi.fn().mockResolvedValue(undefined),
    };

    const handler = new ConnectHandler(mockClient as any);
    const result = await handler.execute({});

    expect(result.success).toBe(true);
    expect(mockClient.connect).toHaveBeenCalled();
  });

  it("returns failure on connection error", async () => {
    const mockClient = {
      connect: vi.fn().mockRejectedValue(new Error("Auth failed")),
    };

    const handler = new ConnectHandler(mockClient as any);
    const result = await handler.execute({});

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe("UNKNOWN_ERROR");
    }
  });
});
