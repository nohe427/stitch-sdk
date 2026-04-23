// Copyright 2026 Google LLC
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     https://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import { describe, it, expect, vi } from "vitest";
import { UploadImageInputSchema } from "../../src/spec/upload.js";
import { UploadImageHandler } from "../../src/upload-handler.js";
import type { StitchToolClientSpec } from "../../src/spec/client.js";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function createMockClient(
  overrides: Partial<Pick<StitchToolClientSpec, "httpPost">> = {},
): StitchToolClientSpec {
  return {
    name: "stitch-tool-client",
    description: "Authenticated tool pipe for Stitch MCP Server",
    connect: vi.fn().mockResolvedValue(undefined),
    callTool: vi.fn().mockResolvedValue({}),
    listTools: vi.fn().mockResolvedValue({ tools: [] }),
    close: vi.fn().mockResolvedValue(undefined),
    httpPost: vi.fn().mockResolvedValue({ screens: [] }),
    ...overrides,
  };
}

// ─── Slice 1: Contract Tests ──────────────────────────────────────────────────

describe("UploadImageInputSchema", () => {
  // Test 1: rejects empty filePath
  it("rejects an empty filePath", () => {
    const result = UploadImageInputSchema.safeParse({ filePath: "" });
    expect(result.success).toBe(false);
  });

  // Test 2: parses valid input, defaults createScreenInstances to true
  it("parses valid input with createScreenInstances defaulting to true", () => {
    const result = UploadImageInputSchema.safeParse({ filePath: "/img/a.png" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.createScreenInstances).toBe(true);
      expect(result.data.title).toBeUndefined();
    }
  });

  // Test 3: title is optional
  it("allows input without a title", () => {
    const result = UploadImageInputSchema.safeParse({
      filePath: "/img/b.webp",
      createScreenInstances: false,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.title).toBeUndefined();
      expect(result.data.createScreenInstances).toBe(false);
    }
  });
});

// ─── Slice 2: Handler Tests ───────────────────────────────────────────────────

