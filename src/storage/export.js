/**
 * DATABASE EXPORT UTILITIES
 * Export complete IndexedDB dataset as JSON
 * V3.8.0 - Database Export Phase
 * V4.3.0 - Added export history tracking
 */

import { getAllMonthBuckets } from './masterDatasetStorage';
import { getAllSensors } from './sensorStorage';
import { getCartridgeHistory } from './cartridgeStorage';
import { getAllBatches, getAllAssignments } from './stockStorage';
import { getPumpSettings, getDeviceHistory } from './pumpSettingsStorage';
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
    
    // Fetch pump settings and device history
    const pumpSettings = getPumpSettings();
    const deviceHistory = getDeviceHistory();
    
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
      totalDeviceHistory: deviceHistory.length,
      hasPatientInfo: !!patientInfo,
      hasPumpSettings: !!pumpSettings?.device?.serial,
      months,
      sensors,
      cartridges,
      workdays,
      patientInfo,
      stockBatches,
      stockAssignments,
      pumpSettings,
      deviceHistory
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
 * Generate filename with readable timestamp
 * @returns {string} Filename like "agp-master-2025-11-16_10-30-15.json"
 */
export function generateExportFilename() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  
  const timestamp = `${year}-${month}-${day}_${hours}-${minutes}-${seconds}`;
  return `agp-master-${timestamp}.json`;
}

/**
 * Complete export flow: fetch data + download
 */
export async function exportAndDownload() {
  try {
    const data = await exportMasterDataset();
    const filename = generateExportFilename();
    
    // Calculate file size
    const jsonStr = JSON.stringify(data, null, 2);
    const fileSize = new Blob([jsonStr]).size;
    
    downloadJSON(data, filename);
    
    // Track export in history
    const { addExportEvent } = await import('./exportHistory');
    addExportEvent({
      filename,
      type: 'database-json',
      recordCount: data.totalReadings,
      fileSize,
      stats: {
        months: data.months?.length || 0,
        sensors: data.sensors?.length || 0,
        workdays: data.workdays?.length || 0,
        stockBatches: data.stockBatches?.length || 0
      }
    });
    
    return { success: true, filename, recordCount: data.totalReadings, fileSize };
  } catch (error) {
    console.error('[exportAndDownload] Failed:', error);
    return { success: false, error: error.message };
  }
}
