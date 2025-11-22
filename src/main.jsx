import React, { useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import AGPGenerator from './components/AGPGenerator.jsx';
import ErrorBoundary from './components/ErrorBoundary.jsx';
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

// Import device era initialization
import { initDeviceEras } from './core/deviceEras.js';

/**
 * AGP+ Main Application Entry Point
 * 
 * Initializes React 18 root and renders the main AGPGenerator component.
 * Uses the new createRoot API for concurrent features support.
 * Includes IndexedDB tombstone store initialization for deleted sensors tracking.
 */

// Initialize device eras on startup
(async () => {
  try {
    await initDeviceEras();
  } catch (err) {
    console.error('[main] Device eras initialization failed:', err);
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
  <ErrorBoundary name="root">
    <DataProvider>
      <PeriodProvider>
        <MetricsProvider>
          <UIProvider>
            {/* <MigrationBanner /> */}
            <ErrorBoundary name="AGPGenerator">
              <AGPGenerator />
            </ErrorBoundary>
          </UIProvider>
        </MetricsProvider>
      </PeriodProvider>
    </DataProvider>
  </ErrorBoundary>
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
