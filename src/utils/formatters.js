/**
 * Formatting Utilities for AGP+
 * 
 * Centralized formatting functions for dates, numbers, and durations.
 * Ensures consistent display formats throughout the application.
 * 
 * @version 3.9.0
 */

/**
 * Format a date in DD-MM-YYYY format
 * 
 * @param {Date|string|number} date - Date to format
 * @param {boolean} includeTime - If true, adds HH:MM
 * @returns {string} Formatted date string (e.g., "24-10-2025" or "24-10-2025 14:30")
 * 
 * @example
 * formatDate(new Date())                    // "24-10-2025"
 * formatDate("2025-10-24T14:30:00", true)  // "24-10-2025 14:30"
 */
export function formatDate(date, includeTime = false) {
  const d = new Date(date);
  
  // Handle invalid dates
  if (isNaN(d.getTime())) {
    return 'Invalid Date';
  }
  
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  
  if (!includeTime) {
    return `${day}-${month}-${year}`;
  }
  
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${day}-${month}-${year} ${hours}:${minutes}`;
}

/**
 * Format duration in human-readable form
 * 
 * @param {number} days - Duration in days (can be fractional)
 * @param {boolean} detailed - If true, shows "6d 19h" format, otherwise "6.8 days"
 * @returns {string} Formatted duration
 * 
 * @example
 * formatDuration(6.8)           // "6.8 dagen"
 * formatDuration(6.8, true)     // "6d 19h"
 */
export function formatDuration(days, detailed = false) {
  if (days === null || days === undefined || isNaN(days)) {
    return 'N/A';
  }
  
  if (!detailed) {
    return `${days.toFixed(1)} dagen`;
  }
  
  const wholeDays = Math.floor(days);
  const hours = Math.round((days - wholeDays) * 24);
  return `${wholeDays}d ${hours}h`;
}

/**
 * Format a number with specified decimal places
 * 
 * @param {number} value - Number to format
 * @param {number} decimals - Number of decimal places (default: 1)
 * @returns {string} Formatted number
 * 
 * @example
 * formatNumber(123.456, 2)  // "123.46"
 * formatNumber(123.456, 0)  // "123"
 */
export function formatNumber(value, decimals = 1) {
  if (value === null || value === undefined || isNaN(value)) {
    return 'N/A';
  }
  return value.toFixed(decimals);
}

/**
 * Format percentage value
 * 
 * @param {number} value - Decimal value (0-1) or percentage (0-100)
 * @param {boolean} isDecimal - If true, value is 0-1, otherwise 0-100
 * @returns {string} Formatted percentage (e.g., "73.2%")
 * 
 * @example
 * formatPercentage(0.732, true)   // "73.2%"
 * formatPercentage(73.2, false)   // "73.2%"
 */
export function formatPercentage(value, isDecimal = false) {
  if (value === null || value === undefined || isNaN(value)) {
    return 'N/A';
  }
  
  const percentage = isDecimal ? value * 100 : value;
  return `${percentage.toFixed(1)}%`;
}

/**
 * Format glucose value with unit
 * 
 * @param {number} value - Glucose value in mg/dL
 * @param {boolean} includeUnit - If true, appends " mg/dL"
 * @returns {string} Formatted glucose value
 * 
 * @example
 * formatGlucose(120)        // "120"
 * formatGlucose(120, true)  // "120 mg/dL"
 */
export function formatGlucose(value, includeUnit = false) {
  if (value === null || value === undefined || isNaN(value)) {
    return 'N/A';
  }
  
  const formatted = Math.round(value);
  return includeUnit ? `${formatted} mg/dL` : String(formatted);
}

/**
 * Format time of day (HH:MM)
 * 
 * @param {number} minuteOfDay - Minute of day (0-1439)
 * @returns {string} Formatted time (e.g., "14:30")
 * 
 * @example
 * formatTimeOfDay(870)  // "14:30" (870 minutes = 14h 30m)
 */
export function formatTimeOfDay(minuteOfDay) {
  if (minuteOfDay === null || minuteOfDay === undefined || isNaN(minuteOfDay)) {
    return 'N/A';
  }
  
  const hours = Math.floor(minuteOfDay / 60);
  const minutes = minuteOfDay % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

/**
 * Format file size in human-readable form
 * 
 * @param {number} bytes - File size in bytes
 * @returns {string} Formatted size (e.g., "1.2 MB")
 */
export function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
}

/**
 * Format timestamp for export filenames
 * 
 * @param {Date} date - Date object (defaults to now)
 * @returns {string} Formatted timestamp (e.g., "20251024-1430")
 * 
 * @example
 * formatTimestampForFilename()  // "20251024-1430"
 */
export function formatTimestampForFilename(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  
  return `${year}${month}${day}-${hours}${minutes}`;
}
