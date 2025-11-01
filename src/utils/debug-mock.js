/**
 * DEBUG MOCK FOR NODE.JS
 * 
 * Allows parsers.js to run in Node.js by mocking Vite's import.meta.env
 */

// Mock the debug function for Node.js environment
export const debug = {
  log: (...args) => {
    // Only log in verbose mode
    if (process.env.DEBUG) {
      console.log('[DEBUG]', ...args);
    }
  },
  warn: (...args) => console.warn('[WARN]', ...args),
  error: (...args) => console.error('[ERROR]', ...args)
};

// Export as default too for compatibility
export default debug;
