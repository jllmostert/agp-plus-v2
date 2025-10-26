import React from 'react';
import { createRoot } from 'react-dom/client';
import AGPGenerator from './components/AGPGenerator.jsx';
// import { MigrationBanner } from './components/MigrationBanner.jsx'; // Disabled: v3.0 migration not ready yet
import './styles/globals.css';

/**
 * AGP+ v3.6 - Main Application Entry Point
 * 
 * Initializes React 18 root and renders the main AGPGenerator component.
 * Uses the new createRoot API for concurrent features support.
 * 
 * Note: MigrationBanner disabled during v3.6 development (event detection phase)
 */

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
