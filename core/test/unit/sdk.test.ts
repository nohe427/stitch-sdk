import { describe, it, expect, vi, beforeEach, afterEach, Mock } from "vitest";
import { Screen, Project, Stitch } from "../../src/sdk.js";
import { StitchMCPClient } from "../../src/client.js";
import { ScreenInstance } from "../../src/types.js";

// Mock the StitchMCPClient class
vi.mock("../../src/client");

describe("SDK Unit Tests", () => {
  let mockClient: StitchMCPClient;

  beforeEach(() => {
    vi.clearAllMocks();
    // Create a mock instance of the client
    mockClient = new StitchMCPClient();
    mockClient.callTool = vi.fn();
  });

  describe("Screen Class", () => {
    const screenData: ScreenInstance = { id: "screen-123", sourceScreen: "Login" };
    const projectId = "proj-123";

    it("getHtml should return raw HTML directly if provided", async () => {
      const screen = new Screen(mockClient, projectId, screenData);

      // Mock callTool to return HTML directly
      (mockClient.callTool as Mock).mockResolvedValue({
        htmlCode: "<div>Hello World</div>"
      });

      const html = await screen.getHtml();

      expect(mockClient.callTool).toHaveBeenCalledWith("get_screen_html", {
        projectId: projectId,
        screenId: screenData.id
      });
      expect(html).toBe("<div>Hello World</div>");
    });

    it("getHtml should fetch content if URL is provided", async () => {
      const screen = new Screen(mockClient, projectId, screenData);
      const fakeUrl = "https://example.com/screen.html";
      const fakeContent = "<html>Fetched Content</html>";

      // Mock callTool to return a URL
      (mockClient.callTool as Mock).mockResolvedValue({
        uri: fakeUrl
      });

      // Mock global fetch
      const originalFetch = globalThis.fetch;
      globalThis.fetch = vi.fn().mockResolvedValue({
        text: () => Promise.resolve(fakeContent)
      } as any);

      try {
        const html = await screen.getHtml();

        expect(mockClient.callTool).toHaveBeenCalledWith("get_screen_html", {
          projectId: projectId,
          screenId: screenData.id
        });
        expect(globalThis.fetch).toHaveBeenCalledWith(fakeUrl);
        expect(html).toBe(fakeContent);
      } finally {
        globalThis.fetch = originalFetch;
      }
    });

    it("getImage should return the image URL", async () => {
      const screen = new Screen(mockClient, projectId, screenData);
      const imageUrl = "https://example.com/image.png";

      // Mock callTool to return image URL
      (mockClient.callTool as Mock).mockResolvedValue({
        url: imageUrl
      });

      const result = await screen.getImage();

      expect(mockClient.callTool).toHaveBeenCalledWith("get_screen_image", {
        projectId: projectId,
        screenId: screenData.id
      });
      expect(result).toBe(imageUrl);
    });
  });

  describe("Project Class", () => {
    const projectId = "proj-abc";

    it("generate should call correct tool and return a Screen instance", async () => {
      const project = new Project(mockClient, projectId);
      const prompt = "Login page";
      const mockResponse: ScreenInstance = { id: "new-screen-1", sourceScreen: "Generated" };

      (mockClient.callTool as Mock).mockResolvedValue(mockResponse);

      const screen = await project.generate(prompt);

      expect(mockClient.callTool).toHaveBeenCalledWith("generate_screen_from_text", {
        projectId: projectId,
        prompt: prompt,
        deviceType: "DESKTOP"
      });

      expect(screen).toBeInstanceOf(Screen);
      expect(screen.id).toBe(mockResponse.id);
      expect(screen.projectId).toBe(projectId);
    });

    it("screens should list screens and return Screen instances", async () => {
      const project = new Project(mockClient, projectId);
      const mockResponse = {
        screens: [
          { id: "s1", sourceScreen: "S1" },
          { id: "s2", sourceScreen: "S2" }
        ]
      };

      (mockClient.callTool as Mock).mockResolvedValue(mockResponse);

      const screens = await project.screens();

      expect(mockClient.callTool).toHaveBeenCalledWith("list_screens", {
        projectId: projectId
      });

      expect(screens).toHaveLength(2);
      expect(screens[0]).toBeInstanceOf(Screen);
      expect(screens[1]).toBeInstanceOf(Screen);
      expect(screens[0].id).toBe("s1");
    });
  });
});
