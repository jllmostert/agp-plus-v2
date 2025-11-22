import React from 'react';
import { APP_FULL_NAME } from '../utils/version.js';

/**
 * AppFooter - Application footer component
 * 
 * Displays:
 * - App name and purpose
 * - ADA Standards reference link
 * - Scientific methodology citations
 */
const AppFooter = () => {
  return (
    <footer className="mt-16 pt-8 border-t border-gray-800 text-center text-sm text-gray-500">
      <p>
        {APP_FULL_NAME} | Built for Medtronic CareLink CSV exports
      </p>
      <p className="mt-2">
        Following{' '}
        <a 
          href="https://diabetesjournals.org/care/issue/48/Supplement_1"
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-400 hover:text-blue-300 underline"
        >
          ADA Standards of Care in Diabetes—2025
        </a>
      </p>
      
      {/* Scientific methodology note */}
      <p className="mt-4 text-xs" style={{ 
        maxWidth: '800px', 
        margin: '1rem auto 0',
        color: 'var(--text-tertiary)',
        lineHeight: '1.6'
      }}>
        <strong>Methodologische verwijzing:</strong> Alle berekeningen volgen de ATTD Consensus on CGM Metrics 
        (Battelino et al., <em>Diabetes Care</em> 2019;42(8):1593-1603), aangevuld met de GMI-formule 
        (Beck et al., <em>Diabetes Care</em> 2019;42(4):659-666), MAGE-definitie 
        (Service et al., <em>Diabetes</em> 1970;19(9):644-655) en MODD-definitie 
        (Molnar et al., <em>Diabetologia</em> 1972;8:342-348). 
        Drempelwaarden (70-180 mg/dL) conform ADA/ATTD richtlijnen 2023.
      </p>
    </footer>
  );
};

export default AppFooter;
