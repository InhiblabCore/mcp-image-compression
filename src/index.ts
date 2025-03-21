import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import path from 'path';
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
        urls: {
          type: "string[]",
          description: "URL of the image to compress,If it's a local file, do not add any prefix.",
        },
        quantity: {
          type: "number",
          description: "Number of transcripts to return",
          default: 80
        },
        format: {
          type: "string",
          description: "Image format",
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

    this.downloadDir = process.env.IMAGE_COMPRESSION_DOWNLOAD_DIR || ''
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
    const { urls = [], quality = 80, format = null } = args;

    const imageSources = (urls as string[])?.filter((url) => isImageSource(url));
    if (this.downloadDir === '') {
      throw new McpError(
        ErrorCode.InvalidParams,
        `downloadDir is empty, please set the environment variable IMAGE_COMPRESSION_DOWNLOAD_DIR`
      );
    }

    let outputPaths = []
    switch (name) {
      case "image_compression": {
        try {
          const isMutipleUrls = imageSources.length > 1;
          const downloadDir = isMutipleUrls ? path.join(this.downloadDir, 'thumbs') : this.downloadDir;
          // 循环处理每个 URL
          // 压缩并存储图片
          for (const key in imageSources) {
            const imageUrl = imageSources[key];
            const outputPath = await compressAndStoreImage(imageUrl, downloadDir, quality, format)
            outputPaths.push(outputPath)
          }
          return {
            content: [{
              type: "text",
              text: `success image compression ${outputPaths}`,
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