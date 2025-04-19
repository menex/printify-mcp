#!/usr/bin/env node

// This is the CLI entry point for the package
// It loads the main server and starts it with stdio transport

import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import dotenv from "dotenv";
import { createPrintifyMcpServer } from "./exports.js";

// Load environment variables
dotenv.config();

async function main() {
  try {
    console.log("Starting Printify MCP Server...");
    
    // Create the server
    const { server, printifyClient, initialize } = createPrintifyMcpServer();
    
    // Initialize the Printify client
    await initialize();
    
    // Check if the Printify client was initialized
    if (!printifyClient) {
      console.warn("Warning: Printify API client could not be initialized. Make sure PRINTIFY_API_KEY is set in your environment variables.");
    } else {
      const currentShop = printifyClient.getCurrentShop();
      console.log(`Connected to Printify. Current shop: ${currentShop ? currentShop.title : 'None'}`);
    }
    
    // Start the server with stdio transport
    const transport = new StdioServerTransport();
    await server.connect(transport);
    
    console.log("Printify MCP Server started and connected via stdio");
  } catch (error) {
    console.error("Error starting Printify MCP Server:", error);
    process.exit(1);
  }
}

// Run the main function
main().catch(error => {
  console.error("Unhandled error:", error);
  process.exit(1);
});
