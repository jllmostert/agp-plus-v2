/**
 * STOCK IMPORT/EXPORT MODULE
 * Handle sensor stock batches with sensor assignments
 * V4.2.2 - Stock import/export with replace mode
 */

import { getAllBatches, addBatch, getAllAssignments, assignSensorToBatch, clearAllBatches } from './stockStorage.js';
import { getAllSensors } from './sensorStorage.js';
import { VERSION } from '../version.js';

/**
 * Export stock data to JSON
 * Includes batches and their sensor assignments
 * @returns {Promise<Object>} Export data with batches and assignments
 */
export async function exportStock() {
  try {
    const batches = getAllBatches();
    const assignments = getAllAssignments();
    const sensors = await getAllSensors();
    
    // Create a map of sensor IDs to sensor details for validation
    const sensorMap = new Map(sensors.map(s => [s.id, s]));
    
    // Enrich assignments with sensor details
    const enrichedAssignments = assignments.map(assignment => {
      const sensor = sensorMap.get(assignment.sensor_id);
      return {
        ...assignment,
        sensor_details: sensor ? {
          sequence: sensor.sequence,
          start_date: sensor.start_date,
          end_date: sensor.end_date,
          lot_number: sensor.lot_number,
          duration_days: sensor.duration_days
        } : null
      };
    });
    
    // Calculate statistics per batch
    const batchStats = batches.map(batch => {
      const batchAssignments = enrichedAssignments.filter(a => a.batch_id === batch.batch_id);
      
      return {
        ...batch,
        assigned_sensors: batchAssignments,
        assignment_count: batchAssignments.length,
        usage_percentage: batch.total_quantity ? 
          Math.round((batchAssignments.length / batch.total_quantity) * 100) : null
      };
    });
    
    const exportData = {
      version: VERSION,
      export_date: new Date().toISOString(),
      export_type: 'stock',
      statistics: {
        total_batches: batches.length,
        total_assignments: assignments.length,
        total_sensors_assigned: new Set(assignments.map(a => a.sensor_id)).size,
        total_quantity_in_stock: batches.reduce((sum, b) => sum + (b.total_quantity || 0), 0),
        total_used: assignments.length
      },
      batches: batchStats
    };
    
    return { success: true, data: exportData };
    
  } catch (error) {
    console.error('[exportStock] Error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Import stock data from JSON
 * Validates sensor connections and handles duplicates
 * @param {File} file - JSON file with stock data
 * @param {Object} options - Import options
 * @param {boolean} options.mergeMode - If true, merge with existing (default: true)
 * @param {boolean} options.validateSensors - If true, validate sensor references (default: true)
 * @param {boolean} options.reconnectSensors - If true, try to reconnect sensors by lot_number/date (default: true)
 * @returns {Promise<Object>} Import result with statistics
 */
export async function importStock(file, options = {}) {
  const {
    mergeMode = true,
    validateSensors = true,
    reconnectSensors = true
  } = options;
  
  const errors = [];
  const warnings = [];
  const stats = {
    batches_imported: 0,
    batches_skipped: 0,
    assignments_imported: 0,
    assignments_skipped: 0,
    assignments_reconnected: 0,
    assignments_failed: 0
  };
  
  try {
    // Parse JSON
    const text = await file.text();
    const data = JSON.parse(text);
    
    // Validate structure
    if (data.export_type !== 'stock') {
      warnings.push('File may not be a stock export - missing export_type field');
    }
    
    if (!data.batches || !Array.isArray(data.batches)) {
      return {
        success: false,
        stats,
        errors: ['Invalid stock export: missing or invalid "batches" array'],
        warnings
      };
    }
    
    // REPLACE MODE: Clear existing stock before import
    if (!mergeMode) {
      console.log('[importStock] Replace mode: clearing existing stock');
      clearAllBatches();
    }
    
    // Load current state (empty if replace mode)
    const existingBatches = getAllBatches();
    const existingBatchIds = new Set(existingBatches.map(b => b.batch_id));
    const existingAssignments = getAllAssignments();
    const existingAssignmentMap = new Map(
      existingAssignments.map(a => [a.sensor_id, a])
    );
    
    // Get sensor list for validation
    const sensors = validateSensors ? await getAllSensors() : [];
    const sensorMap = new Map(sensors.map(s => [s.id, s]));
    
    // Import batches
    for (const batch of data.batches) {
      try {
        // Check for duplicate (only in merge mode)
        if (mergeMode && existingBatchIds.has(batch.batch_id)) {
          stats.batches_skipped++;
          warnings.push(`Batch ${batch.lot_number} (${batch.batch_id}) already exists - skipped`);
          continue;
        }
        
        // Add batch (without assigned_sensors array)
        const { assigned_sensors, assignment_count, usage_percentage, ...batchData } = batch;
        addBatch(batchData);
        stats.batches_imported++;
        
        // Import assignments for this batch
        if (batch.assigned_sensors && Array.isArray(batch.assigned_sensors)) {
          for (const assignment of batch.assigned_sensors) {
            try {
              const sensorId = assignment.sensor_id;
              
              // Check if sensor already has an assignment
              if (existingAssignmentMap.has(sensorId)) {
                stats.assignments_skipped++;
                warnings.push(`Sensor ${sensorId} already assigned to a batch - skipped`);
                continue;
              }
              
              // Validate sensor exists
              let sensorExists = sensorMap.has(sensorId);
              let actualSensorId = sensorId;
              
              if (!sensorExists && reconnectSensors && assignment.sensor_details) {
                // Try to find sensor by start date and lot number
                const matchingSensor = sensors.find(s => 
                  s.start_date === assignment.sensor_details.start_date &&
                  s.lot_number === assignment.sensor_details.lot_number
                );
                
                if (matchingSensor) {
                  actualSensorId = matchingSensor.id;
                  sensorExists = true;
                  stats.assignments_reconnected++;
                  warnings.push(`Reconnected sensor: old ID ${sensorId} → new ID ${actualSensorId}`);
                }
              }
              
              if (!sensorExists && validateSensors) {
                stats.assignments_failed++;
                warnings.push(`Sensor ${sensorId} not found in database - assignment skipped`);
                continue;
              }
              
              // Create assignment
              assignSensorToBatch(actualSensorId, batch.batch_id, assignment.assigned_by || 'imported');
              stats.assignments_imported++;
              
            } catch (err) {
              stats.assignments_failed++;
              errors.push(`Failed to import assignment for sensor ${assignment.sensor_id}: ${err.message}`);
            }
          }
        }
        
      } catch (err) {
        errors.push(`Failed to import batch ${batch.lot_number}: ${err.message}`);
      }
    }
    
    return {
      success: true,
      stats,
      errors: errors.length > 0 ? errors : null,
      warnings: warnings.length > 0 ? warnings : null
    };
    
  } catch (error) {
    return {
      success: false,
      stats,
      errors: [`Stock import failed: ${error.message}`],
      warnings: warnings.length > 0 ? warnings : null
    };
  }
}

/**
 * Download stock data as JSON file
 * @param {Object} data - Stock export data
 * @param {string} filename - Target filename (optional)
 */
export function downloadStockJSON(data, filename = null) {
  const defaultFilename = `agp-stock-${Date.now()}.json`;
  const jsonStr = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = filename || defaultFilename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Complete export flow: export + download
 * @returns {Promise<{success: boolean, filename: string, batchCount: number, assignmentCount: number}>}
 */
export async function exportAndDownloadStock() {
  try {
    const result = await exportStock();
    
    if (!result.success) {
      return { success: false, error: result.error };
    }
    
    const filename = `agp-stock-${Date.now()}.json`;
    downloadStockJSON(result.data, filename);
    
    return {
      success: true,
      filename,
      batchCount: result.data.batches.length,
      assignmentCount: result.data.statistics.total_assignments
    };
  } catch (error) {
    console.error('[exportAndDownloadStock] Failed:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Validate stock import file without importing (dry-run)
 * @param {File} file - JSON file to validate
 * @returns {Promise<Object>} Validation result
 */
export async function validateStockImportFile(file) {
  const errors = [];
  const warnings = [];
  
  try {
    const text = await file.text();
    const data = JSON.parse(text);
    
    // Check structure
    if (data.export_type !== 'stock') {
      warnings.push('File may not be a stock export');
    }
    
    if (!data.batches || !Array.isArray(data.batches)) {
      errors.push('Missing or invalid "batches" array');
      return { valid: false, errors, warnings };
    }
    
    // Count what will be imported
    let totalAssignments = 0;
    for (const batch of data.batches) {
      if (batch.assigned_sensors && Array.isArray(batch.assigned_sensors)) {
        totalAssignments += batch.assigned_sensors.length;
      }
    }
    
    return {
      valid: true,
      summary: {
        version: data.version || 'unknown',
        export_date: data.export_date || 'unknown',
        batch_count: data.batches.length,
        assignment_count: totalAssignments,
        statistics: data.statistics
      },
      errors: null,
      warnings: warnings.length > 0 ? warnings : null
    };
    
  } catch (error) {
    errors.push(`Validation failed: ${error.message}`);
    return { valid: false, errors, warnings };
  }
}
