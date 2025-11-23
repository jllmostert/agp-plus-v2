/**
 * Stock Engine - Business logic for batch management
 * v3.15.0 - Calculations, matching, transformations
 */

import {
  getAllBatches,
  getAllAssignments,
  getAssignmentsForBatch,
  findBatchesByLotNumber
} from '../storage/stockStorage.js';

// ============================================================================
// BATCH STATISTICS
// ============================================================================

/**
 * Calculate statistics for a batch
 * @param {Object} batch - Batch object
 * @returns {Object} Statistics
 */
export function calculateBatchStats(batch) {
  const assignments = getAssignmentsForBatch(batch.batch_id);
  
  return {
    batch_id: batch.batch_id,
    assigned_count: assignments.length,
    total_quantity: batch.total_quantity || 0,
    remaining_count: (batch.total_quantity || 0) - assignments.length,
    usage_percentage: batch.total_quantity 
      ? Math.round((assignments.length / batch.total_quantity) * 100)
      : 0
  };
}

/**
 * Get all batches with calculated statistics
 * @returns {Array} Batches with stats
 */
export async function getAllBatchesWithStats() {
  const batches = await getAllBatches();
  return batches.map(batch => ({
    ...batch,
    stats: calculateBatchStats(batch)
  }));
}

// ============================================================================
// AUTO-MATCHING
// ============================================================================

/**
 * Find matching batches for a sensor based on lot number
 * @param {string} sensorId - Sensor ID (e.g., "NG4A12345-001")
 * @returns {Array} Matching batches, sorted by relevance
 */
export function findMatchingBatches(sensorId) {
  // Extract lot prefix from sensor ID (e.g., "NG4A12345" from "NG4A12345-001")
  const lotPrefix = sensorId.split('-')[0];
  
  // Find batches with matching lot numbers
  const matches = findBatchesByLotNumber(lotPrefix, false);
  
  // Sort by relevance: exact match first, then by received date (newest first)
  return matches.sort((a, b) => {
    const aExact = a.lot_number === lotPrefix;
    const bExact = b.lot_number === lotPrefix;
    
    if (aExact && !bExact) return -1;
    if (!aExact && bExact) return 1;
    
    // Both exact or both partial - sort by date
    return new Date(b.received_date) - new Date(a.received_date);
  });
}

// ============================================================================
// SORTING AND FILTERING
// ============================================================================

/**
 * Sort batches by various criteria
 * @param {Array} batches - Batches to sort
 * @param {string} sortBy - Sort field
 * @param {string} direction - 'asc' or 'desc'
 * @returns {Array} Sorted batches
 */
export function sortBatches(batches, sortBy = 'received_date', direction = 'desc') {
  if (!batches || !Array.isArray(batches)) return []; // âœ… Defensive guard
  const sorted = [...batches];
  
  sorted.sort((a, b) => {
    let aVal, bVal;
    
    switch (sortBy) {
      case 'received_date':
        aVal = new Date(a.received_date);
        bVal = new Date(b.received_date);
        break;
      case 'lot_number':
        aVal = a.lot_number.toLowerCase();
        bVal = b.lot_number.toLowerCase();
        break;
      case 'assigned_count':
        aVal = a.assigned_count || 0;
        bVal = b.assigned_count || 0;
        break;
      case 'expiry_date':
        aVal = new Date(a.expiry_date || '9999-12-31');
        bVal = new Date(b.expiry_date || '9999-12-31');
        break;
      default:
        return 0;
    }
    
    if (aVal < bVal) return direction === 'asc' ? -1 : 1;
    if (aVal > bVal) return direction === 'asc' ? 1 : -1;
    return 0;
  });
  
  return sorted;
}

/**
 * Filter batches by search query
 * @param {Array} batches - Batches to filter
 * @param {string} query - Search query
 * @returns {Array} Filtered batches
 */
export function filterBatches(batches, query) {
  if (!batches || !Array.isArray(batches)) return []; // âœ… Defensive guard
  if (!query || query.trim() === '') return batches;
  
  const lowerQuery = query.toLowerCase();
  
  return batches.filter(batch => {
    return (
      batch.lot_number.toLowerCase().includes(lowerQuery) ||
      batch.source.toLowerCase().includes(lowerQuery) ||
      (batch.notes && batch.notes.toLowerCase().includes(lowerQuery))
    );
  });
}

/**
 * Calculate overall summary statistics
 * @returns {Object} Summary statistics
 */
export async function calculateSummaryStats() {
  const batches = await getAllBatches();
  const assignments = await getAllAssignments();
  
  const totalQuantity = batches.reduce((sum, b) => sum + (b.total_quantity || 0), 0);
  const assignedCount = assignments.length;
  
  return {
    totalBatches: batches.length,
    totalQuantity,
    assignedCount,
    remainingCount: totalQuantity - assignedCount,
    usagePercentage: totalQuantity ? Math.round((assignedCount / totalQuantity) * 100) : 0
  };
}


/**
 * Suggest batch assignments for newly detected sensors
 * @param {Array<string>} sensorIds - Array of sensor IDs from CSV upload
 * @returns {Array<Object>} Suggestions array: [{sensorId, matches: [{batch, confidence}]}]
 */
export function suggestBatchAssignments(sensorIds) {
  if (!sensorIds || sensorIds.length === 0) {
    return [];
  }
  
  const suggestions = [];
  
  for (const sensorId of sensorIds) {
    const matches = findMatchingBatches(sensorId);
    
    if (matches.length > 0) {
      suggestions.push({
        sensorId,
        matches: matches.map(batch => ({
          batch,
          confidence: batch.lot_number === extractLotPrefix(sensorId) ? 'exact' : 'prefix'
        }))
      });
    }
  }
  
  return suggestions;
}

/**
 * Helper: Extract lot prefix from sensor ID (e.g., "NG4A12345" from "NG4A12345-001")
 * @param {string} sensorId - Full sensor ID
 * @returns {string} Lot prefix
 */
function extractLotPrefix(sensorId) {
  return sensorId.split('-')[0];
}
