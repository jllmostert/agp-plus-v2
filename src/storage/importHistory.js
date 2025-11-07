/**
 * Import History Storage
 * 
 * Tracks import events for audit trail and user feedback.
 * Stores last 10 imports in localStorage.
 * 
 * @version 3.8.0
 * @created 2025-11-07
 */

const IMPORT_HISTORY_KEY = 'agp-import-history';
const MAX_HISTORY_ENTRIES = 10;

/**
 * Get import history from localStorage
 * @returns {Array} Array of import events (newest first)
 */
export function getImportHistory() {
  try {
    const data = localStorage.getItem(IMPORT_HISTORY_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('[importHistory] Error loading history:', error);
    return [];
  }
}

/**
 * Add import event to history
 * @param {Object} importEvent - Import event details
 * @param {string} importEvent.filename - Name of imported file
 * @param {number} importEvent.recordCount - Total records imported
 * @param {number} importEvent.duration - Import duration in ms
 * @param {string} importEvent.strategy - 'append' or 'replace'
 * @param {Object} importEvent.stats - Detailed import stats
 * @returns {Object} Added import event with timestamp and ID
 */
export function addImportEvent(importEvent) {
  const history = getImportHistory();
  const now = new Date().toISOString();
  
  const event = {
    id: `import-${Date.now()}`,
    timestamp: now,
    ...importEvent
  };
  
  // Add to beginning (newest first)
  history.unshift(event);
  
  // Keep only last 10 entries
  const trimmed = history.slice(0, MAX_HISTORY_ENTRIES);
  
  localStorage.setItem(IMPORT_HISTORY_KEY, JSON.stringify(trimmed));
  
  console.log('[importHistory] Added event:', event);
  return event;
}

/**
 * Get most recent import event
 * @returns {Object|null} Most recent import or null
 */
export function getLastImport() {
  const history = getImportHistory();
  return history.length > 0 ? history[0] : null;
}

/**
 * Get import statistics
 * @returns {Object} Import stats
 */
export function getImportStats() {
  const history = getImportHistory();
  
  if (history.length === 0) {
    return {
      totalImports: 0,
      lastImport: null,
      totalRecords: 0
    };
  }
  
  const totalRecords = history.reduce((sum, event) => sum + (event.recordCount || 0), 0);
  
  return {
    totalImports: history.length,
    lastImport: history[0],
    totalRecords
  };
}

/**
 * Format time ago string
 * @param {string} timestamp - ISO timestamp
 * @returns {string} Human-readable time ago (e.g., "2 hours ago")
 */
export function formatTimeAgo(timestamp) {
  const now = new Date();
  const then = new Date(timestamp);
  const diffMs = now - then;
  
  const seconds = Math.floor(diffMs / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (days > 0) {
    return `${days} day${days === 1 ? '' : 's'} ago`;
  } else if (hours > 0) {
    return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  } else if (minutes > 0) {
    return `${minutes} minute${minutes === 1 ? '' : 's'} ago`;
  } else {
    return 'just now';
  }
}

/**
 * Clear all import history
 * @returns {number} Count of entries cleared
 */
export function clearImportHistory() {
  const history = getImportHistory();
  const count = history.length;
  localStorage.removeItem(IMPORT_HISTORY_KEY);
  console.log(`[importHistory] Cleared ${count} entries`);
  return count;
}
