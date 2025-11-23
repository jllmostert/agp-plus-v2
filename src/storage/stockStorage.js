/**
 * Stock Storage - IndexedDB CRUD for sensor batches
 * v4.6.0 - Migrated from localStorage to IndexedDB for data integrity
 */

import { STORES, getAllRecords, getRecord, putRecord, deleteRecord, openDB } from './db.js';

// ============================================================================
// BATCH OPERATIONS
// ============================================================================

/**
 * Get all batches from IndexedDB
 * @returns {Promise<Array>} Array of batch objects
 */
export async function getAllBatches() {
  try {
    return await getAllRecords(STORES.STOCK_BATCHES);
  } catch (error) {
    console.error('[stockStorage] Error loading batches:', error);
    return [];
  }
}

/**
 * Get batch by ID
 * @param {string} batchId - Batch identifier
 * @returns {Promise<Object|null>} Batch object or null
 */
export async function getBatchById(batchId) {
  try {
    const batch = await getRecord(STORES.STOCK_BATCHES, batchId);
    return batch || null;
  } catch (error) {
    console.error('[stockStorage] Error loading batch:', error);
    return null;
  }
}

/**
 * Add new batch to storage
 * @param {Object} batch - Batch object (without batch_id, will be generated)
 * @returns {Promise<Object>} Created batch with ID and timestamps
 */
export async function addBatch(batch) {
  const now = new Date().toISOString();
  
  const newBatch = {
    batch_id: `BATCH-${Date.now()}`,
    ...batch,
    assigned_count: 0,
    created_at: now,
    updated_at: now
  };
  
  await putRecord(STORES.STOCK_BATCHES, newBatch);
  return newBatch;
}

/**
 * Update existing batch
 * @param {string} batchId - Batch to update
 * @param {Object} updates - Fields to update
 * @returns {Promise<Object|null>} Updated batch or null
 */
export async function updateBatch(batchId, updates) {
  const batch = await getBatchById(batchId);
  
  if (!batch) return null;
  
  const updatedBatch = {
    ...batch,
    ...updates,
    batch_id: batchId, // Prevent ID change
    updated_at: new Date().toISOString()
  };
  
  await putRecord(STORES.STOCK_BATCHES, updatedBatch);
  return updatedBatch;
}

/**
 * Delete batch from storage
 * @param {string} batchId - Batch to delete
 * @returns {Promise<boolean>} Success status
 */
export async function deleteBatch(batchId) {
  try {
    // Check if batch exists
    const batch = await getBatchById(batchId);
    if (!batch) return false;
    
    // Delete the batch
    await deleteRecord(STORES.STOCK_BATCHES, batchId);
    
    // Delete all assignments for this batch
    const db = await openDB();
    const transaction = db.transaction(STORES.STOCK_ASSIGNMENTS, 'readwrite');
    const store = transaction.objectStore(STORES.STOCK_ASSIGNMENTS);
    const index = store.index('batch_id');
    const assignments = await index.getAll(batchId);
    
    for (const assignment of assignments) {
      await store.delete(assignment.assignment_id);
    }
    
    return true;
  } catch (error) {
    console.error('[stockStorage] Error deleting batch:', error);
    return false;
  }
}

/**
 * Clear all batches from storage
 * WARNING: This deletes ALL batches and their assignments
 * @returns {Promise<boolean>} Success status
 */
export async function clearAllBatches() {
  try {
    const db = await openDB();
    
    // Clear batches
    const batchTx = db.transaction(STORES.STOCK_BATCHES, 'readwrite');
    await batchTx.objectStore(STORES.STOCK_BATCHES).clear();
    
    // Clear assignments
    const assignTx = db.transaction(STORES.STOCK_ASSIGNMENTS, 'readwrite');
    await assignTx.objectStore(STORES.STOCK_ASSIGNMENTS).clear();
    
    return true;
  } catch (error) {
    console.error('[stockStorage] Error clearing batches:', error);
    return false;
  }
}

// ============================================================================
// ASSIGNMENT OPERATIONS
// ============================================================================

/**
 * Get all assignments from IndexedDB
 * @returns {Promise<Array>} Array of assignment objects
 */
export async function getAllAssignments() {
  try {
    return await getAllRecords(STORES.STOCK_ASSIGNMENTS);
  } catch (error) {
    console.error('[stockStorage] Error loading assignments:', error);
    return [];
  }
}

/**
 * Assign sensor to batch
 * @param {string} sensorId - Sensor identifier
 * @param {string} batchId - Batch identifier
 * @param {string} assignedBy - 'manual' or 'auto'
 * @returns {Promise<Object>} Created assignment
 */
