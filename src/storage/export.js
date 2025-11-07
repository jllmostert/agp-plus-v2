/**
 * DATABASE EXPORT UTILITIES
 * Export complete IndexedDB dataset as JSON
 * V3.8.0 - Database Export Phase
 */

import { getAllMonthBuckets } from './masterDatasetStorage';
import { getSensorHistory } from './sensorStorage';
import { getCartridgeHistory } from './eventStorage';

/**
 * Export complete master dataset to JSON
 * @returns {Promise<Object>} Export data object
 */
export async function exportMasterDataset() {
  
  try {
    // Fetch all data from IndexedDB
    const months = await getAllMonthBuckets();
    const sensors = await getSensorHistory();
    const cartridges = await getCartridgeHistory();
    
    // Fetch ProTime workday data from localStorage
    const workdaysRaw = localStorage.getItem('workday-dates');
    const workdays = workdaysRaw ? JSON.parse(workdaysRaw) : [];
    
    // Calculate total readings
    const totalReadings = months.reduce((sum, month) => {
      return sum + (month.readings?.length || 0);
    }, 0);
    
    // Build export object
    const exportData = {
      version: "3.8.0",
      exportDate: new Date().toISOString(),
      generator: "AGP+ v3.8.0",
      totalReadings,
      totalMonths: months.length,
      totalSensors: sensors.length,
      totalCartridges: cartridges.length,
      totalWorkdays: workdays.length,
      months,
      sensors,
      cartridges,
      workdays
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
