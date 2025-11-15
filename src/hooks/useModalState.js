import { useState } from 'react';

/**
 * Centralized modal state management
 * Manages all modal open/close states in one place
 * 
 * Extracted from AGPGenerator.jsx to reduce component size
 * Part of Phase 1 refactoring (Quick Wins)
 */
export function useModalState() {
  // Individual modal states
  const [patientInfoOpen, setPatientInfoOpen] = useState(false);
  const [dayProfilesOpen, setDayProfilesOpen] = useState(false);
  const [sensorHistoryOpen, setSensorHistoryOpen] = useState(false);
  const [sensorRegistrationOpen, setSensorRegistrationOpen] = useState(false);
  const [dataManagementOpen, setDataManagementOpen] = useState(false);
  const [showStockModal, setShowStockModal] = useState(false);
  const [dataImportModalOpen, setDataImportModalOpen] = useState(false);

  // Helper: Open any modal by name
  const openModal = (name) => {
    const setters = {
      patientInfo: setPatientInfoOpen,
      dayProfiles: setDayProfilesOpen,
      sensorHistory: setSensorHistoryOpen,
      sensorRegistration: setSensorRegistrationOpen,
      dataManagement: setDataManagementOpen,
      stock: setShowStockModal,
      dataImport: setDataImportModalOpen
    };
    setters[name]?.(true);
  };

  // Helper: Close any modal by name
  const closeModal = (name) => {
    const setters = {
      patientInfo: setPatientInfoOpen,
      dayProfiles: setDayProfilesOpen,
      sensorHistory: setSensorHistoryOpen,
      sensorRegistration: setSensorRegistrationOpen,
      dataManagement: setDataManagementOpen,
      stock: setShowStockModal,
      dataImport: setDataImportModalOpen
    };
    setters[name]?.(false);
  };

  // Helper: Close all modals at once
  const closeAll = () => {
    setPatientInfoOpen(false);
    setDayProfilesOpen(false);
    setSensorHistoryOpen(false);
    setSensorRegistrationOpen(false);
    setDataManagementOpen(false);
    setShowStockModal(false);
    setDataImportModalOpen(false);
  };

  return {
    // Individual states (read access)
    patientInfoOpen,
    dayProfilesOpen,
    sensorHistoryOpen,
    sensorRegistrationOpen,
    dataManagementOpen,
    showStockModal,
    dataImportModalOpen,
    
    // Individual setters (for direct control if needed)
    setPatientInfoOpen,
    setDayProfilesOpen,
    setSensorHistoryOpen,
    setSensorRegistrationOpen,
    setDataManagementOpen,
    setShowStockModal,
    setDataImportModalOpen,
    
    // Helper methods (recommended API)
    openModal,
    closeModal,
    closeAll
  };
}
