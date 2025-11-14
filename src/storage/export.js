/**
 * DATABASE EXPORT UTILITIES
 * Export complete IndexedDB dataset as JSON
 * V3.8.0 - Database Export Phase
 */

import { getAllMonthBuckets } from './masterDatasetStorage';
import { getAllSensors } from './sensorStorage';
import { getCartridgeHistory } from './eventStorage';
import { getAllBatches, getAllAssignments } from './stockStorage';
import { APP_VERSION, APP_FULL_NAME } from '../utils/version';

/**
 * Export complete master dataset to JSON
 * @returns {Promise<Object>} Export data object
 */
export async function exportMasterDataset() {
  
  try {
    // Fetch all data from IndexedDB
    const months = await getAllMonthBuckets();
    const sensors = await getAllSensors(); // FIXED: getAllSensors is now async!
    const cartridges = await getCartridgeHistory();
    
    // Fetch ProTime workday data from V3 storage (IndexedDB)
    let workdays = [];
    try {
      const { loadProTimeData } = await import('./masterDatasetStorage');
      const workdaySet = await loadProTimeData();
      workdays = workdaySet ? Array.from(workdaySet) : [];
    } catch (err) {
      console.warn('[export] Failed to load ProTime from IndexedDB, trying localStorage fallback:', err);
      // Fallback to localStorage for V2 compatibility
      const workdaysRaw = localStorage.getItem('workday-dates');
      workdays = workdaysRaw ? JSON.parse(workdaysRaw) : [];
    }
    
    // Fetch patient info from localStorage
    const patientInfoRaw = localStorage.getItem('patient-info');
    const patientInfo = patientInfoRaw ? JSON.parse(patientInfoRaw) : null;
    
    // Fetch stock batches and assignments
    const stockBatches = getAllBatches();
    const stockAssignments = getAllAssignments();
    
    // Calculate total readings
    const totalReadings = months.reduce((sum, month) => {
      return sum + (month.readings?.length || 0);
    }, 0);
    
    // Build export object
    const exportData = {
      version: APP_VERSION,
      exportDate: new Date().toISOString(),
      generator: APP_FULL_NAME,
      totalReadings,
      totalMonths: months.length,
      totalSensors: sensors.length,
      totalCartridges: cartridges.length,
      totalWorkdays: workdays.length,
      totalStockBatches: stockBatches.length,
      totalStockAssignments: stockAssignments.length,
      hasPatientInfo: !!patientInfo,
      months,
      sensors,
      cartridges,
      workdays,
      patientInfo,
      stockBatches,
      stockAssignments
    };
    
    
    return exportData;
    
  } catch (error) {
    console.error('[exportMasterDataset] Export failed:', error);
    throw error;
  }
}

/**
 * Download JSON data as file
 * @param {Object} data - Data to export
 * @param {string} filename - Target filename
 */
export function downloadJSON(data, filename) {
  const jsonStr = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  
}

/**
 * Generate filename with timestamp
 * @returns {string} Filename like "agp-master-1730000000000.json"
 */
export function generateExportFilename() {
  const timestamp = Date.now();
  return `agp-master-${timestamp}.json`;
}

/**
 * Complete export flow: fetch data + download
 */
export async function exportAndDownload() {
  try {
    const data = await exportMasterDataset();
    const filename = generateExportFilename();
    downloadJSON(data, filename);
    return { success: true, filename, recordCount: data.totalReadings };
  } catch (error) {
    console.error('[exportAndDownload] Failed:', error);
    return { success: false, error: error.message };
  }
}
