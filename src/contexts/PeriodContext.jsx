import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';

const PeriodContext = createContext(null);

export function PeriodProvider({ children, masterDataset }) {
  // ============================================
  // STATE: Period Selection
  // ============================================
  
  // Core period state
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  
  // ============================================
  // COMPUTED: Safe Date Range
  // ============================================
  
  const safeDateRange = useMemo(() => {
    if (!masterDataset || !Array.isArray(masterDataset) || masterDataset.length === 0) {
      return { min: null, max: null };
    }
    
    const dates = masterDataset
      .map(r => new Date(r.time))
      .filter(d => !isNaN(d.getTime()));
    
    if (dates.length === 0) {
      return { min: null, max: null };
    }
    
    return {
      min: new Date(Math.min(...dates)),
      max: new Date(Math.max(...dates))
    };
  }, [masterDataset]);
  
  // ============================================
  // EFFECTS: Auto-set Initial Period
  // ============================================
  
  // Initialize period when data loads (last 14 days)
  useEffect(() => {
    if (safeDateRange.max && !startDate && !endDate) {
      const maxDate = safeDateRange.max;
      const twoWeeksAgo = new Date(maxDate);
      twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 13);
      
      setStartDate(twoWeeksAgo);
      setEndDate(maxDate);
    }
  }, [safeDateRange.max, startDate, endDate]);
  
  // ============================================
  // HANDLERS: Period Manipulation
  // ============================================
  
  const updateDateRange = useCallback((newStartDate, newEndDate) => {
    setStartDate(newStartDate);
    setEndDate(newEndDate);
  }, []);
  
  const resetPeriod = useCallback(() => {
    if (safeDateRange.max) {
      const maxDate = safeDateRange.max;
      const twoWeeksAgo = new Date(maxDate);
      twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 13);
      
      setStartDate(twoWeeksAgo);
      setEndDate(maxDate);
    }
  }, [safeDateRange.max]);
  
  // ============================================
  // COMPUTED: Period Info
  // ============================================
  
  const periodInfo = useMemo(() => {
    if (!startDate || !endDate) {
      return {
        isCustomRange: false,
        days: 0,
        description: 'No period selected'
      };
    }
    
    const days = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;
    
    // Check if this is a standard 14-day period ending at max date
    const isStandard14Days = 
      days === 14 && 
      safeDateRange.max &&
      Math.abs(endDate - safeDateRange.max) < 24 * 60 * 60 * 1000;
    
    return {
      isCustomRange: !isStandard14Days,
      days,
      description: `${days} days (${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()})`
    };
  }, [startDate, endDate, safeDateRange.max]);
  
  // ============================================
  // CONTEXT VALUE
  // ============================================
  
  const value = useMemo(() => ({
    // State
    startDate,
    endDate,
    safeDateRange,
    
    // Setters
    setStartDate,
    setEndDate,
    updateDateRange,
    resetPeriod,
    
    // Computed
    periodInfo
  }), [
    startDate,
    endDate,
    safeDateRange,
    updateDateRange,
    resetPeriod,
    periodInfo
  ]);
  
  return (
    <PeriodContext.Provider value={value}>
      {children}
    </PeriodContext.Provider>
  );
}

export function usePeriod() {
  const context = useContext(PeriodContext);
  if (!context) {
    throw new Error('usePeriod must be used within a PeriodProvider');
  }
  return context;
}
