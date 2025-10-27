/**
 * Debug Utility for AGP+
 * 
 * Provides environment-aware logging that automatically disables in production builds.
 * Uses Vite's built-in environment detection (import.meta.env.DEV).
 * 
 * Usage:
 *   import { debug } from '../utils/debug';
 *   debug.log('[Component] Data:', data);      // Only logs in development
 *   debug.error('[Component] Error:', error);  // Always logs (errors)
 * 
 * @version 3.9.0
 */

const IS_DEV = import.meta.env.DEV;

export const debug = {
  /**
   * Log message (development only)
   * @param {...any} args - Arguments to log
   */
  log: (...args) => {
    if (IS_DEV) console.log(...args);
  },

  /**
   * Log warning (development only)
   * @param {...any} args - Arguments to log
   */
  warn: (...args) => {
    if (IS_DEV) console.warn(...args);
  },

  /**
   * Log error (always logs - errors should be visible in production)
   * @param {...any} args - Arguments to log
   */
  error: (...args) => {
    console.error(...args);
  },

  /**
   * Log info (development only)
   * @param {...any} args - Arguments to log
   */
  info: (...args) => {
    if (IS_DEV) console.info(...args);
  },

  /**
   * Grouped console output (development only)
   * @param {string} label - Group label
   * @param {Function} fn - Function to execute within group
   */
  group: (label, fn) => {
    if (!IS_DEV) return;
    console.group(label);
    fn();
    console.groupEnd();
  },

  /**
   * Performance timing (development only)
   * @param {string} label - Timer label
   * @returns {Function} End timer function
   */
  time: (label) => {
    if (!IS_DEV) return () => {};
    console.time(label);
    return () => console.timeEnd(label);
  },

  /**
   * Table output (development only)
   * @param {Array|Object} data - Data to display as table
   */
  table: (data) => {
    if (IS_DEV) console.table(data);
  }
};

// Export individual functions for convenience
export const { log, warn, error, info, group, time, table } = debug;
