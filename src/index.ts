#!/usr/bin/env node

import { McpServer, ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { PrintifyAPI } from "./printify-api.js";
import { ReplicateClient } from "./replicate-client.js";
import dotenv from "dotenv";
import * as fs from "fs";
import sharp from "sharp";
import * as path from "path";

// Export the main classes and types for use as a library
export { PrintifyAPI, type PrintifyShop } from './printify-api.js';
export { ReplicateClient } from './replicate-client.js';
export { createPrintifyMcpServer } from './exports.js';

// Load environment variables from .env file
dotenv.config();

// Create an MCP server
const server = new McpServer({
  name: "Printify-MCP",
  version: "1.0.0"
});

// Initialize API clients
let printifyClient: PrintifyAPI | null = null;
let replicateClient: ReplicateClient | null = null;

// Helper function to convert images using Sharp
async function convertImageWithSharp(inputPath: string): Promise<{ buffer: Buffer, mimeType: string }> {
  try {
    console.log(`Converting image with Sharp: ${inputPath}`);

    // Get file extension to determine output format
    const fileExt = path.extname(inputPath).toLowerCase().substring(1);
    const outputFormat = fileExt === 'jpg' || fileExt === 'jpeg' ? 'jpeg' :
                        fileExt === 'svg' ? 'svg' : 'png';

    // Process the image with sharp
    let sharpInstance = sharp(inputPath);

    // Convert to the appropriate format
    if (outputFormat === 'jpeg') {
      sharpInstance = sharpInstance.jpeg({ quality: 100 });
    } else if (outputFormat === 'png') {
      sharpInstance = sharpInstance.png({ quality: 100 });
    }

    // Get the buffer
    const buffer = await sharpInstance.toBuffer();

    // Determine the MIME type
    const mimeType = outputFormat === 'jpeg' ? 'image/jpeg' :
                    outputFormat === 'svg' ? 'image/svg+xml' : 'image/png';

    console.log(`Image converted successfully: ${buffer.length} bytes, mime type: ${mimeType}`);

    return { buffer, mimeType };
  } catch (error) {
    console.error('Error converting image with Sharp:', error);
    throw error;
  }
}

// Auto-initialize the API clients when the server starts
(async () => {
  try {
    // Initialize Printify API client
    const printifyApiKey = process.env.PRINTIFY_API_KEY;

    if (!printifyApiKey) {
      console.error("PRINTIFY_API_KEY environment variable is not set. The Printify API client will not be initialized.");
    } else {
      // Create the client with the API key and shop ID if available
      printifyClient = new PrintifyAPI(printifyApiKey, process.env.PRINTIFY_SHOP_ID);

      // Initialize the client and fetch shops
      const shops = await printifyClient.initialize();

      // If PRINTIFY_SHOP_ID is set in environment variables, use it
      if (process.env.PRINTIFY_SHOP_ID) {
        console.log(`Printify SDK client initialized with shop ID: ${process.env.PRINTIFY_SHOP_ID}`);
      } else if (shops.length > 0) {
        // Otherwise, use the first shop
        console.log(`Printify SDK client initialized with shop ID: ${shops[0].id} (${shops[0].title})`);
      } else {
        console.log("Printify SDK client initialized, but no shops were found.");
      }
    }

    // Initialize Replicate API client if environment variable is set
    const replicateApiToken = process.env.REPLICATE_API_TOKEN;

    if (!replicateApiToken) {
      console.error("REPLICATE_API_TOKEN environment variable is not set. The Replicate API client will not be initialized.");
    } else {
      replicateClient = new ReplicateClient(replicateApiToken);
      console.log('Replicate API client initialized successfully.');
    }
  } catch (error) {
    console.error("Error initializing API clients:", error);
  }
})();

// Get Printify status tool
server.tool(
  "get-printify-status",
  {},
  async () => {
    try {
      if (!printifyClient) {
        return {
          content: [{
            type: "text",
            text: "Printify API client is not initialized. The PRINTIFY_API_KEY environment variable may not be set."
          }],
          isError: true
        };
      }

      const currentShop = printifyClient.getCurrentShop();
      const shops = await printifyClient.getShops();

      return {
        content: [{
          type: "text",
          text: `Printify API Status:\n\n` +
                `Connected: ${printifyClient ? 'Yes' : 'No'}\n` +
                `Available Shops: ${shops.length}\n` +
                `Current Shop: ${currentShop ? `${currentShop.title} (ID: ${currentShop.id})` : 'None'}`
        }]
      };
    } catch (error: any) {
      return {
        content: [{
          type: "text",
          text: `Error getting Printify status: ${error.message}`
        }],
        isError: true
      };
    }
  }
);

// List shops tool
server.tool(
  "list-shops",
  {},
  async () => {
    try {
      if (!printifyClient) {
        return {
          content: [{
            type: "text",
            text: "Printify API client is not initialized. The PRINTIFY_API_KEY environment variable may not be set."
          }],
          isError: true
        };
      }

      const shops = await printifyClient.getShops();
      const currentShopId = printifyClient.getCurrentShopId();

      if (shops.length === 0) {
        return {
          content: [{
            type: "text",
            text: "No shops found in your Printify account."
          }]
        };
      }

      const shopsText = shops.map((shop: any) => {
        const isCurrent = shop.id.toString() === currentShopId;
        return `${isCurrent ? '→ ' : '  '}${shop.title} (ID: ${shop.id}, Channel: ${shop.sales_channel})`;
      }).join('\n');

      return {
        content: [{
          type: "text",
          text: `Available Printify Shops:\n\n${shopsText}`
        }]
      };
    } catch (error: any) {
      return {
        content: [{
          type: "text",
          text: `Error listing shops: ${error.message}`
        }],
        isError: true
      };
    }
  }
);

// Switch shop tool
server.tool(
  "switch-shop",
  {
    shopId: z.string().describe("The ID of the shop to switch to")
  },
  async ({ shopId }) => {
    try {
      if (!printifyClient) {
        return {
          content: [{
            type: "text",
            text: "Printify API client is not initialized. The PRINTIFY_API_KEY environment variable may not be set."
          }],
          isError: true
        };
      }

      const shops = await printifyClient.getShops();
      const shop = shops.find((s: any) => s.id.toString() === shopId);

      if (!shop) {
        return {
          content: [{
            type: "text",
            text: `Shop with ID ${shopId} not found. Use the list-shops tool to see available shops.`
          }],
          isError: true
        };
      }

      printifyClient.setShopId(shopId);

      return {
        content: [{
          type: "text",
          text: `Switched to shop: ${shop.title} (ID: ${shop.id}, Channel: ${shop.sales_channel})`
        }]
      };
    } catch (error: any) {
      return {
        content: [{
          type: "text",
          text: `Error switching shop: ${error.message}`
        }],
        isError: true
      };
    }
  }
);

// This tool is now replaced by the list-shops tool

// List products tool
server.tool(
  "list-products",
  {
    page: z.number().optional().default(1).describe("Page number"),
    limit: z.number().optional().default(10).describe("Number of products per page")
  },
  async ({ page, limit }) => {
    try {
      if (!printifyClient) {
        return {
          content: [{
            type: "text",
            text: "Printify API client is not initialized. The PRINTIFY_API_KEY environment variable may not be set."
          }],
          isError: true
        };
      }

      const currentShop = printifyClient.getCurrentShop();
      if (!currentShop) {
        return {
          content: [{
            type: "text",
            text: "No shop is currently selected. Use the list-shops and switch-shop tools to select a shop."
          }],
          isError: true
        };
      }

      const products = await printifyClient.getProducts(page, limit);

      return {
        content: [{
          type: "text",
          text: `Products in shop "${currentShop.title}":\n\n${JSON.stringify(products, null, 2)}`
        }]
      };
    } catch (error: any) {
      return {
        content: [{
          type: "text",
          text: `Error listing products: ${error.message}`
        }],
        isError: true
      };
    }
  }
);

// Get product tool
server.tool(
  "get-product",
  {
    productId: z.string().describe("Product ID")
  },
  async ({ productId }) => {
    try {
      if (!printifyClient) {
        return {
          content: [{
            type: "text",
            text: "Printify API client is not initialized. The PRINTIFY_API_KEY environment variable may not be set."
          }],
          isError: true
        };
      }

      const currentShop = printifyClient.getCurrentShop();
      if (!currentShop) {
        return {
          content: [{
            type: "text",
            text: "No shop is currently selected. Use the list-shops and switch-shop tools to select a shop."
          }],
          isError: true
        };
      }

      const product = await printifyClient.getProduct(productId);

      return {
        content: [{
          type: "text",
          text: `Product in shop "${currentShop.title}":\n\n${JSON.stringify(product, null, 2)}`
        }]
      };
    } catch (error: any) {
      return {
        content: [{
          type: "text",
          text: `Error fetching product: ${error.message}`
        }],
        isError: true
      };
    }
  }
);

// Create product tool
server.tool(
  "create-product",
  {
    title: z.string().describe("Product title"),
    description: z.string().describe("Product description"),
    blueprintId: z.number().describe("Blueprint ID"),
    printProviderId: z.number().describe("Print provider ID"),
    variants: z.array(z.object({
      variantId: z.number().describe("Variant ID"),
      price: z.number().describe("Price in cents (e.g., 1999 for $19.99)"),
      isEnabled: z.boolean().optional().default(true).describe("Whether the variant is enabled")
    })).describe("Product variants"),
    printAreas: z.record(z.string(), z.object({
      position: z.string().describe("Print position (e.g., 'front', 'back')"),
      imageId: z.string().describe("Image ID from Printify uploads")
    })).optional().describe("Print areas for the product")
  },
  async ({ title, description, blueprintId, printProviderId, variants, printAreas }) => {
    try {
      if (!printifyClient) {
        return {
          content: [{
            type: "text",
            text: "Printify API client is not initialized. The PRINTIFY_API_KEY environment variable may not be set."
          }],
          isError: true
        };
      }

      const currentShop = printifyClient.getCurrentShop();
      if (!currentShop) {
        return {
          content: [{
            type: "text",
            text: "No shop is currently selected. Use the list-shops and switch-shop tools to select a shop."
          }],
          isError: true
        };
      }

      // Create the product
      const productData = {
        title,
        description,
        blueprint_id: blueprintId,
        print_provider_id: printProviderId,
        variants,
        print_areas: printAreas
      };

      try {
        console.log(`Creating product with data: ${JSON.stringify(productData, null, 2)}`);
        const product = await printifyClient.createProduct(productData);
        console.log(`Product created successfully: ${JSON.stringify(product, null, 2)}`);
        return {
          content: [{
            type: "text",
            text: `Product created successfully in shop "${currentShop.title}"!\n\n${JSON.stringify(product, null, 2)}`
          }]
        };
      } catch (error: any) {
        console.error('Error creating product:', error);

        // Extract detailed error information
        let errorMessage = `Error creating product: ${error.message}`;
        let detailedInfo = '';

        // Add status code if available
        if (error.statusCode) {
          errorMessage += ` (Status: ${error.statusCode} ${error.statusText || ''})`;
        }

        // Check if there's response data in the error
        if (error.details) {
          detailedInfo += `\n\nAPI Response: ${JSON.stringify(error.details, null, 2)}`;
        } else if (error.response && error.response.data) {
          detailedInfo += `\n\nAPI Response: ${JSON.stringify(error.response.data, null, 2)}`;
        }

        // Add the formatted data that was actually sent to the API
        if (error.formattedData) {
          detailedInfo += `\n\nFormatted Data Sent to API: ${JSON.stringify(error.formattedData, null, 2)}`;
        }

        // Add validation errors if they exist
        if (error.validationErrors) {
          detailedInfo += `\n\nValidation Errors: ${JSON.stringify(error.validationErrors, null, 2)}`;
        }

        // Add full response data if available
        if (error.fullResponseData) {
          detailedInfo += `\n\nFull Response Data: ${JSON.stringify(error.fullResponseData, null, 2)}`;
        }

        // Add request data for debugging
        detailedInfo += `\n\nRequest Data:\n${JSON.stringify(productData, null, 2)}`;

        // Common issues and troubleshooting tips
        detailedInfo += `\n\nCommon issues:\n`;
        detailedInfo += `- Blueprint ID or Print Provider ID might be invalid\n`;
        detailedInfo += `- Variant IDs might not be valid for the selected blueprint and print provider\n`;
        detailedInfo += `- Image IDs in print areas might be invalid or not accessible\n`;
        detailedInfo += `- Required fields might be missing in the request\n`;

        return {
          content: [{
            type: "text",
            text: errorMessage + detailedInfo
          }],
          isError: true
        };
      }
    } catch (error: any) {
      // Extract detailed error information
      let errorMessage = `Error creating product: ${error.message}`;
      let detailedInfo = '';

      // Check if there's response data in the error
      if (error.response && error.response.data) {
        const responseData = typeof error.response.data === 'object'
          ? JSON.stringify(error.response.data, null, 2)
          : error.response.data;
        detailedInfo += `\n\nAPI Response: ${responseData}`;
      }

      // Add request data for debugging
      detailedInfo += `\n\nRequest Data:\n${JSON.stringify({
        title,
        description,
        blueprint_id: blueprintId,
        print_provider_id: printProviderId,
        variants: variants.length,
        print_areas: printAreas ? Object.keys(printAreas).length : 0
      }, null, 2)}`;

      // Common issues and troubleshooting tips
      detailedInfo += `\n\nCommon issues:\n`;
      detailedInfo += `- Blueprint ID or Print Provider ID might be invalid\n`;
      detailedInfo += `- Variant IDs might not be valid for the selected blueprint and print provider\n`;
      detailedInfo += `- Image IDs in print areas might be invalid or not accessible\n`;
      detailedInfo += `- Required fields might be missing in the request\n`;

      return {
        content: [{
          type: "text",
          text: errorMessage + detailedInfo
        }],
        isError: true
      };
    }
  }
);

// Update product tool
server.tool(
  "update-product",
  {
    productId: z.string().describe("Product ID"),
    title: z.string().optional().describe("Product title"),
    description: z.string().optional().describe("Product description"),
    variants: z.array(z.object({
      variantId: z.number().describe("Variant ID"),
      price: z.number().describe("Price in cents (e.g., 1999 for $19.99)"),
      isEnabled: z.boolean().optional().describe("Whether the variant is enabled")
    })).optional().describe("Product variants"),
    printAreas: z.record(z.string(), z.object({
      position: z.string().describe("Print position (e.g., 'front', 'back')"),
      imageId: z.string().describe("Image ID from Printify uploads")
    })).optional().describe("Print areas for the product")
  },
  async ({ productId, title, description, variants, printAreas }) => {
    try {
      if (!printifyClient) {
        return {
          content: [{
            type: "text",
            text: "Printify API client is not initialized. The PRINTIFY_API_KEY environment variable may not be set."
          }],
          isError: true
        };
      }

      const currentShop = printifyClient.getCurrentShop();
      if (!currentShop) {
        return {
          content: [{
            type: "text",
            text: "No shop is currently selected. Use the list-shops and switch-shop tools to select a shop."
          }],
          isError: true
        };
      }

      const productData: any = {};

      if (title) productData.title = title;
      if (description) productData.description = description;
      if (variants) productData.variants = variants;
      if (printAreas) productData.print_areas = printAreas;

      const product = await printifyClient.updateProduct(productId, productData);

      return {
        content: [{
          type: "text",
          text: `Product updated successfully in shop "${currentShop.title}"!\n\n${JSON.stringify(product, null, 2)}`
        }]
      };
    } catch (error: any) {
      return {
        content: [{
          type: "text",
          text: `Error updating product: ${error.message}`
        }],
        isError: true
      };
    }
  }
);

// Delete product tool
server.tool(
  "delete-product",
  {
    productId: z.string().describe("Product ID")
  },
  async ({ productId }) => {
    try {
      if (!printifyClient) {
        return {
          content: [{
            type: "text",
            text: "Printify API client is not initialized. The PRINTIFY_API_KEY environment variable may not be set."
          }],
          isError: true
        };
      }

      const currentShop = printifyClient.getCurrentShop();
      if (!currentShop) {
        return {
          content: [{
            type: "text",
            text: "No shop is currently selected. Use the list-shops and switch-shop tools to select a shop."
          }],
          isError: true
        };
      }

      await printifyClient.deleteProduct(productId);

      return {
        content: [{
          type: "text",
          text: `Product ${productId} deleted successfully from shop "${currentShop.title}".`
        }]
      };
    } catch (error: any) {
      return {
        content: [{
          type: "text",
          text: `Error deleting product: ${error.message}`
        }],
        isError: true
      };
    }
  }
);

// Publish product tool
server.tool(
  "publish-product",
  {
    productId: z.string().describe("Product ID"),
    publishDetails: z.object({
      title: z.boolean().optional().default(true).describe("Publish title"),
      description: z.boolean().optional().default(true).describe("Publish description"),
      images: z.boolean().optional().default(true).describe("Publish images"),
      variants: z.boolean().optional().default(true).describe("Publish variants"),
      tags: z.boolean().optional().default(true).describe("Publish tags")
    }).optional().describe("Publish details")
  },
  async ({ productId, publishDetails }) => {
    try {
      if (!printifyClient) {
        return {
          content: [{
            type: "text",
            text: "Printify API client is not initialized. The PRINTIFY_API_KEY environment variable may not be set."
          }],
          isError: true
        };
      }

      const currentShop = printifyClient.getCurrentShop();
      if (!currentShop) {
        return {
          content: [{
            type: "text",
            text: "No shop is currently selected. Use the list-shops and switch-shop tools to select a shop."
          }],
          isError: true
        };
      }

      const publishData = {
        publish_details: publishDetails || {
          title: true,
          description: true,
          images: true,
          variants: true,
          tags: true
        }
      };

      const result = await printifyClient.publishProduct(productId, publishData);

      return {
        content: [{
          type: "text",
          text: `Product ${productId} published successfully from shop "${currentShop.title}".\n\n${JSON.stringify(result, null, 2)}`
        }]
      };
    } catch (error: any) {
      return {
        content: [{
          type: "text",
          text: `Error publishing product: ${error.message}`
        }],
        isError: true
      };
    }
  }
);

// Get blueprints tool
server.tool(
  "get-blueprints",
  {
    page: z.number().optional().default(1).describe("Page number"),
    limit: z.number().optional().default(10).describe("Number of blueprints per page")
  },
  async ({ page, limit }) => {
    try {
      if (!printifyClient) {
        return {
          content: [{
            type: "text",
            text: "Printify API client is not initialized. The PRINTIFY_API_KEY environment variable may not be set."
          }],
          isError: true
        };
      }

      const blueprints = await printifyClient.getBlueprints();

      return {
        content: [{
          type: "text",
          text: `Available blueprints (page ${page}, limit ${limit}):\n\n${JSON.stringify(blueprints, null, 2)}`
        }]
      };
    } catch (error: any) {
      return {
        content: [{
          type: "text",
          text: `Error fetching blueprints: ${error.message}`
        }],
        isError: true
      };
    }
  }
);

// Get blueprint tool
server.tool(
  "get-blueprint",
  {
    blueprintId: z.string().describe("Blueprint ID")
  },
  async ({ blueprintId }) => {
    try {
      if (!printifyClient) {
        return {
          content: [{
            type: "text",
            text: "Printify API client is not initialized. The PRINTIFY_API_KEY environment variable may not be set."
          }],
          isError: true
        };
      }

      const blueprint = await printifyClient.getBlueprint(blueprintId);

      return {
        content: [{
          type: "text",
          text: `Blueprint details for ID ${blueprintId}:\n\n${JSON.stringify(blueprint, null, 2)}`
        }]
      };
    } catch (error: any) {
      return {
        content: [{
          type: "text",
          text: `Error fetching blueprint: ${error.message}`
        }],
        isError: true
      };
    }
  }
);

// Get print providers tool
server.tool(
  "get-print-providers",
  {
    blueprintId: z.string().describe("Blueprint ID")
  },
  async ({ blueprintId }) => {
    try {
      if (!printifyClient) {
        return {
          content: [{
            type: "text",
            text: "Printify API client is not initialized. The PRINTIFY_API_KEY environment variable may not be set."
          }],
          isError: true
        };
      }

      const printProviders = await printifyClient.getPrintProviders(blueprintId);

      return {
        content: [{
          type: "text",
          text: `Print providers for blueprint ID ${blueprintId}:\n\n${JSON.stringify(printProviders, null, 2)}`
        }]
      };
    } catch (error: any) {
      return {
        content: [{
          type: "text",
          text: `Error fetching print providers: ${error.message}`
        }],
        isError: true
      };
    }
  }
);

// Get variants tool
server.tool(
  "get-variants",
  {
    blueprintId: z.string().describe("Blueprint ID"),
    printProviderId: z.string().describe("Print provider ID")
  },
  async ({ blueprintId, printProviderId }) => {
    try {
      if (!printifyClient) {
        return {
          content: [{
            type: "text",
            text: "Printify API client is not initialized. The PRINTIFY_API_KEY environment variable may not be set."
          }],
          isError: true
        };
      }

      const variants = await printifyClient.getVariants(blueprintId, printProviderId);

      return {
        content: [{
          type: "text",
          text: `Variants for blueprint ID ${blueprintId} and print provider ID ${printProviderId}:\n\n${JSON.stringify(variants, null, 2)}`
        }]
      };
    } catch (error: any) {
      return {
        content: [{
          type: "text",
          text: `Error fetching variants: ${error.message}`
        }],
        isError: true
      };
    }
  }
);

// Upload image tool
server.tool(
  "upload-image",
  {
    fileName: z.string().describe("File name"),
    url: z.string().describe("URL of the image to upload, path to local file, or base64 encoded image data")
  },
  async ({ fileName, url }) => {
    try {
      if (!printifyClient) {
        return {
          content: [{
            type: "text",
            text: "Printify API client is not initialized. The PRINTIFY_API_KEY environment variable may not be set."
          }],
          isError: true
        };
      }

      // Check if we have a current shop
      const currentShop = printifyClient.getCurrentShop();
      if (!currentShop) {
        return {
          content: [{
            type: "text",
            text: "No shop is currently selected. Use the list-shops and switch-shop tools to select a shop."
          }],
          isError: true
        };
      }

      // Log the attempt with limited information for privacy
      const sourcePreview = url.startsWith('http')
        ? url.substring(0, 30) + '...'
        : (url.includes(':\\') || url.includes(':/'))
          ? url // Show full file path
          : url.substring(0, 30) + '...';

      console.log(`Attempting to upload image: ${fileName} from source: ${sourcePreview}`);

      // Determine if this is a URL or a local file path
      const isUrl = url.startsWith('http://') || url.startsWith('https://');
      const isLocalFile = !isUrl && (url.includes(':\\') || url.includes(':/') || url.startsWith('/'));

      let image;

      if (isLocalFile) {
        // For local files, we'll upload directly to Printify

        try {
          console.log(`Uploading local file directly to Printify: ${url}`);

          // Normalize the file path
          let filePath = url;
          if (url.startsWith('file:///')) {
            filePath = url.replace('file:///', '');
          }
          if (filePath.startsWith('/')) {
            filePath = filePath.substring(1);
          }

          // Check if the file exists and is readable
          console.log(`Reading file: ${filePath}`);
          const stats = fs.statSync(filePath);

          // Printify recommends URL upload for files larger than 5MB
          if (stats.size > 5 * 1024 * 1024) {
            console.log(`File is large (${Math.round(stats.size / (1024 * 1024))}MB). Consider using URL upload for files larger than 5MB.`);
          }

          // Set a reasonable maximum file size limit
          if (stats.size > 20 * 1024 * 1024) { // 20MB limit
            throw new Error(`File is too large (${Math.round(stats.size / (1024 * 1024))}MB). Maximum size is 20MB.`);
          }

          // Convert the image using Sharp to ensure it's a valid format
          console.log('Converting image with Sharp before uploading...');
          const { buffer, mimeType } = await convertImageWithSharp(filePath);

          // Convert the buffer to base64
          const base64Data = buffer.toString('base64');

          // Upload directly to Printify using base64
          console.log(`Uploading directly to Printify using base64 data with mime type: ${mimeType}`);
          image = await printifyClient.uploadImage(fileName, `data:${mimeType};base64,${base64Data}`);
          console.log(`Successfully uploaded to Printify: ${JSON.stringify(image, null, 2)}`);
        } catch (uploadError: any) {
          console.error('Error uploading file to Printify:', uploadError);

          // Provide detailed error information
          const errorDetails = {
            url: url,
            errorMessage: uploadError.message,
            errorStack: uploadError.stack
          };

          console.error('Detailed error information:', JSON.stringify(errorDetails, null, 2));

          throw new Error(`Failed to upload local file to Printify: ${uploadError.message}\n\nPlease make sure the file is a valid image format (PNG, JPEG, etc.) and is readable.`);
        }
      } else {
        // For URLs and base64 strings, upload directly to Printify
        console.log(`Uploading directly to Printify: ${isUrl ? 'URL' : 'base64 string'}`);
        image = await printifyClient.uploadImage(fileName, url);
      }

      return {
        content: [{
          type: "text",
          text: `Image uploaded successfully to shop "${currentShop.title}"!\n\nImage ID: ${image.id}\nFile name: ${image.file_name}\nDimensions: ${image.width}x${image.height}\nPreview URL: ${image.preview_url}\n\nYou can use this image ID in the print_areas parameter when creating or updating products.`
        }]
      };
    } catch (error: any) {
      console.error('Error in upload-image tool:', error);

      // Determine what type of source was provided for better error messaging
      const sourceType = url.startsWith('http')
        ? 'URL'
        : (url.includes(':\\') || url.includes(':/'))
          ? 'file path'
          : 'base64 string';

      return {
        content: [{
          type: "text",
          text: `Error uploading image: ${error.message}\n\nYou provided a ${sourceType}, but the upload failed. Here are some troubleshooting tips:\n\n` +
            (sourceType === 'URL'
              ? '- Make sure the URL is publicly accessible and points directly to an image file\n- The URL must start with http:// or https://\n'
              : sourceType === 'file path'
                ? '- Make sure the file exists and is readable\n- Check that the path is correct and includes the full path to the file\n- The file must be a valid image format (PNG, JPEG, SVG)\n- Recommended resolution for JPEG/PNG files is 300 DPI\n- Maximum file size is 20MB (files larger than 5MB should use URL upload)\n- The file will be automatically converted using Sharp to ensure compatibility with Printify\n'
                : '- Make sure the base64 string is valid and represents an image\n- The string should not include the data URL prefix (e.g., "data:image/png;base64,")\n') +
            `\nPlease provide either:\n1. A valid HTTP/HTTPS URL to an image\n2. A path to a local file (e.g., c:\\path\\to\\image.png)\n3. A base64 encoded image string\n\nExample with URL:\n  upload-image_printify({ fileName: "my-image.png", url: "https://example.com/image.png" })\n\nExample with file path:\n  upload-image_printify({ fileName: "my-image.png", url: "c:\\Users\\username\\image.png" })\n\nExample with base64:\n  upload-image_printify({ fileName: "my-image.png", url: "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==" })`
        }],
        isError: true
      };
    }
  }
);

// Imgur upload tool has been removed - we now upload directly to Printify

// How to use Printify tool - provides detailed documentation on product creation workflow
server.tool(
  "how_to_use",
  {
    topic: z.enum([
      "product-creation",
      "blueprints",
      "print-providers",
      "variants",
      "images",
      "publishing"
    ]).describe("The topic to get documentation for")
  },
  async ({ topic }) => {
    try {
      let documentation = "";

      if (topic === "product-creation") {
        documentation = `
=== DETAILED DOCUMENTATION: PRODUCT CREATION WORKFLOW ===

This guide provides EXACT step-by-step instructions for creating a product in Printify.

## STEP-BY-STEP PRODUCT CREATION WORKFLOW

### STEP 1: CHOOSE A BLUEPRINT

\`\`\`javascript
// Get a list of all available blueprints
get-blueprints_printify()
\`\`\`

The response will contain a list of blueprints. Each blueprint has:
- id: The unique identifier (REQUIRED for next steps)
- title: The name of the product
- description: Details about the product
- brand: The manufacturer

EXAMPLE RESPONSE (partial):
\`\`\`json
[
  {
    "id": 12,
    "title": "Unisex Jersey Short Sleeve Tee",
    "description": "Description goes here",
    "brand": "Bella+Canvas",
    "model": "3001"
  },
  // More blueprints...
]
\`\`\`

**ACTION:** Select a blueprint ID from the list (e.g., 12 for "Unisex Jersey Short Sleeve Tee").

### STEP 2: CHOOSE A PRINT PROVIDER

\`\`\`javascript
// Get print providers for your selected blueprint
get-print-providers_printify({ blueprintId: "12" }) // Replace 12 with your chosen blueprint ID
\`\`\`

The response will contain available print providers for this blueprint:

EXAMPLE RESPONSE:
\`\`\`json
[
  { "id": 29, "title": "Monster Digital" },
  { "id": 16, "title": "MyLocker" },
  // More providers...
]
\`\`\`

**ACTION:** Select a print provider ID (e.g., 29 for "Monster Digital").

### STEP 3: GET VARIANTS

\`\`\`javascript
// Get available variants (sizes, colors, etc.)
get-variants_printify({
  blueprintId: "12",      // Replace with your blueprint ID
  printProviderId: "29"  // Replace with your print provider ID
})
\`\`\`

The response will contain all available variants (combinations of colors, sizes, etc.):

EXAMPLE RESPONSE (partial):
\`\`\`json
{
  "id": 29,
  "title": "Monster Digital",
  "variants": [
    {
      "id": 18100,
      "title": "Black / S",
      "options": { "color": "Black", "size": "S" },
      "placeholders": [...]
    },
    {
      "id": 18101,
      "title": "Black / M",
      "options": { "color": "Black", "size": "M" },
      "placeholders": [...]
    },
    // More variants...
  ]
}
\`\`\`

**ACTION:** Select the variant IDs you want to offer (e.g., 18100, 18101, 18102 for Black in S, M, L sizes).

### STEP 4: UPLOAD IMAGES

You have two options for uploading images:

#### Option A: Upload an existing image

\`\`\`javascript
// Upload from a URL or local file
upload-image_printify({
  fileName: "front-design.png",
  url: "path/to/image.png"  // Can be a URL, local file path, or base64 data
})
\`\`\`

#### Option B: Generate and upload an AI image

\`\`\`javascript
// Generate an image with AI and upload it directly
generate-and-upload-image_printify({
  prompt: "futuristic cityscape with neon lights",
  fileName: "front-design.png",
  // Optional parameters:
  width: 1024,                // Default: 1024
  height: 1024,               // Default: 1024
  aspectRatio: "1:1",         // Overrides width/height if provided
  numInferenceSteps: 25,      // Default: 25
  guidanceScale: 7.5,         // Default: 7.5
  negativePrompt: "low quality, bad quality",  // Default provided
  seed: 12345                 // Optional: for reproducible results
})
\`\`\`

Both methods will return an image object with an ID you'll need for the next step:

EXAMPLE RESPONSE:
\`\`\`json
{
  "id": "680325163d2a2ac0a2d2937c",
  "file_name": "front-design.png",
  "height": 1024,
  "width": 1024,
  "size": 1138575,
  "mime_type": "image/png",
  "preview_url": "https://images.printify.com/mockup/680325163d2a2ac0a2d2937c/12.png",
  "upload_time": "2023-10-09 07:29:43"
}
\`\`\`

**ACTION:**
1. Upload images for all print positions you need (front, back, etc.)
2. Save the image IDs for each position

### STEP 5: CREATE THE PRODUCT

\`\`\`javascript
// Create the product with all gathered information
create-product_printify({
  title: "Horizon City Skyline T-Shirt",  // Product title
  description: "Step into the future with our Horizon City Skyline T-Shirt. This premium unisex tee features a stunning futuristic cityscape with neon lights and towering skyscrapers.",  // Detailed description

  // IDs from previous steps
  blueprintId: 12,            // From Step 1
  printProviderId: 29,        // From Step 2

  // Variants from Step 3 with pricing (in cents)
  variants: [
    { variantId: 18100, price: 2499 },  // Black / S for $24.99
    { variantId: 18101, price: 2499 },  // Black / M for $24.99
    { variantId: 18102, price: 2499 }   // Black / L for $24.99
  ],

  // Print areas with image IDs from Step 4
  printAreas: {
    "front": { position: "front", imageId: "680325163d2a2ac0a2d2937c" },
    "back": { position: "back", imageId: "680325163d2a2ac0a2d2937d" }
  }
})
\`\`\`

The response will contain the complete product information:

EXAMPLE RESPONSE (partial):
\`\`\`json
{
  "id": "68032b43a24efbac6502b6f7",
  "title": "Horizon City Skyline T-Shirt",
  "description": "Step into the future with our Horizon City Skyline T-Shirt...",
  "variants": [...],
  "images": [...],
  "created_at": "2023-10-09 13:52:17+00:00",
  "updated_at": "2023-10-09 13:52:18+00:00",
  "visible": true,
  "is_locked": false,
  "blueprint_id": 12,
  "print_provider_id": 29,
  "print_areas": [...]
}
\`\`\`

**ACTION:** Your product is now created! The product ID in the response can be used to update or publish the product later.

## COMPLETE REAL-WORLD EXAMPLE

Here's a complete example of creating a t-shirt with front and back designs:

\`\`\`javascript
// Step 1: Get blueprints and choose one
get-blueprints_printify()
// Selected blueprint ID 12 (Unisex Jersey Short Sleeve Tee)

// Step 2: Get print providers for this blueprint
get-print-providers_printify({ blueprintId: "12" })
// Selected print provider ID 29 (Monster Digital)

// Step 3: Get variants for this blueprint and print provider
get-variants_printify({ blueprintId: "12", printProviderId: "29" })
// Selected variant IDs 18100 (Black / S), 18101 (Black / M), 18102 (Black / L)

// Step 4: Generate and upload front image
const frontImage = await generate-and-upload-image_printify({
  prompt: "A futuristic cityscape with neon lights and tall skyscrapers, horizon city logo design",
  fileName: "horizon-city-front"
})
// Got image ID: 68032b22ae74bf725ed406ec

// Step 4b: Generate and upload back image
const backImage = await generate-and-upload-image_printify({
  prompt: "A minimalist 'Horizon City' text logo with futuristic font, suitable for the back of a t-shirt",
  fileName: "horizon-city-back"
})
// Got image ID: 68032b377e36fbdd32791027

// Step 5: Create the product
create-product_printify({
  title: "Horizon City Skyline T-Shirt",
  description: "Step into the future with our Horizon City Skyline T-Shirt. This premium unisex tee features a stunning futuristic cityscape with neon lights and towering skyscrapers on the front, and a sleek minimalist Horizon City logo on the back.",
  blueprintId: 12,
  printProviderId: 29,
  variants: [
    { variantId: 18100, price: 2499 },
    { variantId: 18101, price: 2499 },
    { variantId: 18102, price: 2499 }
  ],
  printAreas: {
    "front": { position: "front", imageId: "68032b22ae74bf725ed406ec" },
    "back": { position: "back", imageId: "68032b377e36fbdd32791027" }
  }
})
// Product created with ID: 68032b43a24efbac6502b6f7
\`\`\`

## IMPORTANT NOTES

1. **Pricing:** All prices are in cents (e.g., 2499 = $24.99).

2. **Variants:** Only enable the variants you want to sell. Each variant has a cost (what you pay) and a price (what customers pay).

3. **Images:** Make sure your images meet the requirements for the specific product. Generally:
   - High resolution (at least 300 DPI)
   - PNG or JPEG format
   - Appropriate dimensions for the print area

4. **Print Areas:** Different products have different available print areas. Common ones include:
   - front
   - back
   - left_sleeve
   - right_sleeve

5. **Publishing:** Products created through the API are automatically added to your Printify catalog but may need to be published to external sales channels.
`;
      } else if (topic === "blueprints") {
        documentation = `
=== DETAILED DOCUMENTATION: BLUEPRINTS ===

Blueprints are the base product templates in Printify (t-shirts, mugs, posters, etc.).

KEY POINTS ABOUT BLUEPRINTS:
- Each blueprint has a unique ID and represents a product type
- Different blueprints have different available print areas (front, back, etc.)
- Not all print providers offer all blueprints
- Blueprints determine what kind of product you're creating

HOW TO GET BLUEPRINTS:
- Use get-blueprints_printify() to see all available blueprints
- The response includes an array of blueprint objects
- Each blueprint has an ID, title, and other properties

EXAMPLE BLUEPRINT OBJECT:
{
  "id": 12,
  "title": "Unisex Jersey Short Sleeve Tee",
  "description": "A comfortable unisex t-shirt",
  "brand": "Bella+Canvas",
  "model": "3001"
}

NEXT STEP AFTER CHOOSING A BLUEPRINT:
- Use get-print-providers_printify({ blueprintId: "12" }) to see which print providers can produce this blueprint
`;
      } else if (topic === "print-providers") {
        documentation = `
=== DETAILED DOCUMENTATION: PRINT PROVIDERS ===

Print providers are the companies that actually print and fulfill your products.

KEY POINTS ABOUT PRINT PROVIDERS:
- Different print providers offer different quality, pricing, and shipping options
- Not all print providers are available for all blueprints
- Print providers determine the available variants (colors, sizes) for a product
- Each print provider has different production times and shipping locations

HOW TO GET PRINT PROVIDERS:
- First choose a blueprint ID
- Then use get-print-providers_printify({ blueprintId: "12" })
- The response includes an array of print provider objects
- Each print provider has an ID, title, and other properties

EXAMPLE PRINT PROVIDER OBJECT:
{
  "id": 29,
  "title": "Monster Digital",
  "location": "United States"
}

NEXT STEP AFTER CHOOSING A PRINT PROVIDER:
- Use get-variants_printify({ blueprintId: "12", printProviderId: "29" }) to see what specific variants (colors, sizes) are available
`;
      } else if (topic === "variants") {
        documentation = `
=== DETAILED DOCUMENTATION: VARIANTS ===

Variants are the specific product options available for a blueprint from a specific print provider.

KEY POINTS ABOUT VARIANTS:
- Variants typically include combinations of colors, sizes, and other attributes
- Each variant has a unique ID that you'll need when creating a product
- Variants have a cost (what you pay to the print provider)
- You set a retail price for each variant (what your customers will pay)
- You can enable or disable specific variants

HOW TO GET VARIANTS:
- First choose a blueprint ID and print provider ID
- Then use get-variants_printify({ blueprintId: "12", printProviderId: "29" })
- The response includes an array of variant objects
- Each variant has an ID, title, options, and cost

EXAMPLE VARIANT OBJECT:
{
  "id": 18100,
  "title": "Black / S",
  "options": {
    "color": "Black",
    "size": "S"
  },
  "cost": 1992  // $19.92 - what you pay to the print provider
}

HOW TO USE VARIANTS WHEN CREATING A PRODUCT:
- Include an array of variant objects with your pricing
- Each variant object needs:
  * variantId: The ID of the variant
  * price: The retail price in cents (e.g., 2499 for $24.99)
  * isEnabled: (Optional) Whether the variant is enabled (defaults to true)

EXAMPLE VARIANTS ARRAY FOR PRODUCT CREATION:
[
  { "variantId": 18100, "price": 2499 },  // Black / S for $24.99
  { "variantId": 18101, "price": 2499 },  // Black / M for $24.99
  { "variantId": 18102, "price": 2499 }   // Black / L for $24.99
]

NEXT STEP AFTER CHOOSING VARIANTS:
- Upload images for your product using upload-image or generate-and-upload-image
`;
      } else if (topic === "images") {
        documentation = `
=== DETAILED DOCUMENTATION: IMAGES ===

Images are what make your product unique and are applied to different print areas.

KEY POINTS ABOUT IMAGES:
- Images can be uploaded from URLs, local files, or generated with AI
- Each uploaded image gets a unique ID that you'll use when creating a product
- Different blueprints have different available print areas (front, back, etc.)
- Image requirements vary by print provider and blueprint
- Generally, images should be high resolution (300 DPI) and in PNG or JPEG format

HOW TO UPLOAD IMAGES:
1. From a URL:
   upload-image_printify({ fileName: "front.png", url: "https://example.com/image.png" })

2. From a local file:
   upload-image_printify({ fileName: "front.png", url: "c:\\path\\to\\image.png" })

3. Generate with AI and upload:
   generate-and-upload-image_printify({ prompt: "blue t-shirt design", fileName: "front.png" })

EXAMPLE IMAGE UPLOAD RESPONSE:
{
  "id": "680325163d2a2ac0a2d2937c",
  "file_name": "front.png",
  "width": 1200,
  "height": 1200,
  "preview_url": "https://images.printify.com/mockup/680325163d2a2ac0a2d2937c/12.png"
}

HOW TO USE IMAGES WHEN CREATING A PRODUCT:
- Include a printAreas object that maps print areas to images
- Each print area needs:
  * position: The position on the product ("front", "back", etc.)
  * imageId: The ID of the uploaded image

EXAMPLE PRINT AREAS OBJECT FOR PRODUCT CREATION:
{
  "front": { "position": "front", "imageId": "680325163d2a2ac0a2d2937c" },
  "back": { "position": "back", "imageId": "680325163d2a2ac0a2d2938d" }
}

NEXT STEP AFTER UPLOADING IMAGES:
- Create your product using create-product with all the information you've gathered
`;
      } else if (topic === "publishing") {
        documentation = `
=== DETAILED DOCUMENTATION: PUBLISHING PRODUCTS ===

After creating a product, you may need to publish it depending on your sales channel.

KEY POINTS ABOUT PUBLISHING:

1. FOR POP-UP STORES:
   - Products created in Printify are automatically added to your Pop-Up Store catalog
   - You DON'T need to explicitly "publish" them using the publish-product API endpoint
   - The publish-product API endpoint is designed for external sales channels like Shopify or Etsy
   - To make variants available for purchase, ensure they have "isEnabled": true and a price set

2. FOR EXTERNAL SALES CHANNELS (Shopify, Etsy, etc.):
   - After creating a product, you need to publish it to your connected sales channel
   - Use the publish-product endpoint with the product ID:
     publish-product_printify({ productId: "your-product-id" })
   - You can control which aspects of the product to publish:
     publish-product_printify({
       productId: "your-product-id",
       publishDetails: {
         title: true,
         description: true,
         images: true,
         variants: true,
         tags: true
       }
     })

3. VISIBILITY IN POP-UP STORE:
   - Products may take a few minutes to appear in your Pop-Up Store
   - If a product doesn't appear, check that:
     a) The variants are enabled (isEnabled: true)
     b) The variants have prices set
     c) The product has images assigned to print areas

4. MANAGING PRODUCTS:
   - Update a product: update-product_printify({ productId: "your-product-id", ... })
   - Delete a product: delete-product_printify({ productId: "your-product-id" })
   - Get product details: get-product_printify({ productId: "your-product-id" })

Your Pop-Up Store URL is typically: [your-shop-name].printify.me
`;
      }

      return {
        content: [{
          type: "text",
          text: documentation
        }]
      };
    } catch (error: any) {
      return {
        content: [{
          type: "text",
          text: `Error retrieving documentation: ${error.message}`
        }],
        isError: true
      };
    }
  }
);

// Add a prompt for product description generation
server.prompt(
  "generate-product-description",
  {
    productName: z.string(),
    category: z.string(),
    targetAudience: z.string().optional(),
    keyFeatures: z.string().optional().describe("Comma-separated list of key features")
  },
  (args) => {
    const { productName, category, targetAudience, keyFeatures } = args;
    let featuresText = "";
    if (keyFeatures) {
      const featuresList = keyFeatures.split(',').map(f => f.trim());
      if (featuresList.length > 0) {
        featuresText = `\nKey features:\n${featuresList.map((f: string) => `- ${f}`).join('\n')}`;
      }
    }

    let audienceText = targetAudience ? `\nTarget audience: ${targetAudience}` : "";

    return {
      messages: [{
        role: "user",
        content: {
          type: "text",
          text: `Please write a compelling product description for the following product:

Product name: ${productName}
Category: ${category}${audienceText}${featuresText}

The description should be engaging, highlight the benefits, and be suitable for an e-commerce platform.`
        }
      }]
    };
  }
);

// Generate and upload image tool - combines Replicate image generation with Printify upload
server.tool(
  "generate-and-upload-image",
  {
    prompt: z.string().describe("Text prompt for image generation"),
    fileName: z.string().describe("File name for the uploaded image"),
    width: z.number().optional().default(1024).describe("Image width in pixels"),
    height: z.number().optional().default(1024).describe("Image height in pixels"),
    aspectRatio: z.string().optional().describe("Aspect ratio (e.g., '16:9', '4:3', '1:1'). If provided, overrides width and height"),
    numInferenceSteps: z.number().optional().default(25).describe("Number of inference steps"),
    guidanceScale: z.number().optional().default(7.5).describe("Guidance scale"),
    negativePrompt: z.string().optional().default("low quality, bad quality, sketches").describe("Negative prompt"),
    seed: z.number().optional().describe("Random seed for reproducible generation")
  },
  async ({ prompt, fileName, width, height, aspectRatio, numInferenceSteps, guidanceScale, negativePrompt, seed }) => {
    try {
      // Check if both clients are initialized
      if (!printifyClient) {
        return {
          content: [{
            type: "text",
            text: "Printify API client is not initialized. The PRINTIFY_API_KEY environment variable may not be set."
          }],
          isError: true
        };
      }

      if (!replicateClient) {
        return {
          content: [{
            type: "text",
            text: "Replicate API client is not initialized. The REPLICATE_API_TOKEN environment variable may not be set."
          }],
          isError: true
        };
      }

      const currentShop = printifyClient.getCurrentShop();
      if (!currentShop) {
        return {
          content: [{
            type: "text",
            text: "No shop is currently selected. Use the list-shops and switch-shop tools to select a shop."
          }],
          isError: true
        };
      }

      console.log(`Starting generate-and-upload-image with prompt: ${prompt}`);

      // STEP 1: Generate image with Replicate
      console.log('Step 1: Generating image with Replicate...');
      const modelOptions: any = {};

      // Set aspect ratio or dimensions
      if (aspectRatio) {
        modelOptions.aspectRatio = aspectRatio;
      } else {
        modelOptions.width = width;
        modelOptions.height = height;
      }

      // Add other parameters
      if (numInferenceSteps) modelOptions.num_inference_steps = numInferenceSteps;
      if (guidanceScale) modelOptions.guidance_scale = guidanceScale;
      if (negativePrompt) modelOptions.negative_prompt = negativePrompt;
      if (seed !== undefined) modelOptions.seed = seed;

      // Generate the image
      const generatedImagePath = await replicateClient.generateImage(prompt, modelOptions);
      console.log(`Image generated successfully at: ${generatedImagePath}`);

      // STEP 2: Process with Sharp
      console.log('Step 2: Processing image with Sharp...');
      const tempFilePath = path.join(process.cwd(), 'temp', `${Date.now()}_${fileName}.png`);

      // Ensure temp directory exists
      const tempDir = path.dirname(tempFilePath);
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }

      // Process with Sharp
      await sharp(generatedImagePath)
        .png({ quality: 100 })
        .toFile(tempFilePath);
      console.log(`Image processed and saved to: ${tempFilePath}`);

      // STEP 3: Base64 encode
      console.log('Step 3: Base64 encoding the image...');
      const imageBuffer = fs.readFileSync(tempFilePath);
      const base64Data = imageBuffer.toString('base64');
      const dataUrl = `data:image/png;base64,${base64Data}`;
      console.log(`Image encoded as base64 (length: ${base64Data.length})`);

      // STEP 4: Upload to Printify
      console.log('Step 4: Uploading to Printify...');
      const image = await printifyClient.uploadImage(fileName, dataUrl);
      console.log(`Image uploaded successfully! ID: ${image.id}`);

      // Clean up temporary files
      try {
        fs.unlinkSync(generatedImagePath);
        fs.unlinkSync(tempFilePath);
        console.log('Temporary files cleaned up');
      } catch (cleanupError) {
        console.error('Error cleaning up temporary files:', cleanupError);
      }

      // Return success response
      return {
        content: [{
          type: "text",
          text: `✅ **Image generated and uploaded successfully!**\n\n` +
                `**Image ID:** ${image.id}\n` +
                `**File Name:** ${image.file_name}\n` +
                `**Dimensions:** ${image.width}x${image.height}\n` +
                `**Preview URL:** ${image.preview_url}\n\n` +
                `You can now use this image ID (${image.id}) when creating a product.\n\n` +
                `**Example:**\n` +
                `\`\`\`json\n` +
                `"print_areas": {\n` +
                `  "front": { "position": "front", "imageId": "${image.id}" }\n` +
                `}\n` +
                `\`\`\``
        }]
      };
    } catch (error: any) {
      console.error('Error in generate-and-upload-image tool:', error);
      return {
        content: [{
          type: "text",
          text: `❌ **Error generating and uploading image**\n\n` +
                `${error.message}\n\n` +
                `${error.message.includes('Diagnostic Information') ? '' : '🔄 Please try again with a different prompt or parameters.\n\n' +
                '💡 **Tips**:\n' +
                '• Try a more descriptive prompt\n' +
                '• Try a different aspect ratio\n' +
                '• Check that your REPLICATE_API_TOKEN is valid\n' +
                '• Ensure your Printify account is properly connected'}`
        }],
        isError: true
      };
    }
  }
);

// Start receiving messages on stdin and sending messages on stdout
const transport = new StdioServerTransport();
await server.connect(transport);

console.log("Printify MCP Server started and connected via stdio");

// Default export
export default server;
