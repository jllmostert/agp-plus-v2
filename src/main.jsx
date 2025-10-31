import React, { useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import AGPGenerator from './components/AGPGenerator.jsx';
// import { MigrationBanner } from './components/MigrationBanner.jsx'; // Disabled: v3.0 migration not ready yet
import './styles/globals.css';

// Import tombstone store initialization
import { 
  migrateLocalStorageToIndexedDB, 
  syncIndexedDBToLocalStorage,
  cleanupOldDeletedSensorsDB,
  isIndexedDBAvailable 
} from './storage/deletedSensorsDB.js';

/**
 * AGP+ v3.11 - Main Application Entry Point
 * 
 * Initializes React 18 root and renders the main AGPGenerator component.
 * Uses the new createRoot API for concurrent features support.
 * Includes IndexedDB tombstone store initialization for Issue #1 fix.
 * 
 * Note: MigrationBanner disabled during v3.6 development (event detection phase)
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

// Create React 18 root
const root = createRoot(rootElement);

// Render application
// Note: StrictMode temporarily disabled for debugging
root.render(
  <>
    {/* <MigrationBanner /> */}
    <AGPGenerator />
  </>
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