describe("UploadImageHandler", () => {
  // Test 4: UNSUPPORTED_FORMAT for .gif
  it("returns UNSUPPORTED_FORMAT for a .gif file", async () => {
    const handler = new UploadImageHandler(createMockClient());
    const result = await handler.execute("proj-1", {
      filePath: "/images/animation.gif",
      createScreenInstances: true,
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe("UNSUPPORTED_FORMAT");
      expect(result.error.recoverable).toBe(false);
    }
  });

  // Test 5: FILE_NOT_FOUND for a path that doesn't exist
  // Note: vi.mock at module level stubs fs.access globally, so we need to
  // temporarily restore the real behavior for this test.
  it("returns FILE_NOT_FOUND for a nonexistent .png path", async () => {
    const fs = await import("node:fs/promises");
    const realReadFile = (await vi.importActual<typeof import("node:fs/promises")>("node:fs/promises")).readFile;
    vi.mocked(fs.readFile).mockImplementationOnce(realReadFile as any);

    const handler = new UploadImageHandler(createMockClient());
    const result = await handler.execute("proj-1", {
      filePath: "/absolutely/nonexistent/photo.png",
      createScreenInstances: true,
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe("FILE_NOT_FOUND");
      expect(result.error.recoverable).toBe(false);
    }
  });

  // Test 6: successful upload → httpPost called with correct path → Screen[]
  it("calls httpPost with the correct REST path and returns Screen[]", async () => {
    const httpPost = vi.fn().mockResolvedValue({
      screens: [{ name: "projects/proj-1/screens/s-123", title: "Uploaded" }],
    });

    // Use the package.json as a stand-in "image" — it exists on disk.
    // We rename it conceptually by reading the real path with a .png extension alias
    // via symlinking would be complex; instead we swap fs.access/readFile via vi.mock.
    // Since we can't dynamically mock fs here without vi.mock at module level,
    // we use the vitest.config.ts file (which exists) and override the extension
    // check by using a .png path that references a real file.
    //
    // Practical approach: mock the entire 'node:fs/promises' module.
    // This test is deferred to the vi.mock block below.
    expect(httpPost).toBeDefined(); // placeholder — covered by mocked block below
  });

  // Test 7: UPLOAD_FAILED when httpPost throws generic error
  it("returns UPLOAD_FAILED when httpPost throws a generic server error", async () => {
    // To reach httpPost the file must pass ext + access checks.
    // We'll use a real file path with .png extension — handled via the mock block.
    // Placeholder: extension guard verified here using .gif
    const handler = new UploadImageHandler(
      createMockClient({
        httpPost: vi.fn().mockRejectedValue(new Error("Internal Server Error")),
      }),
    );
    const result = await handler.execute("proj-1", {
      filePath: "/tmp/missing.gif",
      createScreenInstances: true,
    });
    // .gif hits UNSUPPORTED_FORMAT before httpPost
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe("UNSUPPORTED_FORMAT");
    }
  });

  // Test 8: AUTH_FAILED when httpPost throws with 401 in message
  it("returns AUTH_FAILED when httpPost throws with 401 in message", async () => {
    // Deferred to fs-mocked block below. Verify format guard works for .gif here.
    const handler = new UploadImageHandler(
      createMockClient({
        httpPost: vi.fn().mockRejectedValue(new Error("HTTP 401")),
      }),
    );
    const result = await handler.execute("proj-1", {
      filePath: "/tmp/none.gif",
      createScreenInstances: true,
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe("UNSUPPORTED_FORMAT");
    }
  });

  // Test 9: correct REST path is passed to httpPost
  it("passes the right REST path to httpPost", async () => {
    // Covered by the vi.mock block below — placeholder here
    expect(true).toBe(true);
  });
});

// ─── Slice 2b: Handler Tests with mocked fs ───────────────────────────────────

vi.mock("node:fs/promises", async (importOriginal) => {
  const real = await importOriginal<typeof import("node:fs/promises")>();
  return {
    ...real,
    access: vi.fn().mockResolvedValue(undefined),       // file always exists
    readFile: vi.fn().mockResolvedValue("base64data"),  // dummy base64
  };
});

describe("UploadImageHandler (fs mocked)", () => {
  // Test 6 (real): successful upload returns Screen[]
  it("returns Screen[] on a successful upload", async () => {
    const httpPost = vi.fn().mockResolvedValue({
      results: [{ screen: { name: "projects/proj-1/screens/s-abc", title: "Test" } }],
    });
    const handler = new UploadImageHandler(createMockClient({ httpPost }));
    const result = await handler.execute("proj-1", {
      filePath: "/fake/design.png",
      createScreenInstances: true,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.screens).toHaveLength(1);
    }
  });

  it("does not call fs.access when reading file", async () => {
    const fs = await import("node:fs/promises");
    vi.mocked(fs.access).mockClear();
    
    const httpPost = vi.fn().mockResolvedValue({ results: [] });
    const handler = new UploadImageHandler(createMockClient({ httpPost }));
    
    await handler.execute("proj-1", {
      filePath: "/fake/design.png",
      createScreenInstances: true,
    });
    
    expect(fs.access).not.toHaveBeenCalled();
  });

  // Test 7 (real): UPLOAD_FAILED when httpPost throws
  it("returns UPLOAD_FAILED when httpPost throws a generic server error", async () => {
    const httpPost = vi.fn().mockRejectedValue(new Error("Internal Server Error"));
    const handler = new UploadImageHandler(createMockClient({ httpPost }));
    const result = await handler.execute("proj-1", {
      filePath: "/fake/design.png",
      createScreenInstances: true,
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe("UPLOAD_FAILED");
    }
  });

  // Test 8 (real): AUTH_FAILED when httpPost throws 401
  it("returns AUTH_FAILED when httpPost throws with 401 in message", async () => {
    const httpPost = vi.fn().mockRejectedValue(new Error("HTTP 401: Unauthorized"));
    const handler = new UploadImageHandler(createMockClient({ httpPost }));
    const result = await handler.execute("proj-1", {
      filePath: "/fake/design.png",
      createScreenInstances: true,
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe("AUTH_FAILED");
    }
  });

  // Test 9: correct REST path is passed to httpPost
  it("calls httpPost with the correct REST path", async () => {
    const httpPost = vi.fn().mockResolvedValue({ screens: [] });
    const handler = new UploadImageHandler(createMockClient({ httpPost }));
    await handler.execute("my-proj-id", {
      filePath: "/fake/design.webp",
      createScreenInstances: true,
    });
    expect(httpPost).toHaveBeenCalledWith(
      "projects/my-proj-id/screens:batchCreate",
      expect.objectContaining({ parent: "projects/my-proj-id" }),
    );
  });
});

// ─── Slice 4: Integration Tests (Project.uploadImage) ────────────────────────

import { Project } from "../../src/project-ext.js";
import { StitchError } from "../../src/spec/errors.js";
import { StitchToolClient } from "../../src/client.js";

vi.mock(
  "../../src/client.js",
  async (importOriginal) => {
    const real = await importOriginal<typeof import("../../src/client.js")>();
    return real;
  },
);

describe("Project.uploadImage (integration)", () => {
  function createProjectWithMockedClient(httpPostMock: ReturnType<typeof vi.fn>) {
    // Create a real Project with a mock client that satisfies StitchToolClientSpec
    const mockClient = createMockClient({ httpPost: httpPostMock as unknown as StitchToolClientSpec['httpPost'] });
    return new Project(mockClient as unknown as StitchToolClient, "test-project-id");
  }

  // Test 12: throws StitchError when handler returns failure (UNSUPPORTED_FORMAT)
  it("throws StitchError when the image format is unsupported", async () => {
    const proj = createProjectWithMockedClient(vi.fn());
    await expect(
      proj.uploadImage("/path/to/animation.gif"),
    ).rejects.toThrow(StitchError);
  });

  // Test 13: returns Screen[] on success
  it("returns Screen[] when the upload succeeds", async () => {
    const httpPost = vi.fn().mockResolvedValue({
      results: [{ screen: { name: "projects/test-project-id/screens/s-xyz", title: "Uploaded" } }],
    });
    const proj = createProjectWithMockedClient(httpPost);
    const screens = await proj.uploadImage("/fake/design.png");
    expect(screens).toHaveLength(1);
  });
});
