import React from 'react';

// Panel Components
import ImportPanel from './panels/ImportPanel';
import ExportPanel from './panels/ExportPanel';
import SensorHistoryPanel from './panels/SensorHistoryPanel';
import DayProfilesPanel from './panels/DayProfilesPanel';
import PumpSettingsPanel from './panels/PumpSettingsPanel';

/**
 * PanelRouter - Routes between main application panels
 * 
 * Extracted from AGPGenerator.jsx to reduce component size.
 * Part of Phase 3 (Code Health) refactoring.
 */
function PanelRouter({
  activePanel,
  onNavigateToImport,
  onOpenStockModal,
  onOpenSensorRegistration,
  // Import Panel props
  onCSVLoad,
  onProTimeLoad,
  onProTimeDelete,
  onImportDatabase,
  // Day Profiles Panel props
  dayProfiles,
  patientInfo,
  numDays,
  onNumDaysChange,
  // Export Panel props
  onExportHTML,
  onExportDayProfiles,
  onExportDatabase,
}) {
  return (
    <div className="main-content" style={{ padding: '1rem 2rem' }}>
      
      {activePanel === 'import' && (
        <ImportPanel
          onCSVLoad={onCSVLoad}
          onProTimeLoad={onProTimeLoad}
          onProTimeDelete={onProTimeDelete}
          onImportDatabase={onImportDatabase}
          onSensorRegistrationOpen={onOpenSensorRegistration}
        />
      )}
      
      {activePanel === 'dagprofielen' && (
        <DayProfilesPanel
          isOpen={true}
          onClose={onNavigateToImport}
          dayProfiles={dayProfiles}
          patientInfo={patientInfo}
          numDays={numDays}
          onNumDaysChange={onNumDaysChange}
        />
      )}
      
      {activePanel === 'sensoren' && (
        <SensorHistoryPanel 
          isOpen={true}
          onClose={onNavigateToImport}
          onOpenStock={onOpenStockModal}
        />
      )}
      
      {activePanel === 'export' && (
        <ExportPanel
          onExportHTML={onExportHTML}
          onExportDayProfiles={onExportDayProfiles}
          onExportDatabase={onExportDatabase}
          onImportDatabase={onImportDatabase}
          dayProfiles={dayProfiles}
          patientInfo={patientInfo}
        />
      )}
      
      {activePanel === 'settings' && (
        <PumpSettingsPanel />
      )}
    </div>
  );
}

export default PanelRouter;
