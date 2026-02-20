import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { StitchMCPClient } from "../../src/client.js";
import { ZodError } from "zod";

// Mock child_process for gcloud calls
vi.mock("child_process", () => ({
  execSync: vi.fn().mockReturnValue("ya29.mocked_refreshed_token"),
}));

describe("StitchMCPClient", () => {
  const originalFetch = globalThis.fetch;
  const originalEnv = { ...process.env };

  beforeEach(() => {
    // Reset mocks and environment variables before each test
    vi.clearAllMocks();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    // Restore original state
    globalThis.fetch = originalFetch;
    delete (globalThis.fetch as any).__stitchPatched;
    process.env = originalEnv;
  });

  // --- NEW DUAL-AUTH TESTS ---
  it('should create client with API key only', () => {
    const client = new StitchMCPClient({ apiKey: 'test-key' });
    expect(client).toBeDefined();
  });

  it('should throw ZodError if no credentials provided', () => {
    // Ensure no env vars are set that could satisfy the validation
    delete process.env.STITCH_API_KEY;
    delete process.env.STITCH_ACCESS_TOKEN;
    delete process.env.GOOGLE_CLOUD_PROJECT;

    expect(() => new StitchMCPClient({})).toThrow(ZodError);
    expect(() => new StitchMCPClient()).toThrow(ZodError);
  });

  it('should throw if accessToken is provided without projectId', () => {
    expect(() => new StitchMCPClient({ accessToken: 'test-token' })).toThrow(ZodError);
  });

  it('should use STITCH_API_KEY env var as a fallback', () => {
    process.env.STITCH_API_KEY = 'env-key';
    const client = new StitchMCPClient();
    expect(client).toBeDefined();
  });

  it('should use STITCH_ACCESS_TOKEN and GOOGLE_CLOUD_PROJECT env vars', () => {
    process.env.STITCH_ACCESS_TOKEN = 'env-token';
    process.env.GOOGLE_CLOUD_PROJECT = 'env-project';
    const client = new StitchMCPClient();
    expect(client).toBeDefined();
  });

  it('should not validate token on connect when using API key', async () => {
    const fetchSpy = vi.fn();
    globalThis.fetch = fetchSpy;

    const client = new StitchMCPClient({ apiKey: 'test-key' });
    client['client'].connect = vi.fn(); // Mock the underlying connect

    await client.connect();

    // Fetch should NOT be called for token validation
    expect(fetchSpy).not.toHaveBeenCalled();
  });


  // --- EXISTING OAUTH TESTS (ADAPTED) ---
  it("should validate token on connect with OAuth", async () => {
    const fetchSpy = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ expires_in: 3600, scope: "cloud-platform" }),
    } as Response);
    globalThis.fetch = fetchSpy;

    const client = new StitchMCPClient({ accessToken: 'initial_token', projectId: 'test-project' });
    client['client'].connect = vi.fn();

    await client.connect();

    expect(fetchSpy).toHaveBeenCalledWith(
      expect.stringContaining("tokeninfo?access_token=initial_token")
    );
  });
});
