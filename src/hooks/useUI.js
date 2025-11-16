import { useUI as useUIContext } from '../contexts/UIContext';

/**
 * useUI - Custom hook to consume UIContext
 * 
 * Provides access to all UI state and methods:
 * - Patient info & workdays
 * - UI toggles (day/night, profile days)
 * - Notifications (toasts, dialogs)
 * - Upload workflow
 * 
 * @returns {object} UI context value
 * @throws {Error} If used outside UIProvider
 * 
 * @example
 * const { patientInfo, showToast, toggleDayNight } = useUI();
 */
export default function useUI() {
  return useUIContext();
}
