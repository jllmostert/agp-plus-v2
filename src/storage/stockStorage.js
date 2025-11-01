/**
 * Stock Storage - localStorage CRUD for sensor batches
 * v3.15.0 - Batch registration and assignment tracking
 */

const BATCHES_KEY = 'agp-stock-batches';
const ASSIGNMENTS_KEY = 'agp-stock-assignments';

// ============================================================================
// BATCH OPERATIONS
// ============================================================================

/**
 * Get all batches from localStorage
 * @returns {Array} Array of batch objects
 */
export function getAllBatches() {
  try {
    const data = localStorage.getItem(BATCHES_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('[stockStorage] Error loading batches:', error);
    return [];
  }
}

/**
 * Get batch by ID
 * @param {string} batchId - Batch identifier
 * @returns {Object|null} Batch object or null
 */
export function getBatchById(batchId) {
  const batches = getAllBatches();
  return batches.find(b => b.batch_id === batchId) || null;
}

/**
 * Add new batch to storage
 * @param {Object} batch - Batch object (without batch_id, will be generated)
 * @returns {Object} Created batch with ID and timestamps
 */
export function addBatch(batch) {
  const batches = getAllBatches();
  const now = new Date().toISOString();
  
  const newBatch = {
    batch_id: `BATCH-${Date.now()}`,
    ...batch,
    assigned_count: 0,
    created_at: now,
    updated_at: now
  };
  
  batches.push(newBatch);
  localStorage.setItem(BATCHES_KEY, JSON.stringify(batches));
  return newBatch;
}

/**
 * Update existing batch
 * @param {string} batchId - Batch to update
 * @param {Object} updates - Fields to update
 * @returns {Object|null} Updated batch or null
 */
export function updateBatch(batchId, updates) {
  const batches = getAllBatches();
  const index = batches.findIndex(b => b.batch_id === batchId);
  
  if (index === -1) return null;
  
  batches[index] = {
    ...batches[index],
    ...updates,
    batch_id: batchId, // Prevent ID change
    updated_at: new Date().toISOString()
  };
  
  localStorage.setItem(BATCHES_KEY, JSON.stringify(batches));
  return batches[index];
}

/**
 * Delete batch from storage
 * @param {string} batchId - Batch to delete
 * @returns {boolean} Success status
 */
export function deleteBatch(batchId) {
  const batches = getAllBatches();
  const filtered = batches.filter(b => b.batch_id !== batchId);
  
  if (filtered.length === batches.length) return false; // Not found
  
  localStorage.setItem(BATCHES_KEY, JSON.stringify(filtered));
  
  // Also delete all assignments for this batch
  const assignments = getAllAssignments();
  const cleanedAssignments = assignments.filter(a => a.batch_id !== batchId);
  localStorage.setItem(ASSIGNMENTS_KEY, JSON.stringify(cleanedAssignments));
  
  return true;
}

// ============================================================================
// ASSIGNMENT OPERATIONS
// ============================================================================

/**
 * Get all assignments from localStorage
 * @returns {Array} Array of assignment objects
 */
export function getAllAssignments() {
  try {
    const data = localStorage.getItem(ASSIGNMENTS_KEY);
    return data ? JSON.parse(data) : [];
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
 * @returns {Object} Created assignment
 */
export function assignSensorToBatch(sensorId, batchId, assignedBy = 'manual') {
  const assignments = getAllAssignments();
  
  // Validate batch exists and has capacity
  const batch = getBatchById(batchId);
  if (!batch) {
    throw new Error(`Batch ${batchId} not found - cannot assign sensor`);
  }
  
  const currentAssignments = assignments.filter(a => a.batch_id === batchId);
  if (batch.total_quantity && currentAssignments.length >= batch.total_quantity) {
    throw new Error(
      `Batch ${batch.lot_number} is at capacity ` +
      `(${currentAssignments.length}/${batch.total_quantity} sensors assigned). ` +
      `Cannot assign additional sensors.`
    );
  }
  
  // Remove existing assignment for this sensor (if any)
  const filtered = assignments.filter(a => a.sensor_id !== sensorId);
  
  const newAssignment = {
    assignment_id: `ASSIGN-${Date.now()}`,
    sensor_id: sensorId,
    batch_id: batchId,
    assigned_at: new Date().toISOString(),
    assigned_by: assignedBy
  };
  
  filtered.push(newAssignment);
  localStorage.setItem(ASSIGNMENTS_KEY, JSON.stringify(filtered));
  
  // Update batch assigned_count
  updateBatchAssignedCount(batchId);
  
  return newAssignment;
}

/**
 * Unassign sensor from batch
 * @param {string} sensorId - Sensor identifier
 * @returns {boolean} Success status
 */
export function unassignSensor(sensorId) {
  const assignments = getAllAssignments();
  const assignment = assignments.find(a => a.sensor_id === sensorId);
  
  if (!assignment) return false;
  
  const filtered = assignments.filter(a => a.sensor_id !== sensorId);
  localStorage.setItem(ASSIGNMENTS_KEY, JSON.stringify(filtered));
  
  // Update batch assigned_count
  updateBatchAssignedCount(assignment.batch_id);
  
  return true;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get assignment for a specific sensor
 * @param {string} sensorId - Sensor identifier
 * @returns {Object|null} Assignment or null
 */
export function getAssignmentForSensor(sensorId) {
  const assignments = getAllAssignments();
  return assignments.find(a => a.sensor_id === sensorId) || null;
}

/**
 * Get all assignments for a batch
 * @param {string} batchId - Batch identifier
 * @returns {Array} Array of assignments
 */
export function getAssignmentsForBatch(batchId) {
  const assignments = getAllAssignments();
  return assignments.filter(a => a.batch_id === batchId);
}

/**
 * Update assigned_count for a batch
 * @param {string} batchId - Batch identifier
 */
function updateBatchAssignedCount(batchId) {
  const batches = getAllBatches();
  const index = batches.findIndex(b => b.batch_id === batchId);
  
  if (index === -1) return;
  
  const count = getAssignmentsForBatch(batchId).length;
  batches[index].assigned_count = count;
  batches[index].updated_at = new Date().toISOString();
  
  localStorage.setItem(BATCHES_KEY, JSON.stringify(batches));
}

/**
 * Find batches by lot number (exact or prefix match)
 * @param {string} lotNumber - Lot number to search
 * @param {boolean} exactMatch - True for exact, false for prefix
 * @returns {Array} Matching batches
 */
export function findBatchesByLotNumber(lotNumber, exactMatch = false) {
  const batches = getAllBatches();
  
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
