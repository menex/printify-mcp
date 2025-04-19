import * as fs from 'fs';
import * as path from 'path';
import sharp from 'sharp';
import Replicate from 'replicate';
import { writeFile } from 'fs/promises';

export class ReplicateClient {
  private client: Replicate;
  private tempDir: string;

  constructor(apiToken: string) {
    // Initialize the Replicate client with the API token
    this.client = new Replicate({
      auth: apiToken,
    });

    // Create a temporary directory for downloaded images if it doesn't exist
    this.tempDir = path.join(process.cwd(), 'temp');
    if (!fs.existsSync(this.tempDir)) {
      fs.mkdirSync(this.tempDir, { recursive: true });
    }
  }

  /**
   * Generate an image using Flux 1.1 Pro model and save it to a file
   * @param prompt The text prompt to generate an image from
   * @param options Additional options for the model
   * @returns The path to the generated image file
   */
  async generateImage(prompt: string, options: any = {}): Promise<string> {
    try {
      // Set default options
      const input = {
        prompt: prompt,
        prompt_upsampling: true,

        // Support for aspect ratio (if provided)
        ...(options.aspectRatio ? { aspect_ratio: options.aspectRatio } : {}),

        // Support for width and height (if provided)
        ...(options.width ? { width: options.width } : {}),
        ...(options.height ? { height: options.height } : {}),

        // Support for seed (if provided)
        ...(options.seed ? { seed: options.seed } : {}),

        // Support for num_inference_steps (if provided)
        ...(options.num_inference_steps ? { num_inference_steps: options.num_inference_steps } : {}),

        // Support for guidance_scale (if provided)
        ...(options.guidance_scale ? { guidance_scale: options.guidance_scale } : {}),

        // Support for negative_prompt (if provided)
        ...(options.negative_prompt ? { negative_prompt: options.negative_prompt } : {}),

        // Include any other options
        ...options
      };

      // Generate a temporary file path for the output image
      const outputFilename = `${Date.now()}_${Math.random().toString(36).substring(2, 15)}.jpg`;
      const outputPath = path.join(this.tempDir, outputFilename);

      // Run the model using the Replicate client - exactly as in the example
      const output = await this.client.run(
        "black-forest-labs/flux-1.1-pro",
        { input }
      );

      // Save the output directly to a file - exactly as in the example
      await writeFile(outputPath, output as any);

      return outputPath;
    } catch (error: any) {
      // Provide detailed error information
      const errorDetails = {
        message: error.message,
        prompt: prompt,
        options: JSON.stringify(options)
      };

      throw new Error(`Replicate API error: ${error.message}\nDetails: ${JSON.stringify(errorDetails, null, 2)}`);
    }
  }

  /**
   * Process an image with Sharp to ensure it's a valid PNG for Printify
   * @param inputPath The path to the input image from Replicate
   * @param outputFilename The filename to save the processed image as
   * @returns The path to the processed image ready for Printify upload
   */
  async processImageForPrintify(inputPath: string, outputFilename: string): Promise<string> {
    try {
      // Generate a temporary file path for the output
      const tempFilePath = path.join(this.tempDir, outputFilename);

      // Process the image with Sharp to ensure it's a valid PNG for Printify
      // This converts any image format to PNG and ensures it has a valid signature
      await sharp(inputPath)
        .png({ quality: 100 })
        .toFile(tempFilePath);

      return tempFilePath;
    } catch (error) {
      console.error('Error processing image for Printify:', error);
      throw error;
    }
  }

  /**
   * Clean up temporary files
   * @param filePaths Array of file paths to delete
   */
  async cleanupTempFiles(filePaths: string[]): Promise<void> {
    for (const filePath of filePaths) {
      try {
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      } catch (error) {
        console.error(`Error deleting temporary file ${filePath}:`, error);
        // Continue with other files even if one fails
      }
    }
  }
}
