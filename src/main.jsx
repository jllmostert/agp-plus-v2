import React, { useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import AGPGenerator from './components/AGPGenerator.jsx';
// import { MigrationBanner } from './components/MigrationBanner.jsx'; // Disabled: v3.0 migration not ready yet
import './styles/globals.css';
import { APP_VERSION, APP_FULL_NAME } from './utils/version.js';
import { DataProvider } from './contexts/DataContext.jsx';
import { PeriodProvider } from './contexts/PeriodContext.jsx';
import { MetricsProvider } from './contexts/MetricsContext.jsx';
import { UIProvider } from './contexts/UIContext.jsx';

// Update document title and meta tags with current version
function updateDocumentMeta() {
  // Update page title
  document.title = `${APP_FULL_NAME} - Ambulatory Glucose Profile Generator`;
  
  // Update meta description
  const metaDescription = document.querySelector('meta[name="description"]');
  if (metaDescription) {
    metaDescription.content = `${APP_FULL_NAME} - Ambulatory Glucose Profile Generator for Medtronic 780G CGM data analysis`;
  }
}

// Import tombstone store initialization
import { 
  migrateLocalStorageToIndexedDB, 
  syncIndexedDBToLocalStorage,
  cleanupOldDeletedSensorsDB,
  isIndexedDBAvailable 
} from './storage/deletedSensorsDB.js';

/**
 * AGP+ Main Application Entry Point
 * 
 * Initializes React 18 root and renders the main AGPGenerator component.
 * Uses the new createRoot API for concurrent features support.
 * Includes IndexedDB tombstone store initialization for deleted sensors tracking.
 */

// Initialize IndexedDB tombstone store
(async () => {
  try {
    if (isIndexedDBAvailable()) {
      console.log('[main] Initializing tombstone store (IndexedDB)...');
      
      // 1. Migrate any legacy localStorage deleted sensors to IndexedDB
      const legacyDeleted = JSON.parse(localStorage.getItem('agp-deleted-sensors') || '[]');
      const migration = await migrateLocalStorageToIndexedDB(legacyDeleted);
      
      if (migration.migrated > 0) {
        console.log('[main] Migrated', migration.migrated, 'deleted sensors to IndexedDB');
      }
      
      // 2. Cleanup old tombstones (>90 days)
      const cleanup = await cleanupOldDeletedSensorsDB();
      if (cleanup.removed > 0) {
        console.log('[main] Cleaned up', cleanup.removed, 'expired tombstones');
      }
      
      // 3. Sync IndexedDB to localStorage cache
      await syncIndexedDBToLocalStorage();
      
      console.log('[main] Tombstone store initialized successfully');
    } else {
      console.warn('[main] IndexedDB not available, using localStorage fallback');
    }
  } catch (err) {
    console.error('[main] Tombstone store initialization failed:', err);
    // Non-critical error - app will still work with localStorage fallback
  }
})();

// Get root element
const rootElement = document.getElementById('root');

// Update document meta before rendering
updateDocumentMeta();

// Create React 18 root
const root = createRoot(rootElement);

// Render application
// Note: StrictMode temporarily disabled for debugging
root.render(
  <DataProvider>
    <PeriodProvider>
      <MetricsProvider>
        <UIProvider>
          {/* <MigrationBanner /> */}
          <AGPGenerator />
        </UIProvider>
      </MetricsProvider>
    </PeriodProvider>
  </DataProvider>
);

/**
 * DEVELOPMENT NOTES:
 * 
 * - React.StrictMode enables additional development checks
 * - AGPGenerator is the main container component (to be created in PROMPT 7)
 * - globals.css contains dark theme and base styling
 * 
 * For now, AGPGenerator is a placeholder component.
 * It will be implemented after all child components are built (PROMPTS 2-6).
 */
