// This file is the main entry point for the package when used as a dependency
// It exports the compiled JavaScript from the dist directory

// Re-export everything from the compiled index.js
export * from './dist/index.js';

// Default export
export { default } from './dist/index.js';
