/**
 * DATA CLEANUP ENGINE
 * 
 * Provides functionality to selectively delete glucose readings and cartridge events
 * from the master dataset while preserving sensor database integrity.
 * 
 * Key Operations:
 * - Calculate affected data (preview before deletion)
 * - Delete glucose readings within date range
 * - Optionally delete cartridge events
 * - Update metadata and invalidate cache
 * - Never touch sensor database
 * 
 * @module cleanup-engine
 * @version 3.8.5
 */

import { 
  openDB, 
  STORES, 
  getAllRecords, 
  getRecord, 
  putRecord,
  deleteRecord
} from '../storage/db.js';
import { invalidateCache } from '../storage/masterDatasetStorage.js';
import { getAllEvents, storeEvents } from '../storage/eventStorage.js';

/**
 * Parse date to midnight (start of day)
 * @param {Date} date 
 * @returns {Date} Date at 00:00:00
 */
function toMidnight(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * Parse date to end of day
 * @param {Date} date 
 * @returns {Date} Date at 23:59:59.999
 */
function toEndOfDay(date) {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

/**
 * Generate month key from Date
 * @param {Date} date 
 * @returns {string} "YYYY-MM"
 */
function getMonthKey(date) {
  return date.toISOString().slice(0, 7);
}

/**
 * Get all month keys within date range
 * @param {Date} startDate 
 * @param {Date} endDate 
 * @returns {string[]} Array of month keys
 */
function getMonthKeysInRange(startDate, endDate) {
  const monthKeys = [];
  const current = new Date(startDate);
  
  while (current <= endDate) {
    monthKeys.push(getMonthKey(current));
    
    // Move to next month
    current.setMonth(current.getMonth() + 1);
  }
  
  return monthKeys;
}

/**
 * Calculate how much data will be affected by cleanup
 * Returns preview statistics before deletion
 * 
 * @param {Date} startDate - Start of deletion range
 * @param {Date} endDate - End of deletion range
 * @returns {Promise<Object>} { readingCount, cartridgeCount, affectedMonths }
 */
export async function calculateAffectedData(startDate, endDate) {
  const start = toMidnight(startDate);
  const end = toEndOfDay(endDate);
  
  // Get affected month keys
  const monthKeys = getMonthKeysInRange(start, end);
  
  // Count readings in range across all affected months
  let readingCount = 0;
  
  for (const monthKey of monthKeys) {
    const bucket = await getRecord(STORES.READING_BUCKETS, monthKey);
    
    if (bucket && bucket.readings) {
      // Count readings within date range
      const inRange = bucket.readings.filter(r => 
        r.timestamp >= start && r.timestamp <= end
      );
      readingCount += inRange.length;
    }
  }
  
  // Count cartridge events in range
  const events = getAllEvents();
  let cartridgeCount = 0;
  
  if (events && events.cartridgeChanges) {
    cartridgeCount = events.cartridgeChanges.filter(e => {
      const eventDate = new Date(e.timestamp);
      return eventDate >= start && eventDate <= end;
    }).length;
  }
  
  return {
    readingCount,
    cartridgeCount,
    affectedMonths: monthKeys.length,
    dateRange: {
      start: start.toISOString(),
      end: end.toISOString()
    }
  };
}

/**
 * Delete glucose readings within date range
 * 
 * Strategy:
 * 1. Load each affected month bucket
 * 2. Filter out readings within range
 * 3. Update bucket metadata
 * 4. Delete empty buckets
 * 5. Invalidate cache
 * 
 * @param {Date} startDate - Start of deletion range
 * @param {Date} endDate - End of deletion range
 * @returns {Promise<Object>} { deletedCount, errors }
 */
async function deleteGlucoseReadings(startDate, endDate) {
  const start = toMidnight(startDate);
  const end = toEndOfDay(endDate);
  
  const monthKeys = getMonthKeysInRange(start, end);
  
  let deletedCount = 0;
  const errors = [];
  
  for (const monthKey of monthKeys) {
    try {
      const bucket = await getRecord(STORES.READING_BUCKETS, monthKey);
      
      if (!bucket || !bucket.readings) {
        continue;  // No data in this month
      }
      
      // Filter OUT readings within date range (keep everything else)
      const originalCount = bucket.readings.length;
      bucket.readings = bucket.readings.filter(r => 
        r.timestamp < start || r.timestamp > end
      );
      const remainingCount = bucket.readings.length;
      
      deletedCount += (originalCount - remainingCount);
      
      if (bucket.readings.length === 0) {
        // Bucket is now empty - delete it
        await deleteRecord(STORES.READING_BUCKETS, monthKey);
      } else {
        // Update bucket metadata
        bucket.count = bucket.readings.length;
        bucket.dateRange = {
          min: bucket.readings[0]?.timestamp,
          max: bucket.readings[bucket.readings.length - 1]?.timestamp
        };
        bucket.lastUpdated = new Date();
        
        await putRecord(STORES.READING_BUCKETS, bucket);
      }
    } catch (err) {
      errors.push({ monthKey, error: err.message });
    }
  }
  
  return { deletedCount, errors };
}

/**
 * Delete cartridge events within date range
 * 
 * @param {Date} startDate 
 * @param {Date} endDate 
 * @returns {number} Count of deleted events
 */
function deleteCartridgeEvents(startDate, endDate) {
  const start = toMidnight(startDate);
  const end = toEndOfDay(endDate);
  
  const events = getAllEvents();
  
  if (!events || !events.cartridgeChanges) {
    return 0;
  }
  
  const originalCount = events.cartridgeChanges.length;
  
  // Filter OUT cartridge events within date range
  events.cartridgeChanges = events.cartridgeChanges.filter(e => {
    const eventDate = new Date(e.timestamp);
    return eventDate < start || eventDate > end;
  });
  
  const deletedCount = originalCount - events.cartridgeChanges.length;
  
  // Save updated events
  storeEvents(events);
  
  return deletedCount;
}

/**
 * Main cleanup function
 * Deletes glucose readings and optionally cartridge events within date range
 * 
 * @param {Date} startDate - Start of deletion range
 * @param {Date} endDate - End of deletion range
 * @param {Object} options - { includeCartridges: boolean }
 * @returns {Promise<Object>} Summary of cleanup operation
 */
export async function executeCleanup(startDate, endDate, options = {}) {
  const { includeCartridges = true } = options;
  
  const summary = {
    success: false,
    readingsDeleted: 0,
    cartridgesDeleted: 0,
    errors: [],
    timestamp: new Date().toISOString()
  };
  
  try {
    // 1. Delete glucose readings
    const readingResult = await deleteGlucoseReadings(startDate, endDate);
    summary.readingsDeleted = readingResult.deletedCount;
    summary.errors.push(...readingResult.errors);
    
    // 2. Optionally delete cartridge events
    if (includeCartridges) {
      summary.cartridgesDeleted = deleteCartridgeEvents(startDate, endDate);
    }
    
    // 3. Invalidate cache (will rebuild on next access)
    await invalidateCache();
    
    summary.success = summary.errors.length === 0;
    
  } catch (err) {
    summary.success = false;
    summary.errors.push({ phase: 'cleanup', error: err.message });
  }
  
  return summary;
}

/**
 * Calculate date range for "last N days"
 * @param {number} days - Number of days to go back
 * @returns {Object} { startDate, endDate }
 */
export function calculateLastNDays(days) {
  const endDate = new Date();  // Today
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  return { startDate, endDate };
}
