/**
 * DATABASE IMPORT UTILITIES
 * Import master dataset from JSON export
 * V3.8.0 - Database Import Phase
 */

import { debug } from '../utils/debug.js';
import { appendReadingsToMaster } from './masterDatasetStorage';
import { addSensor } from './sensorStorage';
import { addCartridgeChange } from './cartridgeStorage';
import { addBatch, assignSensorToBatch } from './stockStorage';
import { savePumpSettings, importDeviceData } from './pumpSettingsStorage';

/**
 * Import master dataset from JSON file
 * @param {File} file - JSON file from exportMasterDataset()
 * @param {Function} onProgress - Optional progress callback (stage, current, total, percentage)
 * @returns {Promise<Object>} Import result with stats and errors
 */
export async function importMasterDataset(file, onProgress = null) {
  const startTime = Date.now();
  const stages = ['months', 'sensors', 'cartridges', 'workdays', 'patientInfo', 'stockBatches', 'stockAssignments', 'pumpSettings'];
  const totalStages = stages.length;
  
  const stats = {
    monthsImported: 0,
    readingsImported: 0,
    sensorsImported: 0,
    cartridgesImported: 0,
    workdaysImported: 0,
    patientInfoImported: false,
    stockBatchesImported: 0,
    stockAssignmentsImported: 0,
    pumpSettingsImported: false,
    deviceHistoryImported: 0
  };
  const errors = [];
  
  // Helper to report progress
  const reportProgress = (stageIndex, stageName) => {
    if (onProgress) {
      onProgress({
        stage: stageName,
        current: stageIndex + 1,
        total: totalStages,
        percentage: Math.round(((stageIndex + 1) / totalStages) * 100)
      });
    }
  };
  
  try {
    // Step 1: Parse JSON file
    const text = await file.text();
    const data = JSON.parse(text);
    
    // Step 2: Validate schema version
    if (!data.version) {
      errors.push('Missing schema version - cannot validate compatibility');
      return {
        success: false,
        stats,
        errors,
        duration: Date.now() - startTime
      };
    }
    
    if (!['3.8.0', '4.0.0', '4.1.0'].includes(data.version)) {
      errors.push(`Schema version mismatch: file is ${data.version}, app expects 3.8.0 or 4.x.x`);
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
    
    // Step 4: Import month buckets to IndexedDB
    try {
      // Flatten all readings from all months
      const allReadings = [];
      for (const monthData of data.months) {
        if (monthData.readings && Array.isArray(monthData.readings)) {
          // Convert string timestamps to Date objects
          const convertedReadings = monthData.readings.map(reading => ({
            ...reading,
            timestamp: new Date(reading.timestamp),
            glucose: reading.glucose ?? reading.value
          }));
          allReadings.push(...convertedReadings);
          stats.monthsImported++;
        }
      }
      
      if (allReadings.length > 0) {
        await appendReadingsToMaster(allReadings, 'imported-data.json');
        stats.readingsImported = allReadings.length;
      }
      
      reportProgress(0, 'glucose readings');
      
    } catch (err) {
      errors.push(`Failed to import glucose data: ${err.message}`);
      console.error('[importMasterDataset] Glucose import error:', err);
    }
    
    // Step 5: Import sensors to localStorage (recent) and IndexedDB (historical)
    debug.log('[importMasterDataset] Importing sensors...');
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
      debug.log(`[importMasterDataset] Imported ${stats.sensorsImported} sensors`);
    }
    reportProgress(1, 'sensors');
    
    // Step 6: Import cartridges to IndexedDB
    debug.log('[importMasterDataset] Importing cartridges...');
    if (data.cartridges && Array.isArray(data.cartridges)) {
      for (const cartridge of data.cartridges) {
        try {
          // Convert back to function parameters
          const timestamp = new Date(cartridge.timestamp);
          await addCartridgeChange(
            timestamp, 
            cartridge.alarmText || 'Rewind',
            cartridge.sourceFile || 'imported-data.json'
          );
          stats.cartridgesImported++;
        } catch (err) {
          // Skip duplicates silently
          if (!err.message.includes('Duplicate')) {
            errors.push(`Failed to import cartridge: ${err.message}`);
            console.error('[importMasterDataset] Cartridge import error:', err);
          }
        }
      }
      debug.log(`[importMasterDataset] Imported ${stats.cartridgesImported} cartridges`);
    }
    reportProgress(2, 'cartridges');
    
    // Step 7: Import ProTime workdays to IndexedDB
    debug.log('[importMasterDataset] Importing workdays...');
    if (data.workdays && Array.isArray(data.workdays)) {
      try {
        const { saveProTimeData } = await import('./masterDatasetStorage');
        const workdaySet = new Set(data.workdays);
        await saveProTimeData(workdaySet);
        stats.workdaysImported = data.workdays.length;
        debug.log(`[importMasterDataset] Imported ${stats.workdaysImported} workdays to IndexedDB`);
        // V2 localStorage compatibility removed in v4.5.0
      } catch (err) {
        errors.push(`Failed to import workdays: ${err.message}`);
        console.error('[importMasterDataset] Workdays import error:', err);
      }
    }
    reportProgress(3, 'workdays');
    
    // Step 8: Import patient info to IndexedDB (via patientStorage)
    debug.log('[importMasterDataset] Importing patient info...');
    if (data.patientInfo) {
      try {
        const { patientStorage } = await import('../utils/patientStorage.js');
        await patientStorage.save(data.patientInfo);
        stats.patientInfoImported = true;
        debug.log('[importMasterDataset] Patient info imported to IndexedDB');
      } catch (err) {
        errors.push(`Failed to import patient info: ${err.message}`);
        console.error('[importMasterDataset] Patient info import error:', err);
      }
    }
    reportProgress(4, 'patient info');
    
    // Step 9: Import stock batches
    debug.log('[importMasterDataset] Importing stock batches...');
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
      debug.log(`[importMasterDataset] Imported ${stats.stockBatchesImported} stock batches`);
    }
    reportProgress(5, 'stock batches');
    
    // Step 10: Import stock assignments
    debug.log('[importMasterDataset] Importing stock assignments...');
    if (data.stockAssignments && Array.isArray(data.stockAssignments)) {
      for (const assignment of data.stockAssignments) {
        try {
          await assignSensorToBatch(assignment.sensor_id, assignment.batch_id);
          stats.stockAssignmentsImported++;
        } catch (err) {
          errors.push(`Failed to import assignment for sensor ${assignment.sensor_id}: ${err.message}`);
          console.error('[importMasterDataset] Stock assignment import error:', err);
        }
      }
      debug.log(`[importMasterDataset] Imported ${stats.stockAssignmentsImported} stock assignments`);
    }
    reportProgress(6, 'stock assignments');
    
    // Step 11: Import pump settings
    debug.log('[importMasterDataset] Importing pump settings...');
    if (data.pumpSettings) {
      try {
        savePumpSettings(data.pumpSettings);
        stats.pumpSettingsImported = true;
        debug.log('[importMasterDataset] Pump settings imported');
      } catch (err) {
        errors.push(`Failed to import pump settings: ${err.message}`);
        console.error('[importMasterDataset] Pump settings import error:', err);
      }
    }
    
    // Step 12: Import device history
    debug.log('[importMasterDataset] Importing device history...');
    if (data.deviceHistory && Array.isArray(data.deviceHistory)) {
      try {
        importDeviceData({ deviceHistory: data.deviceHistory });
        stats.deviceHistoryImported = data.deviceHistory.length;
        debug.log(`[importMasterDataset] Imported ${data.deviceHistory.length} device history records`);
      } catch (err) {
        errors.push(`Failed to import device history: ${err.message}`);
        console.error('[importMasterDataset] Device history import error:', err);
      }
    }
    reportProgress(7, 'pump settings');
    
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
  const errors = [];
  const warnings = [];
  
  try {
    // Step 1: Parse JSON
    const text = await file.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch (parseError) {
      return {
        valid: false,
        errors: [`Invalid JSON: ${parseError.message}`]
      };
    }
    
    // Step 2: Check schema version
    if (!data.version) {
      errors.push('Missing schema version');
    } else if (data.version !== '3.8.0') {
      warnings.push(`Schema version ${data.version} differs from expected 3.8.0 - import may fail`);
    }
    
    // Step 3: Validate required fields
    if (!data.months || !Array.isArray(data.months)) {
      errors.push('Missing or invalid months array (required)');
    } else if (data.months.length === 0) {
      warnings.push('No months data in export');
    }
    
    // Step 4: Validate optional fields structure
    if (data.sensors !== undefined && !Array.isArray(data.sensors)) {
      errors.push('Invalid sensors field (must be array)');
    }
    
    if (data.cartridges !== undefined && !Array.isArray(data.cartridges)) {
      errors.push('Invalid cartridges field (must be array)');
    }
    
    if (data.workdays !== undefined && !Array.isArray(data.workdays)) {
      errors.push('Invalid workdays field (must be array)');
    }
    
    if (data.patientInfo !== undefined && typeof data.patientInfo !== 'object') {
      errors.push('Invalid patientInfo field (must be object)');
    }
    
    if (data.stockBatches !== undefined && !Array.isArray(data.stockBatches)) {
      errors.push('Invalid stockBatches field (must be array)');
    }
    
    if (data.stockAssignments !== undefined && !Array.isArray(data.stockAssignments)) {
      errors.push('Invalid stockAssignments field (must be array)');
    }
    
    if (data.pumpSettings !== undefined && typeof data.pumpSettings !== 'object') {
      errors.push('Invalid pumpSettings field (must be object)');
    }
    
    if (data.deviceHistory !== undefined && !Array.isArray(data.deviceHistory)) {
      errors.push('Invalid deviceHistory field (must be array)');
    }
    
    // Step 5: Count what will be imported
    const summary = {
      months: data.months?.length || 0,
      readings: data.months?.reduce((sum, m) => sum + (m.readings?.length || 0), 0) || 0,
      sensors: data.sensors?.length || 0,
      cartridges: data.cartridges?.length || 0,
      workdays: data.workdays?.length || 0,
      hasPatientInfo: !!data.patientInfo,
      stockBatches: data.stockBatches?.length || 0,
      stockAssignments: data.stockAssignments?.length || 0,
      hasPumpSettings: !!data.pumpSettings?.device?.serial,
      deviceHistory: data.deviceHistory?.length || 0
    };
    
    return {
      valid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined,
      warnings: warnings.length > 0 ? warnings : undefined,
      summary
    };
    
  } catch (error) {
    return {
      valid: false,
      errors: [`Validation failed: ${error.message}`]
    };
  }
}
