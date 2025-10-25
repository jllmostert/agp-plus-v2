import React from 'react';
import { createRoot } from 'react-dom/client';
import AGPGenerator from './components/AGPGenerator.jsx';
import { MigrationBanner } from './components/MigrationBanner.jsx';
import './styles/globals.css';

/**
 * AGP+ v2.1 - Main Application Entry Point
 * 
 * Initializes React 18 root and renders the main AGPGenerator component.
 * Uses the new createRoot API for concurrent features support.
 */

// Get root element
const rootElement = document.getElementById('root');

// Create React 18 root
const root = createRoot(rootElement);

// Render application
root.render(
  <React.StrictMode>
    <MigrationBanner />
    <AGPGenerator />
  </React.StrictMode>
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
