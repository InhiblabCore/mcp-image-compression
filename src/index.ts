import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { FastMCP } from 'fastmcp'
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ErrorCode,
  McpError,
  Tool,
  CallToolResult,
} from "@modelcontextprotocol/sdk/types.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { compressAndStoreImage, isImageSource } from "./common.js";

const TOOLS: Tool[] = [
  {
    name: "image_compression",
    description: "Compress an image",
    inputSchema: {
      type: "object",
      properties: {
        url: {
          type: "string",
          description: "URL of the image to compress,If it's a local file, do not add any prefix.",
        },
        quantity: {
          type: "number",
          description: "Number of transcripts to return",
          default: 0.8
        }
      },
      required: ["url", "quantity"]
    }
  }
];




class MCPImageCompression {
  server: Server;
  downloadDir: string;
  constructor() {
    this.server = new Server({
      name: "mcp-image-compression",
      version: "1.0.0",
    }, {
      capabilities: {
        tools: {},
      },
    });

    // 从环境变量中取到下载目录
    // this.downloadDir = process.env.DOWNLOAD_DIR || "./tmp";

    // console.log("this.downloadDir", this.downloadDir);
    this.downloadDir = '/Users/yangjie/Downloads'
    this.setupHandlers();
    this.setupErrorHandling();
  }
  private setupErrorHandling(): void {
    this.server.onerror = (error) => {
      console.error("[MCP Error]", error);
    };

    process.on('SIGINT', async () => {
      await this.stop();
      process.exit(0);
    });
  }


  private setupHandlers() {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: TOOLS
    }));

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) =>
      this.handleToolCall(request.params.name, request.params.arguments ?? {})
    );
  }
  /**
   * Handles tool call requests
   */
  private async handleToolCall(name: string, args: any): Promise<CallToolResult> {
    const { url = '' } = args;
    if (!isImageSource(url)) {
      throw new McpError(
        ErrorCode.InvalidParams,
        `Invalid Image URL: ${url}`
      );
    }

    switch (name) {
      case "image_compression": {
        try {
          const outputPath = await compressAndStoreImage(url, this.downloadDir)
          return {
            content: [{
              type: "text",
              text: `success image compression ${outputPath}`,
            }],
            metadata: {
              timestamp: new Date().toISOString(),
            },
            isError: false
          }
        } catch (error) {
          if (error instanceof McpError) {
            throw error;
          }

          throw new McpError(
            ErrorCode.InternalError,
            `Failed to process transcript: ${(error as Error).message}`
          );
        }
      }
      default: {
        throw new McpError(ErrorCode.MethodNotFound, `Tool ${name} not found`, {
          code: ErrorCode.MethodNotFound,
          message: `Tool ${name} not found`
        });
      }

    }
  }
  /**
   * Starts the server
   */
  async start(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);

  }
  /**
   * Stops the server
   */
  async stop(): Promise<void> {
    try {
      await this.server.close();
    } catch (error) {
      console.error('Error while stopping server:', error);
    }
  }
}


// Main execution
async function main() {
  const server = new MCPImageCompression();

  try {
    await server.start();
  } catch (error) {
    console.error("Server failed to start:", error);
    process.exit(1);
  }
}

main().catch((error) => {
  console.error("Fatal server error:", error);
  process.exit(1);
});