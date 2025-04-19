// Export the main classes and types for use as a library
export { PrintifyAPI, type PrintifyShop } from './printify-api.js';
export { ReplicateClient } from './replicate-client.js';

// Export a function to create and configure the MCP server
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { PrintifyAPI } from "./printify-api.js";
import { ReplicateClient } from "./replicate-client.js";
import dotenv from "dotenv";

/**
 * Creates and configures a Printify MCP server
 * @param options Configuration options
 * @returns The configured MCP server
 */
export function createPrintifyMcpServer(options?: {
  printifyApiKey?: string;
  printifyShopId?: string;
  replicateApiToken?: string;
  serverName?: string;
  serverVersion?: string;
}) {
  // Load environment variables if not explicitly provided
  if (!options?.printifyApiKey || !options?.replicateApiToken) {
    dotenv.config();
  }

  // Create the MCP server
  const server = new McpServer({
    name: options?.serverName || "Printify-MCP",
    version: options?.serverVersion || "1.0.0"
  });

  // Initialize API clients
  const printifyApiKey = options?.printifyApiKey || process.env.PRINTIFY_API_KEY;
  const printifyShopId = options?.printifyShopId || process.env.PRINTIFY_SHOP_ID;
  const replicateApiToken = options?.replicateApiToken || process.env.REPLICATE_API_TOKEN;

  // Create the Printify API client if API key is provided
  let printifyClient: PrintifyAPI | null = null;
  if (printifyApiKey) {
    printifyClient = new PrintifyAPI(printifyApiKey, printifyShopId);
  }

  // Create the Replicate API client if API token is provided
  let replicateClient: ReplicateClient | null = null;
  if (replicateApiToken) {
    replicateClient = new ReplicateClient(replicateApiToken);
  }

  return {
    server,
    printifyClient,
    replicateClient,
    async initialize() {
      if (printifyClient) {
        await printifyClient.initialize();
      }
      return { printifyClient, replicateClient };
    }
  };
}

// Default export
export default createPrintifyMcpServer;