export async function assignSensorToBatch(sensorId, batchId, assignedBy = 'manual') {
  // Validate batch exists and has capacity
  const batch = await getBatchById(batchId);
  if (!batch) {
    throw new Error(`Batch ${batchId} not found - cannot assign sensor`);
  }
  
  const currentAssignments = await getAssignmentsForBatch(batchId);
  if (batch.total_quantity && currentAssignments.length >= batch.total_quantity) {
    throw new Error(
      `Batch ${batch.lot_number} is at capacity ` +
      `(${currentAssignments.length}/${batch.total_quantity} sensors assigned). ` +
      `Cannot assign additional sensors.`
    );
  }
  
  // Remove existing assignment for this sensor (if any)
  const existingAssignment = await getAssignmentForSensor(sensorId);
  if (existingAssignment) {
    await deleteRecord(STORES.STOCK_ASSIGNMENTS, existingAssignment.assignment_id);
  }
  
  const newAssignment = {
    assignment_id: `ASSIGN-${Date.now()}`,
    sensor_id: sensorId,
    batch_id: batchId,
    assigned_at: new Date().toISOString(),
    assigned_by: assignedBy
  };
  
  await putRecord(STORES.STOCK_ASSIGNMENTS, newAssignment);
  
  // Update batch assigned_count
  await updateBatchAssignedCount(batchId);
  
  return newAssignment;
}

/**
 * Unassign sensor from batch
 * @param {string} sensorId - Sensor identifier
 * @returns {Promise<boolean>} Success status
 */
export async function unassignSensor(sensorId) {
  try {
    const assignment = await getAssignmentForSensor(sensorId);
    
    if (!assignment) return false;
    
    await deleteRecord(STORES.STOCK_ASSIGNMENTS, assignment.assignment_id);
    
    // Update batch assigned_count
    await updateBatchAssignedCount(assignment.batch_id);
    
    return true;
  } catch (error) {
    console.error('[stockStorage] Error unassigning sensor:', error);
    return false;
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get assignment for a specific sensor
 * @param {string} sensorId - Sensor identifier
 * @returns {Promise<Object|null>} Assignment or null
 */
export async function getAssignmentForSensor(sensorId) {
  try {
    const db = await openDB();
    const transaction = db.transaction(STORES.STOCK_ASSIGNMENTS, 'readonly');
    const store = transaction.objectStore(STORES.STOCK_ASSIGNMENTS);
    const index = store.index('sensor_id');
    const assignment = await index.get(sensorId);
    return assignment || null;
  } catch (error) {
    console.error('[stockStorage] Error getting assignment:', error);
    return null;
  }
}

/**
 * Get all assignments for a batch
 * @param {string} batchId - Batch identifier
 * @returns {Promise<Array>} Array of assignments
 */
export async function getAssignmentsForBatch(batchId) {
  try {
    const db = await openDB();
    const transaction = db.transaction(STORES.STOCK_ASSIGNMENTS, 'readonly');
    const store = transaction.objectStore(STORES.STOCK_ASSIGNMENTS);
    const index = store.index('batch_id');
    const assignments = await index.getAll(batchId);
    return assignments || [];
  } catch (error) {
    console.error('[stockStorage] Error getting batch assignments:', error);
    return [];
  }
}

/**
 * Update assigned_count for a batch
 * @param {string} batchId - Batch identifier
 */
async function updateBatchAssignedCount(batchId) {
  try {
    const batch = await getBatchById(batchId);
    if (!batch) return;
    
    const assignments = await getAssignmentsForBatch(batchId);
    const updatedBatch = {
      ...batch,
      assigned_count: assignments.length,
      updated_at: new Date().toISOString()
    };
    
    await putRecord(STORES.STOCK_BATCHES, updatedBatch);
  } catch (error) {
    console.error('[stockStorage] Error updating batch count:', error);
  }
}

/**
 * Find batches by lot number (exact or prefix match)
 * @param {string} lotNumber - Lot number to search
 * @param {boolean} exactMatch - True for exact, false for prefix
 * @returns {Promise<Array>} Matching batches
 */
export async function findBatchesByLotNumber(lotNumber, exactMatch = false) {
  const batches = await getAllBatches();
  
  if (exactMatch) {
    return batches.filter(b => b.lot_number === lotNumber);
  }
  
  // Prefix match (e.g., "NG4A" matches "NG4A12345")
  const prefix = lotNumber.toLowerCase();
  return batches.filter(b => 
    b.lot_number.toLowerCase().startsWith(prefix)
  );
}

/**
 * Validate batch data
 * @param {Object} batch - Batch data to validate
 * @returns {Object} { valid: boolean, errors: Array }
 */
export function validateBatch(batch) {
  const errors = [];
  
  if (!batch.lot_number || batch.lot_number.trim() === '') {
    errors.push('Lot number is required');
  }
  
  if (!batch.received_date) {
    errors.push('Received date is required');
  }
  
  if (!batch.source) {
    errors.push('Source is required');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}
