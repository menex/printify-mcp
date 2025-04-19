/**
 * File utilities for Printify MCP
 */
import * as fs from 'fs';
import * as path from 'path';

/**
 * Ensure a directory exists, creating it if necessary
 */
export function ensureDirectoryExists(dirPath: string): void {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    console.log(`Created directory: ${dirPath}`);
  }
}

/**
 * Generate a temporary file path
 */
export function generateTempFilePath(
  baseDir: string,
  fileName: string,
  extension: string = 'png'
): string {
  // Ensure the directory exists
  ensureDirectoryExists(baseDir);

  // Generate a unique filename with timestamp
  const uniqueFileName = `${Date.now()}_${fileName}.${extension}`;
  return path.resolve(path.join(baseDir, uniqueFileName));
}

/**
 * Clean up temporary files
 */
export function cleanupFiles(filePaths: string[]): void {
  filePaths.forEach(filePath => {
    if (filePath && fs.existsSync(filePath)) {
      try {
        fs.unlinkSync(filePath);
        console.log(`Cleaned up file: ${filePath}`);
      } catch (error) {
        console.error(`Error cleaning up file ${filePath}:`, error);
      }
    }
  });
}

/**
 * Get file information
 */
export function getFileInfo(filePath: string): { exists: boolean; size?: number; stats?: fs.Stats } {
  if (!filePath) {
    return { exists: false };
  }

  if (fs.existsSync(filePath)) {
    const stats = fs.statSync(filePath);
    return {
      exists: true,
      size: stats.size,
      stats
    };
  }

  return { exists: false };
}
