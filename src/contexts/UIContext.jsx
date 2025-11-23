import React, { createContext, useContext, useState, useMemo, useCallback, useEffect } from 'react';

/**
 * UIContext - UI state management for AGP+
 * 
 * Manages all UI-related state:
 * - Patient metadata & workdays
 * - Feature toggles (day/night split, profile days)
 * - Notifications (toasts, dialogs)
 * - Upload workflow (two-phase upload)
 * 
 * Phase 4 of Track 3 Context API Refactoring
 * Extracted from AGPGenerator to complete state-free component pattern
 * 
 * @example
 * const { patientInfo, setPatientInfo, showToast } = useUI();
 */
const UIContext = createContext(null);

export function UIProvider({ children }) {
  // ============================================
  // STATE: Patient & Features (2)
  // ============================================
  
  const [patientInfo, setPatientInfo] = useState(null); // Patient metadata
  const [workdays, setWorkdays] = useState(null); // Workday data for visualization
  
  // ============================================
  // STATE: UI Toggles (2)
  // ============================================
  
  const [dayNightEnabled, setDayNightEnabled] = useState(false); // Day/night split toggle
  const [numDaysProfile, setNumDaysProfile] = useState(7); // 7 or 14 days for day profiles
  
  // ============================================
  // STATE: Notifications & Dialogs (3)
  // ============================================
  
  const [loadToast, setLoadToast] = useState(null); // Toast notification message
  const [batchAssignmentDialog, setBatchAssignmentDialog] = useState({ 
    open: false, 
    suggestions: [] 
  }); // Batch sensor assignment dialog
  const [pendingUpload, setPendingUpload] = useState(null); // Two-phase upload workflow
  
  // ============================================
  // EFFECTS: Load Patient Info
  // ============================================
  
  // Load patient info from storage on mount
  useEffect(() => {
    const loadPatientInfo = async () => {
      try {
        const { patientStorage } = await import('../utils/patientStorage');
        const info = await patientStorage.get();
        setPatientInfo(info);
      } catch (err) {
        console.error('[UIContext] Failed to load patient info:', err);
      }
    };
    loadPatientInfo();
  }, []);
  
  // ============================================
  // METHODS: Patient Info
  // ============================================
  
  const updatePatientInfo = useCallback(async (info) => {
    setPatientInfo(info);
    
    // Save to storage
    try {
      const { patientStorage } = await import('../utils/patientStorage');
      await patientStorage.save(info);
    } catch (err) {
      console.error('[UIContext] Failed to save patient info:', err);
    }
  }, []);
  
  const clearPatientInfo = useCallback(async () => {
    setPatientInfo(null);
    
    // Clear from storage
    try {
      const { patientStorage } = await import('../utils/patientStorage');
      await patientStorage.clear();
    } catch (err) {
      console.error('[UIContext] Failed to clear patient info:', err);
    }
  }, []);
  
  // ============================================
  // METHODS: Workdays
  // ============================================
  
  const loadWorkdays = useCallback((data) => {
    setWorkdays(data);
  }, []);
  
  const clearWorkdays = useCallback(() => {
    setWorkdays(null);
  }, []);
  
  // ============================================
  // METHODS: UI Toggles
  // ============================================
  
  const toggleDayNight = useCallback(() => {
    setDayNightEnabled(prev => !prev);
  }, []);
  
  const setDayProfileCount = useCallback((count) => {
    if (count === 7 || count === 14) {
      setNumDaysProfile(count);
    } else {
      console.warn(`[UIContext] Invalid day profile count: ${count}. Must be 7 or 14.`);
    }
  }, []);
  
  // ============================================
  // METHODS: Toast Notifications
  // ============================================
  
  const showToast = useCallback((message, duration = 3000) => {
    setLoadToast(message);
    if (duration > 0) {
      setTimeout(() => setLoadToast(null), duration);
    }
  }, []);
  
  const hideToast = useCallback(() => {
    setLoadToast(null);
  }, []);
  
  // ============================================
  // METHODS: Batch Assignment Dialog
  // ============================================
  
  const openBatchDialog = useCallback((suggestions = []) => {
    setBatchAssignmentDialog({ open: true, suggestions });
  }, []);
  
  const closeBatchDialog = useCallback(() => {
    setBatchAssignmentDialog({ open: false, suggestions: [] });
  }, []);
  
  // ============================================
  // METHODS: Pending Upload Workflow
  // ============================================
  
  const setPending = useCallback((upload) => {
    setPendingUpload(upload);
  }, []);
  
  const clearPending = useCallback(() => {
    setPendingUpload(null);
  }, []);
  
  // ============================================
  // COMPUTED: Helper Flags
  // ============================================
  
  const hasPatientInfo = useMemo(() => !!patientInfo, [patientInfo]);
  const hasWorkdays = useMemo(() => !!workdays, [workdays]);
  const hasPendingUpload = useMemo(() => !!pendingUpload, [pendingUpload]);
  
  // ============================================
  // CONTEXT VALUE
  // ============================================
  
  const value = useMemo(() => ({
    // State
    patientInfo,
    workdays,
    dayNightEnabled,
    numDaysProfile,
    loadToast,
    batchAssignmentDialog,
    pendingUpload,
    
    // Computed flags
    hasPatientInfo,
    hasWorkdays,
    hasPendingUpload,
    
    // Patient methods
    setPatientInfo: updatePatientInfo,
    clearPatientInfo,
    
    // Workdays methods
    loadWorkdays,
    clearWorkdays,
    
    // UI toggle methods
    setDayNightEnabled,
    toggleDayNight,
    setNumDaysProfile: setDayProfileCount,
    
    // Toast methods
    setLoadToast,
    showToast,
    hideToast,
    
    // Dialog methods
    setBatchAssignmentDialog,
    openBatchDialog,
    closeBatchDialog,
    
    // Upload workflow methods
    setPendingUpload: setPending,
    clearPending,
  }), [
    patientInfo,
    workdays,
    dayNightEnabled,
    numDaysProfile,
    loadToast,
    batchAssignmentDialog,
    pendingUpload,
    hasPatientInfo,
    hasWorkdays,
    hasPendingUpload,
    updatePatientInfo,
    clearPatientInfo,
    loadWorkdays,
    clearWorkdays,
    toggleDayNight,
    setDayProfileCount,
    showToast,
    hideToast,
    openBatchDialog,
    closeBatchDialog,
    setPending,
    clearPending,
  ]);
  
  return (
    <UIContext.Provider value={value}>
      {children}
    </UIContext.Provider>
  );
}

/**
 * Hook to consume UIContext
 * @returns {object} UI context value
 * @throws {Error} If used outside UIProvider
 */
export function useUI() {
  const context = useContext(UIContext);
  if (!context) {
    throw new Error('useUI must be used within UIProvider');
  }
  return context;
}
