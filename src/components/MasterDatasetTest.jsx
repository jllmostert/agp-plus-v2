/**
 * MasterDatasetTest - Quick component to test useMasterDataset hook
 * 
 * Usage: Import in App.jsx and render temporarily
 */

import React from 'react';
import { useMasterDataset } from '../hooks/useMasterDataset';

export function MasterDatasetTest() {
  const { readings, stats, isLoading, error } = useMasterDataset();

  if (isLoading) {
    return <div style={{ padding: '20px' }}>Loading master dataset...</div>;
  }

  if (error) {
    return <div style={{ padding: '20px', color: 'red' }}>Error: {error}</div>;
  }

  return (
    <div style={{ 
      padding: '20px', 
      border: '2px solid green',
      margin: '20px',
      borderRadius: '8px'
    }}>
      <h2>✅ Master Dataset Loaded!</h2>
      
      <div style={{ marginTop: '10px' }}>
        <strong>Stats:</strong>
        <pre style={{ background: '#f5f5f5', padding: '10px', borderRadius: '4px' }}>
          {JSON.stringify(stats, null, 2)}
        </pre>
      </div>

      <div style={{ marginTop: '10px' }}>
        <strong>Readings:</strong> {readings.length} loaded
      </div>

      {readings.length > 0 && (
        <div style={{ marginTop: '10px' }}>
          <strong>Sample (first reading):</strong>
          <pre style={{ background: '#f5f5f5', padding: '10px', borderRadius: '4px' }}>
            {JSON.stringify(readings[0], null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}