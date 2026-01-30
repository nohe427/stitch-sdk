import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { StitchConfigSchema, StitchConfig, StitchMCPClientSpec } from './spec/client.js';
import pkg from '../package.json' with { type: 'json' };

/**
 * A robust, authenticated driver for the Stitch MCP Server.
 * Handles auth injection, retries, and transport negotiation.
 */
export class StitchMCPClient implements StitchMCPClientSpec {
  name: 'stitch-mcp-client' = 'stitch-mcp-client';
  description: 'Authenticated driver for Stitch MCP Server' = 'Authenticated driver for Stitch MCP Server';

  private client: Client;
  private transport: StreamableHTTPClientTransport | null = null;
  private config: StitchConfig;
  private isConnected: boolean = false;

  constructor(inputConfig?: Partial<StitchConfig>) {
    const rawConfig = {
      accessToken: inputConfig?.accessToken || process.env.STITCH_ACCESS_TOKEN,
      apiKey: inputConfig?.apiKey || process.env.STITCH_API_KEY,
      projectId: inputConfig?.projectId || process.env.GOOGLE_CLOUD_PROJECT,
      baseUrl: inputConfig?.baseUrl,
      timeout: inputConfig?.timeout,
    };
    this.config = StitchConfigSchema.parse(rawConfig);

    this.client = new Client(
      { name: "stitch-core-client", version: pkg.version },
      { capabilities: {} }
    );
  }

  /**
   * Validates the token against Google's tokeninfo endpoint.
   */
  private async validateToken(token: string) {
    const checkUrl = `https://www.googleapis.com/oauth2/v3/tokeninfo?access_token=${encodeURIComponent(this.config.accessToken!)}`;
    let response = await fetch(checkUrl);

    if (!response.ok) {
      console.warn("⚠️ Initial token validation failed. Attempting refresh...");
      try {
        this.config.accessToken = token;
        // Re-validate
        response = await fetch(`https://www.googleapis.com/oauth2/v3/tokeninfo?access_token=${encodeURIComponent(this.config.accessToken!)}`);
        if (!response.ok) throw new Error("Refreshed token is invalid.");
      } catch (error) {
        throw new Error(`Authentication Failed: ${(error as Error).message}`);
      }
    }
  }

  /**
   * Monkey-patches global fetch to ensure headers are ALWAYS present.
   * This fixes issues where SDK layers might drop headers on redirects or retries.
   */
  private installNetworkInterceptor() {
    const originalFetch = globalThis.fetch;
    if ((originalFetch as any).__stitchPatched) return;

    globalThis.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      let url = input.toString();
      if (input instanceof Request) url = input.url;

      // Only intercept Stitch calls
      if (url.startsWith(this.config.baseUrl)) {
        const newHeaders = new Headers(init?.headers);

        if (this.config.apiKey) {
          newHeaders.set("X-Goog-Api-Key", this.config.apiKey);
          // No X-Goog-User-Project for API key auth
        } else {
          newHeaders.set("Authorization", `Bearer ${this.config.accessToken}`);
          newHeaders.set("X-Goog-User-Project", this.config.projectId!);
        }

        newHeaders.set("Accept", "application/json, text/event-stream");

        // Ensure Content-Type for POST
        if (!newHeaders.has("Content-Type") && (init?.method === "POST" || (input instanceof Request && input.method === "POST"))) {
          newHeaders.set("Content-Type", "application/json");
        }

        const newInit: RequestInit = { ...init, headers: newHeaders };

        // Preserve method if it was in the Request object but not in init
        if (input instanceof Request && !newInit.method) {
          newInit.method = input.method;
        }

        return originalFetch(url, newInit);
      }
      return originalFetch(input, init);
    };
    (globalThis.fetch as any).__stitchPatched = true;
  }

  async connect() {
    if (this.isConnected) return;

    if (!this.config.apiKey) {
      await this.validateToken(this.config.accessToken!); // OAuth only
    }
    this.installNetworkInterceptor();

    // Transport gets the URL; headers are handled by interceptor
    this.transport = new StreamableHTTPClientTransport(new URL(this.config.baseUrl));

    this.transport.onerror = (err) => {
      console.error("Stitch Transport Error:", err);
      this.isConnected = false;
    };

    await this.client.connect(this.transport);
    this.isConnected = true;
  }

  /**
   * Generic tool caller with type support and error parsing.
   */
  async callTool<T>(name: string, args: Record<string, any>): Promise<T> {
    if (!this.isConnected) await this.connect();

    const result = await this.client.callTool(
      { name, arguments: args },
      undefined,
      { timeout: this.config.timeout }
    );

    if (result.isError) {
      const errorText = (result.content as any[]).map(c => (c.type === 'text' ? c.text : '')).join('');
      throw new Error(`Tool Call Failed [${name}]: ${errorText}`);
    }

    // Stitch specific parsing: Check structuredContent first, then JSON in text
    const anyResult = result as any;
    if (anyResult.structuredContent) return anyResult.structuredContent as T;

    const textContent = (result.content as any[]).find(c => c.type === 'text');
    if (textContent && textContent.type === 'text') {
      try {
        return JSON.parse(textContent.text) as T;
      } catch {
        return textContent.text as unknown as T;
      }
    }

    return anyResult as T;
  }

  async getCapabilities() {
    if (!this.isConnected) await this.connect();
    return this.client.listTools();
  }

  async close() {
    if (this.transport) {
      await this.transport.close();
      this.isConnected = false;
    }
  }
}
