/**
 * Data Cleanup Module
 * 
 * Handles deletion of glucose data, cartridge events, and related records.
 * Provides both "all-in" reset and date-range based cleanup.
 * 
 * Extracted from masterDatasetStorage.js (v4.4.1)
 */

import { 
  openDB, 
  STORES, 
  getAllRecords, 
  putRecord, 
  deleteRecord 
} from './db.js';
import { debug } from '../utils/debug.js';

/**
 * Delete glucose readings within a date range
 * 
 * @param {Date} startDate - Start of deletion range (inclusive)
 * @param {Date} endDate - End of deletion range (inclusive)
 * @returns {Promise<number>} Count of readings deleted
 */
export async function deleteGlucoseDataInRange(startDate, endDate) {
  const startTime = startDate.getTime();
  const endTime = endDate.getTime();
  
  const buckets = await getAllRecords(STORES.READING_BUCKETS);
  let totalDeleted = 0;
  
  for (const bucket of buckets) {
    const originalCount = bucket.readings.length;
    bucket.readings = bucket.readings.filter(r => {
      const ts = new Date(r.timestamp).getTime();
      return ts < startTime || ts > endTime;
    });
    
    const deleted = originalCount - bucket.readings.length;
    totalDeleted += deleted;
    
    bucket.count = bucket.readings.length;
    if (bucket.count > 0) {
      bucket.dateRange = {
        min: bucket.readings[0].timestamp,
        max: bucket.readings[bucket.readings.length - 1].timestamp
      };
      bucket.lastUpdated = new Date();
      await putRecord(STORES.READING_BUCKETS, bucket);
    } else {
      await deleteRecord(STORES.READING_BUCKETS, bucket.monthKey);
    }
  }
  
  // Invalidate cache
  const { invalidateCache } = await import('./masterDatasetStorage.js');
  await invalidateCache();
  
  debug.log(`[dataCleanup] Deleted ${totalDeleted} glucose readings`);
  return totalDeleted;
}

/**
 * Cleanup records based on type
 * 
 * Types:
 * - 'all-in': Delete readings, cartridges, ProTime, BG readings. Keep patient, sensors, stock
 * - 'date-range': Delete data within specified date range
 * 
 * @param {Object} options - Cleanup options
 * @param {string} options.type - 'all-in' or 'date-range'
 * @param {Date} options.startDate - Start date (for date-range)
 * @param {Date} options.endDate - End date (for date-range)
 * @returns {Promise<Object>} Result with success status
 */
export async function cleanupRecords(options) {
  try {
    const db = await openDB();
    
    if (options.type === 'all-in') {
      debug.log('[dataCleanup] ALL-IN: Deleting readings, cartridges, ProTime, BG. Keeping patient, sensors, stock');
      
      // Delete glucose readings
      const tx = db.transaction([STORES.READING_BUCKETS], 'readwrite');
      await tx.objectStore(STORES.READING_BUCKETS).clear();
      await tx.done;
      
      // Clear cartridge events
      const { clearCartridgeChanges } = await import('./cartridgeStorage.js');
      await clearCartridgeChanges();
      
      // Clear ProTime data
      const { deleteProTimeData } = await import('./protimeStorage.js');
      await deleteProTimeData();
      
      // Clear TDD data
      const { deleteTDDData } = await import('./tddStorage.js');
      await deleteTDDData();
      
      // Clear BG readings
      const { deleteAllBGReadings } = await import('./bgReadingsStorage.js');
      await deleteAllBGReadings();
      
      // Invalidate cache
      const { invalidateCache } = await import('./masterDatasetStorage.js');
      await invalidateCache();
      
      debug.log('[dataCleanup] ALL-IN complete - kept sensors & stock');
      
      return {
        success: true,
        deletedCount: 'ALL',
        message: 'Readings, cartridges, ProTime, TDD, BG deleted (kept patient, sensors, stock)'
      };
    }
    
    if (options.type === 'date-range' && options.startDate && options.endDate) {
      debug.log(`[dataCleanup] Date range: ${options.startDate} to ${options.endDate}`);
      
      let totalDeleted = 0;
      
      // Delete glucose readings in range
      const glucoseDeleted = await deleteGlucoseDataInRange(options.startDate, options.endDate);
      totalDeleted += glucoseDeleted;
      
      // Delete ProTime in range
      const { deleteProTimeDataInRange } = await import('./protimeStorage.js');
      const protimeResult = await deleteProTimeDataInRange(options.startDate, options.endDate);
      totalDeleted += protimeResult.deleted;
      
      // Delete BG readings in range
      const { deleteBGReadingsInRange } = await import('./bgReadingsStorage.js');
      const bgResult = await deleteBGReadingsInRange(options.startDate, options.endDate);
      totalDeleted += bgResult.deleted;
      
      return {
        success: true,
        deletedCount: totalDeleted,
        message: `Deleted ${totalDeleted} records in date range`
      };
    }
    
    return {
      success: false,
      error: 'Invalid cleanup type or missing date range'
    };
    
  } catch (err) {
    console.error('[dataCleanup] Error:', err);
    return {
      success: false,
      error: err.message
    };
  }
}

export default {
  deleteGlucoseDataInRange,
  cleanupRecords
};
