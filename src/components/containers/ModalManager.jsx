/**
 * ModalManager.jsx
 * 
 * Centralized modal rendering component.
 * Handles all 6 modals in AGP+ application via React portals.
 * (DayProfiles now uses DayProfilesPanel instead of modal)
 * 
 * EXTRACTED FROM: AGPGenerator.jsx (Phase 1 of god component split)
 * REASON: Isolate modal render logic for better organization
 * 
 * NOTE: State management remains in AGPGenerator for simplicity.
 * This component is purely presentational - it renders modals based on props.
 * 
 * @version 1.1.0
 * @created 2025-11-02
 * @updated 2025-11-16 - Removed DayProfilesModal (migrated to panel architecture)
 */

import React from 'react';
import ReactDOM from 'react-dom';

// Modal Components
import PatientInfo from '../PatientInfo';
import SensorHistoryPanel from '../panels/SensorHistoryPanel';
import SensorRegistration from '../SensorRegistration';
import DataManagementModal from '../DataManagementModal';
import StockPanel from '../panels/StockPanel';
import BatchAssignmentDialog from '../BatchAssignmentDialog';

/**
 * ModalManager Component
 * 
 * Renders all application modals using React portals.
 * State management is handled by parent (AGPGenerator).
 * 
 * @param {Object} props
 * @param {Object} props.patientInfo - Patient metadata
 * @param {Array} props.dayProfiles - Day profile data
 * @param {Object} props.dataStatus - Current data statistics
 * 
 * Modal States (controlled by parent):
 * @param {boolean} props.patientInfoOpen
 * @param {Function} props.onClosePatientInfo
 * @param {boolean} props.sensorHistoryOpen
 * @param {Function} props.onCloseSensorHistory
 * @param {boolean} props.sensorRegistrationOpen
 * @param {Function} props.onCloseSensorRegistration
 * @param {boolean} props.dataManagementOpen
 * @param {Function} props.onCloseDataManagement
 * @param {Function} props.onDataManagementDelete
 * @param {boolean} props.showStockModal
 * @param {Function} props.onCloseStockModal
 * @param {Object} props.batchAssignmentDialog - { open: boolean, suggestions: [] }
 * @param {Function} props.onBatchAssignmentConfirm
 * @param {Function} props.onBatchAssignmentCancel
 */
export default function ModalManager({
  // Data props
  patientInfo,
  dayProfiles,
  dataStatus,
  
  // Patient Info Modal
  patientInfoOpen,
  onClosePatientInfo,
  
  // Sensor History Modal
  sensorHistoryOpen,
  onCloseSensorHistory,
  onOpenStockFromHistory, // NEW: Callback to open stock from sensor history
  
  // Sensor Registration Modal
  sensorRegistrationOpen,
  onCloseSensorRegistration,
  
  // Data Management Modal
  dataManagementOpen,
  onCloseDataManagement,
  onDataManagementDelete,
  
  // Stock Management Modal
  showStockModal,
  onCloseStockModal,
  
  // Batch Assignment Dialog
  batchAssignmentDialog,
  onBatchAssignmentConfirm,
  onBatchAssignmentCancel
}) {
  
  return (
    <>
      {/* Patient Info Modal */}
      {patientInfoOpen && ReactDOM.createPortal(
        <PatientInfo 
          isModal={true}
          onClose={onClosePatientInfo} 
        />,
        document.body
      )}

      {/* Sensor History Modal */}
      {sensorHistoryOpen && ReactDOM.createPortal(
        <SensorHistoryPanel 
          isOpen={sensorHistoryOpen}
          onClose={onCloseSensorHistory}
          onOpenStock={onOpenStockFromHistory}
        />,
        document.body
      )}

      {/* Sensor Registration Modal */}
      {sensorRegistrationOpen && ReactDOM.createPortal(
        <SensorRegistration 
          isOpen={sensorRegistrationOpen}
          onClose={onCloseSensorRegistration}
        />,
        document.body
      )}

      {/* Data Management Modal */}
      {dataManagementOpen && ReactDOM.createPortal(
        <DataManagementModal 
          onClose={onCloseDataManagement}
          onDelete={onDataManagementDelete}
          currentDataStats={dataStatus}
        />,
        document.body
      )}

      {/* Stock Management Modal */}
      {showStockModal && ReactDOM.createPortal(
        <StockPanel
          isOpen={showStockModal}
          onClose={onCloseStockModal}
        />,
        document.body
      )}

      {/* Batch Assignment Dialog */}
      {batchAssignmentDialog?.open && ReactDOM.createPortal(
        <BatchAssignmentDialog
          suggestions={batchAssignmentDialog.suggestions}
          onConfirm={onBatchAssignmentConfirm}
          onCancel={onBatchAssignmentCancel}
        />,
        document.body
      )}
    </>
  );
}
