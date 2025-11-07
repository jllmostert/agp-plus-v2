/**
 * DATABASE IMPORT UTILITIES
 * Import master dataset from JSON export
 * V3.8.0 - Database Import Phase
 */

import { storeMonthBucket } from './masterDatasetStorage';
import { addSensor } from './sensorStorage';
import { addCartridgeChange } from './eventStorage';
import { addBatch, assignSensorToBatch } from './stockStorage';

/**
 * Import master dataset from JSON file
 * @param {File} file - JSON file from exportMasterDataset()
 * @returns {Promise<Object>} Import result with stats and errors
 */
export async function importMasterDataset(file) {
  const startTime = Date.now();
  const stats = {
    monthsImported: 0,
    readingsImported: 0,
    sensorsImported: 0,
    cartridgesImported: 0,
    workdaysImported: 0,
    patientInfoImported: false,
    stockBatchesImported: 0,
    stockAssignmentsImported: 0
  };
  const errors = [];
  try {
    // Step 1: Parse JSON file
    console.log('[importMasterDataset] Reading file...');
    const text = await file.text();
    const data = JSON.parse(text);
    
    // Step 2: Validate schema version
    console.log('[importMasterDataset] Validating schema...');
    if (!data.version) {
      errors.push('Missing schema version - cannot validate compatibility');
      return {
        success: false,
        stats,
        errors,
        duration: Date.now() - startTime
      };
    }
    
    if (data.version !== '3.8.0') {
      errors.push(`Schema version mismatch: file is ${data.version}, app expects 3.8.0`);
      // Continue anyway - might still work
    }
    
    // Step 3: Validate required fields
    if (!data.months || !Array.isArray(data.months)) {
      errors.push('Invalid or missing months data');
      return {
        success: false,
        stats,
        errors,
        duration: Date.now() - startTime
      };
    }
    
    console.log('[importMasterDataset] Schema valid, starting import...');
    console.log('[importMasterDataset] File contains:', {
      months: data.months?.length || 0,
      sensors: data.sensors?.length || 0,
      cartridges: data.cartridges?.length || 0,
      workdays: data.workdays?.length || 0,
      hasPatientInfo: !!data.patientInfo,
      stockBatches: data.stockBatches?.length || 0
    });
    
    // TODO: Import months
    // Step 4: Import month buckets to IndexedDB
    console.log('[importMasterDataset] Importing months to IndexedDB...');
    for (const monthData of data.months) {
      try {
        await storeMonthBucket(monthData.month, monthData.readings);
        stats.monthsImported++;
        stats.readingsImported += monthData.readings?.length || 0;
      } catch (err) {
        errors.push(`Failed to import month ${monthData.month}: ${err.message}`);
        console.error('[importMasterDataset] Month import error:', err);
      }
    }
    console.log(`[importMasterDataset] Imported ${stats.monthsImported} months, ${stats.readingsImported} readings`);
    
    // Step 5: Import sensors to localStorage (recent) and IndexedDB (historical)
    console.log('[importMasterDataset] Importing sensors...');
    if (data.sensors && Array.isArray(data.sensors)) {
      for (const sensor of data.sensors) {
        try {
          await addSensor(sensor);
          stats.sensorsImported++;
        } catch (err) {
          errors.push(`Failed to import sensor ${sensor.sensor_id}: ${err.message}`);
          console.error('[importMasterDataset] Sensor import error:', err);
        }
      }
      console.log(`[importMasterDataset] Imported ${stats.sensorsImported} sensors`);
    }
    
    // Step 6: Import cartridges to IndexedDB
    console.log('[importMasterDataset] Importing cartridges...');
    if (data.cartridges && Array.isArray(data.cartridges)) {
      for (const cartridge of data.cartridges) {
        try {
          await addCartridgeChange(cartridge);
          stats.cartridgesImported++;
        } catch (err) {
          errors.push(`Failed to import cartridge ${cartridge.cartridge_id}: ${err.message}`);
          console.error('[importMasterDataset] Cartridge import error:', err);
        }
      }
      console.log(`[importMasterDataset] Imported ${stats.cartridgesImported} cartridges`);
    }
    
    // Step 7: Import ProTime workdays to localStorage
    console.log('[importMasterDataset] Importing workdays...');
    if (data.workdays && Array.isArray(data.workdays)) {
      try {
        localStorage.setItem('workday-dates', JSON.stringify(data.workdays));
        stats.workdaysImported = data.workdays.length;
        console.log(`[importMasterDataset] Imported ${stats.workdaysImported} workdays`);
      } catch (err) {
        errors.push(`Failed to import workdays: ${err.message}`);
        console.error('[importMasterDataset] Workdays import error:', err);
      }
    }
    
    // Step 8: Import patient info to localStorage
    console.log('[importMasterDataset] Importing patient info...');
    if (data.patientInfo) {
      try {
        localStorage.setItem('patient-info', JSON.stringify(data.patientInfo));
        stats.patientInfoImported = true;
        console.log('[importMasterDataset] Patient info imported');
      } catch (err) {
        errors.push(`Failed to import patient info: ${err.message}`);
        console.error('[importMasterDataset] Patient info import error:', err);
      }
    }
    
    // Step 9: Import stock batches
    console.log('[importMasterDataset] Importing stock batches...');
    if (data.stockBatches && Array.isArray(data.stockBatches)) {
      for (const batch of data.stockBatches) {
        try {
          addBatch(batch);
          stats.stockBatchesImported++;
        } catch (err) {
          errors.push(`Failed to import batch ${batch.batch_id}: ${err.message}`);
          console.error('[importMasterDataset] Stock batch import error:', err);
        }
      }
      console.log(`[importMasterDataset] Imported ${stats.stockBatchesImported} stock batches`);
    }
    
    // Step 10: Import stock assignments
    console.log('[importMasterDataset] Importing stock assignments...');
    if (data.stockAssignments && Array.isArray(data.stockAssignments)) {
      for (const assignment of data.stockAssignments) {
        try {
          assignSensorToBatch(assignment.sensor_id, assignment.batch_id);
          stats.stockAssignmentsImported++;
        } catch (err) {
          errors.push(`Failed to import assignment for sensor ${assignment.sensor_id}: ${err.message}`);
          console.error('[importMasterDataset] Stock assignment import error:', err);
        }
      }
      console.log(`[importMasterDataset] Imported ${stats.stockAssignmentsImported} stock assignments`);
    }
    
    const duration = Date.now() - startTime;
    
    return {
      success: true,
      stats,
      errors: errors.length > 0 ? errors : undefined,
      duration
    };
    
  } catch (error) {
    console.error('[importMasterDataset] Fatal error:', error);
    return {
      success: false,
      stats,
      errors: [error.message],
      duration: Date.now() - startTime
    };
  }
}

/**
 * Validate import file without modifying data (dry-run)
 * @param {File} file - JSON file to validate
 * @returns {Promise<Object>} Validation result
 */
export async function validateImportFile(file) {
  // TODO: Implement validation
  return {
    valid: false,
    errors: ['Validation not yet implemented']
  };
}
