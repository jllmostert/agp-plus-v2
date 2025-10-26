/**
 * USE DATA CLEANUP HOOK
 * 
 * React hook for managing data cleanup operations.
 * Provides state and functions for the cleanup modal UI.
 * 
 * Features:
 * - Preview affected data before deletion
 * - Execute cleanup with progress tracking
 * - Handle errors gracefully
 * - Trigger dataset refresh after cleanup
 * 
 * @module useDataCleanup
 * @version 3.8.5
 */

import { useState, useCallback } from 'react';
import { 
  calculateAffectedData, 
  executeCleanup,
  calculateLastNDays
} from '../core/cleanup-engine.js';

/**
 * Period options for cleanup dropdown
 */
export const CLEANUP_PERIODS = {
  LAST_14_DAYS: { label: 'Laatste 14 dagen', value: '14d', days: 14 },
  LAST_30_DAYS: { label: 'Laatste 30 dagen', value: '30d', days: 30 },
  CUSTOM: { label: 'Custom bereik...', value: 'custom', days: null }
};

export function useDataCleanup() {
  // Modal state
  const [isOpen, setIsOpen] = useState(false);
  
  // User selections
  const [period, setPeriod] = useState('14d');
  const [customStartDate, setCustomStartDate] = useState(null);
  const [customEndDate, setCustomEndDate] = useState(null);
  const [includeCartridges, setIncludeCartridges] = useState(true);
  
  // Preview state
  const [preview, setPreview] = useState(null);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  
  // Execution state
  const [isExecuting, setIsExecuting] = useState(false);
  const [summary, setSummary] = useState(null);
  const [error, setError] = useState(null);

  /**
   * Get date range based on current period selection
   */
  const getDateRange = useCallback(() => {
    if (period === 'custom') {
      if (!customStartDate || !customEndDate) {
        throw new Error('Custom date range requires both start and end dates');
      }
      return { startDate: customStartDate, endDate: customEndDate };
    }
    
    const periodConfig = Object.values(CLEANUP_PERIODS).find(p => p.value === period);
    if (!periodConfig || !periodConfig.days) {
      throw new Error('Invalid period selection');
    }
    
    return calculateLastNDays(periodConfig.days);
  }, [period, customStartDate, customEndDate]);

  /**
   * Load preview of affected data
   */
  const loadPreview = useCallback(async () => {
    setIsLoadingPreview(true);
    setError(null);
    
    try {
      const { startDate, endDate } = getDateRange();
      const affectedData = await calculateAffectedData(startDate, endDate);
      setPreview(affectedData);
    } catch (err) {
      setError(err.message);
      setPreview(null);
    } finally {
      setIsLoadingPreview(false);
    }
  }, [getDateRange]);

  /**
   * Execute cleanup operation
   */
  const performCleanup = useCallback(async (onComplete) => {
    setIsExecuting(true);
    setError(null);
    setSummary(null);
    
    try {
      const { startDate, endDate } = getDateRange();
      
      const result = await executeCleanup(startDate, endDate, {
        includeCartridges
      });
      
      setSummary(result);
      
      if (result.success) {
        // Trigger dataset refresh (passed from parent component)
        if (onComplete) {
          await onComplete();
        }
      }
      
      return result;
    } catch (err) {
      setError(err.message);
      return { success: false, errors: [err.message] };
    } finally {
      setIsExecuting(false);
    }
  }, [getDateRange, includeCartridges]);

  /**
   * Open modal and load preview
   */
  const openModal = useCallback(async () => {
    setIsOpen(true);
    await loadPreview();
  }, [loadPreview]);

  /**
   * Close modal and reset state
   */
  const closeModal = useCallback(() => {
    setIsOpen(false);
    setPeriod('14d');
    setCustomStartDate(null);
    setCustomEndDate(null);
    setIncludeCartridges(true);
    setPreview(null);
    setSummary(null);
    setError(null);
  }, []);

  /**
   * Update period selection and reload preview
   */
  const updatePeriod = useCallback(async (newPeriod) => {
    setPeriod(newPeriod);
    
    // Auto-reload preview if not custom (custom needs dates first)
    if (newPeriod !== 'custom') {
      await loadPreview();
    }
  }, [loadPreview]);

  /**
   * Update custom date range and reload preview
   */
  const updateCustomDates = useCallback(async (startDate, endDate) => {
    setCustomStartDate(startDate);
    setCustomEndDate(endDate);
    
    // Only load preview if both dates are set
    if (startDate && endDate) {
      await loadPreview();
    }
  }, [loadPreview]);

  return {
    // State
    isOpen,
    period,
    customStartDate,
    customEndDate,
    includeCartridges,
    preview,
    isLoadingPreview,
    isExecuting,
    summary,
    error,
    
    // Actions
    openModal,
    closeModal,
    updatePeriod,
    updateCustomDates,
    setIncludeCartridges,
    performCleanup,
    loadPreview
  };
}
