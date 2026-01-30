import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  type Tool,
} from "@modelcontextprotocol/sdk/types.js";
import { Transport } from "@modelcontextprotocol/sdk/shared/transport.js";
import { StitchProxyConfigSchema, StitchProxyConfig, StitchProxySpec } from './spec/proxy.js';

/**
 * A proxy server that forwards MCP requests to Stitch.
 * Bypasses SDK transport layer to handle specific auth and JSON-RPC forwarding.
 */
export class StitchProxy implements StitchProxySpec {
  private config: StitchProxyConfig;
  private server: McpServer;
  private remoteTools: Tool[] = [];

  constructor(inputConfig?: Partial<StitchProxyConfig>) {
    const rawConfig = {
      apiKey: inputConfig?.apiKey || process.env.STITCH_API_KEY,
      url: inputConfig?.url || process.env.STITCH_MCP_URL,
      name: inputConfig?.name,
      version: inputConfig?.version,
    };

    // Validate config
    this.config = StitchProxyConfigSchema.parse(rawConfig);

    if (!this.config.apiKey) {
      throw new Error("StitchProxy requires an API key (STITCH_API_KEY)");
    }

    this.server = new McpServer(
      {
        name: this.config.name,
        version: this.config.version,
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupHandlers();
  }

  private setupHandlers() {
    // Handle tools/list - return cached tools from Stitch
    this.server.server.setRequestHandler(ListToolsRequestSchema, async () => {
      try {
        await this.refreshTools();
      } catch (err) {
        console.error("[stitch-proxy] Failed to refresh tools:", err);
      }
      return { tools: this.remoteTools };
    });

    // Handle tools/call - forward to Stitch
    this.server.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;
      console.error(`[stitch-proxy] Calling tool: ${name}`);

      try {
        const result = await this.forwardToStitch("tools/call", {
          name,
          arguments: args,
        });
        return result as { content: Array<{ type: string; text: string }> };
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        console.error(`[stitch-proxy] Tool call failed: ${errorMessage}`);
        return {
          content: [{ type: "text", text: `Error calling ${name}: ${errorMessage}` }],
          isError: true,
        };
      }
    });
  }

  private async forwardToStitch(method: string, params?: unknown): Promise<unknown> {
    const request = {
      jsonrpc: "2.0",
      method,
      params: params ?? {},
      id: Date.now(),
    };

    const response = await fetch(this.config.url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "X-Goog-Api-Key": this.config.apiKey!,
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Stitch API error (${response.status}): ${errorText}`);
    }

    const result = await response.json() as { error?: { message: string }; result?: unknown };

    if (result.error) {
      throw new Error(`Stitch RPC error: ${result.error.message}`);
    }

    return result.result;
  }

  private async initializeStitchConnection(): Promise<void> {
    // Send initialize request
    await this.forwardToStitch("initialize", {
      protocolVersion: "2024-11-05",
      capabilities: {},
      clientInfo: {
        name: this.config.name,
        version: this.config.version,
      },
    });

    // Send initialized notification (fire and forget)
    fetch(this.config.url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "X-Goog-Api-Key": this.config.apiKey!,
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        method: "notifications/initialized",
      }),
    }).catch((err) => {
        console.error("[stitch-proxy] Failed to send initialized notification:", err);
    });

    await this.refreshTools();
    console.error(`[stitch-proxy] Connected to Stitch, discovered ${this.remoteTools.length} tools`);
  }

  private async refreshTools() {
    const toolsResult = await this.forwardToStitch("tools/list", {}) as { tools: Tool[] };
    this.remoteTools = toolsResult.tools || [];
  }

  async start(transport: Transport): Promise<void> {
    console.error(`[stitch-proxy] Connecting to ${this.config.url}...`);
    await this.initializeStitchConnection();
    await this.server.connect(transport);
    console.error("[stitch-proxy] Proxy server running");
  }

  async close(): Promise<void> {
    await this.server.close();
  }
}
