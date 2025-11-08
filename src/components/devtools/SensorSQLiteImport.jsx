/**
 * SensorSQLiteImport.jsx
 * 
 * DevTool: Allows importing master_sensors.db (SQLite) into IndexedDB.
 * Shows import status and sensor count.
 * 
 * @version 3.7.0 - PHASE 2: IndexedDB migration
 */

import React, { useState, useEffect } from 'react';
import { importSensorsFromFile } from '../../storage/sensorImport.js';
import { getAllSensors } from '../../storage/sensorStorage.js';

export default function SensorSQLiteImport() {
  const [importing, setImporting] = useState(false);
  const [stats, setStats] = useState(null);
  const [error, setError] = useState(null);
  
  // Load stats on mount
  useEffect(() => {
    loadStats();
  }, []);
  
  async function loadStats() {
    try {
      const sensors = getAllSensors();
      if (sensors && sensors.length > 0) {
        // Extract valid timestamps
        const validTimestamps = sensors
          .map(s => s.start_date)
          .filter(t => t && !isNaN(new Date(t).getTime()))
          .map(t => new Date(t))
          .sort((a,b) => a - b);
        
        if (validTimestamps.length > 0) {
          setStats({
            total: sensors.length,
            oldest: validTimestamps[0].toISOString().split('T')[0],
            newest: validTimestamps[validTimestamps.length - 1].toISOString().split('T')[0]
          });
        }
      }
    } catch (err) {
      console.error('[SensorImport] Failed to load stats:', err);
    }
  }
  
  async function handleFileSelect(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    setImporting(true);
    setError(null);
    
    try {
      const result = await importSensorsFromFile(file);
      
      if (result.success) {
        await loadStats();
        alert(`✅ Import succesvol!\n${result.count} sensors geïmporteerd`);
      } else {
        throw new Error(result.errors?.[0] || 'Unknown error');
      }
    } catch (err) {
      console.error('[SensorImport] Error:', err);
      setError(err.message);
      alert(`❌ Import mislukt: ${err.message}`);
    } finally {
      setImporting(false);
    }
  }
  
  return (
    <div style={{
      border: '3px solid var(--border-primary)',
      padding: '1rem',
      background: 'var(--bg-secondary)',
      marginBottom: '1rem'
    }}>
      <div style={{
        fontFamily: '"Courier New", Courier, monospace',
        fontSize: '14px',
        fontWeight: 'bold',
        marginBottom: '0.5rem',
        color: 'var(--text-primary)'
      }}>
        SENSOR DATABASE
      </div>
      
      {stats ? (
        <div style={{
          fontFamily: '"Courier New", Courier, monospace',
          fontSize: '12px',
          marginBottom: '0.5rem',
          color: 'var(--text-primary)'
        }}>
          <div>✓ {stats.total} sensors in database</div>
          <div style={{ fontSize: '10px', opacity: 0.6 }}>
            Range: {stats.oldest} → {stats.newest}
          </div>
        </div>
      ) : (
        <div style={{
          fontFamily: '"Courier New", Courier, monospace',
          fontSize: '12px',
          marginBottom: '0.5rem',
          opacity: 0.7,
          color: 'var(--text-secondary)'
        }}>
          Geen sensor database geïmporteerd
        </div>
      )}
      
      <label style={{
        display: 'inline-block',
        border: '3px solid var(--border-primary)',
        padding: '0.5rem 1rem',
        background: 'var(--bg-primary)',
        fontFamily: '"Courier New", Courier, monospace',
        fontSize: '12px',
        fontWeight: 'bold',
        cursor: importing ? 'wait' : 'pointer',
        opacity: importing ? 0.5 : 1,
        color: 'var(--text-primary)'
      }}>
        {importing ? 'IMPORTEREN...' : stats ? '🔄 RE-IMPORT' : '📥 IMPORT DATABASE'}
        <input
          type="file"
          accept=".db"
          onChange={handleFileSelect}
          disabled={importing}
          style={{ display: 'none' }}
        />
      </label>
      
      {error && (
        <div style={{
          marginTop: '0.5rem',
          padding: '0.5rem',
          background: 'rgba(220, 38, 38, 0.1)',
          border: '2px solid var(--color-red)',
          fontFamily: '"Courier New", Courier, monospace',
          fontSize: '11px',
          color: 'var(--color-red)'
        }}>
          ERROR: {error}
        </div>
      )}
    </div>
  );
}
