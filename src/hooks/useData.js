import { useData as useDataContext } from '../contexts/DataContext';

/**
 * Hook to consume DataContext
 * 
 * Provides access to all data management state:
 * - Master dataset (V3)
 * - Data status
 * - Upload storage
 * - CSV data (V2 legacy)
 * - TDD statistics
 * - Error handling
 * 
 * @returns {object} Data context value
 * @example
 * const { masterDataset, dataStatus, uploadStorage } = useData();
 */
export function useData() {
  return useDataContext();
}

/**
 * Hook to get only data status
 * Optimized to prevent unnecessary re-renders
 * 
 * @returns {object} Data status object
 * @example
 * const { lightColor, message, dateRange } = useDataStatus();
 */
export function useDataStatus() {
  const { dataStatus } = useData();
  return dataStatus;
}

/**
 * Hook to get only active readings
 * 
 * @returns {Array} Active glucose readings
 * @example
 * const readings = useActiveReadings();
 */
export function useActiveReadings() {
  const { activeReadings } = useData();
  return activeReadings;
}

/**
 * Hook to get only upload storage
 * 
 * @returns {object} Upload storage management
 * @example
 * const { savedUploads, activeUploadId, saveUpload } = useUploads();
 */
export function useUploads() {
  const { uploadStorage } = useData();
  return uploadStorage;
}

/**
 * Hook to get comparison readings (full dataset, unfiltered)
 * 
 * @returns {Array} Comparison glucose readings
 * @example
 * const comparisonReadings = useComparisonReadings();
 */
export function useComparisonReadings() {
  const { comparisonReadings } = useData();
  return comparisonReadings;
}

/**
 * Hook to get TDD statistics
 * 
 * @returns {object|null} TDD by day data
 * @example
 * const tddByDay = useTDDStats();
 */
export function useTDDStats() {
  const { tddByDay } = useData();
  return tddByDay;
}
