/**
 * Export History Storage
 * 
 * Tracks export events for audit trail and user feedback.
 * Stores last 10 exports in localStorage.
 * 
 * @version 4.3.0
 * @created 2025-11-15
 */

const EXPORT_HISTORY_KEY = 'agp-export-history';
const MAX_HISTORY_ENTRIES = 10;

/**
 * Get export history from localStorage
 * @returns {Array} Array of export events (newest first)
 */
export function getExportHistory() {
  try {
    const data = localStorage.getItem(EXPORT_HISTORY_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('[exportHistory] Error loading history:', error);
    return [];
  }
}

/**
 * Add export event to history
 * @param {Object} exportEvent - Export event details
 * @param {string} exportEvent.filename - Name of exported file
 * @param {string} exportEvent.type - Export type: 'agp-html' | 'day-profiles-html' | 'database-json'
 * @param {number} exportEvent.recordCount - Total records exported (for JSON exports)
 * @param {number} exportEvent.fileSize - File size in bytes (optional)
 * @param {Object} exportEvent.stats - Detailed export stats (optional)
 * @returns {Object} Added export event with timestamp and ID
 */
export function addExportEvent(exportEvent) {
  const history = getExportHistory();
  const now = new Date().toISOString();
  
  const event = {
    id: `export-${Date.now()}`,
    timestamp: now,
    ...exportEvent
  };
  
  // Add to beginning (newest first)
  history.unshift(event);
  
  // Keep only last 10 entries
  const trimmed = history.slice(0, MAX_HISTORY_ENTRIES);
  
  localStorage.setItem(EXPORT_HISTORY_KEY, JSON.stringify(trimmed));
  
  console.log('[exportHistory] Added event:', event);
  return event;
}

/**
 * Get most recent export event
 * @returns {Object|null} Most recent export or null
 */
export function getLastExport() {
  const history = getExportHistory();
  return history.length > 0 ? history[0] : null;
}

/**
 * Get export statistics
 * @returns {Object} Export stats
 */
export function getExportStats() {
  const history = getExportHistory();
  
  if (history.length === 0) {
    return {
      totalExports: 0,
      lastExport: null,
      totalRecords: 0
    };
  }
  
  const totalRecords = history.reduce((sum, event) => sum + (event.recordCount || 0), 0);
  
  return {
    totalExports: history.length,
    lastExport: history[0],
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
 * Format file size
 * @param {number} bytes - File size in bytes
 * @returns {string} Human-readable file size (e.g., "1.2 MB")
 */
export function formatFileSize(bytes) {
  if (!bytes) return 'Unknown';
  
  const kb = bytes / 1024;
  const mb = kb / 1024;
  
  if (mb >= 1) {
    return `${mb.toFixed(1)} MB`;
  } else if (kb >= 1) {
    return `${kb.toFixed(1)} KB`;
  } else {
    return `${bytes} bytes`;
  }
}

/**
 * Get export type label
 * @param {string} type - Export type
 * @returns {string} Human-readable label
 */
export function getExportTypeLabel(type) {
  const labels = {
    'agp-html': 'AGP+ Profile',
    'day-profiles-html': 'Day Profiles',
    'database-json': 'Database Backup'
  };
  return labels[type] || type;
}

/**
 * Clear all export history
 * @returns {number} Count of entries cleared
 */
export function clearExportHistory() {
  const history = getExportHistory();
  const count = history.length;
  localStorage.removeItem(EXPORT_HISTORY_KEY);
  console.log(`[exportHistory] Cleared ${count} entries`);
  return count;
}
