/**
 * Sensor Database Import Button
 * 
 * Allows user to import master_sensors.db (SQLite) into IndexedDB.
 * Shows import status and sensor count.
 * 
 * @version 3.6.0
 */

import React, { useState } from 'react';
import { parseSQLiteDatabase } from '../utils/sqliteParser.js';
import { importSensorDatabase, hasSensorDatabase, getSensorStats } from '../storage/sensorStorage.js';

export default function SensorImport() {
  const [importing, setImporting] = useState(false);
  const [hasDb, setHasDb] = useState(false);
  const [stats, setStats] = useState(null);
  const [error, setError] = useState(null);
  
  // Check if database exists on mount
  React.useEffect(() => {
    const exists = hasSensorDatabase();
    setHasDb(exists);
    
    if (exists) {
      const dbStats = getSensorStats();
      setStats(dbStats);
    }
  }, []);
  
  async function handleFileSelect(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    setImporting(true);
    setError(null);
    
    try {
      // Parse SQLite file
      const parsed = await parseSQLiteDatabase(file);
      
      // Import to localStorage (sync operation)
      const result = importSensorDatabase(parsed);
      
      // Update UI
      setHasDb(true);
      const dbStats = getSensorStats();
      setStats(dbStats);
      
      alert(`✅ Import succesvol!\n${result.sensorsImported} sensors geïmporteerd`);
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
      
      {hasDb && stats ? (
        <div style={{
          fontFamily: '"Courier New", Courier, monospace',
          fontSize: '12px',
          marginBottom: '0.5rem',
          color: 'var(--text-primary)'
        }}>
          <div>✓ {stats.total} sensors geïmporteerd</div>
          <div>✓ Success rate: {stats.successRate.toFixed(1)}%</div>
          <div>✓ Gem. duur: {stats.avgDuration.toFixed(1)} dagen</div>
          <div style={{ fontSize: '10px', opacity: 0.6, marginTop: '0.25rem' }}>
            Laatst bijgewerkt: {new Date(stats.lastUpdated).toLocaleDateString('nl-NL')}
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
        {importing ? 'IMPORTEREN...' : hasDb ? 'UPDATE DATABASE' : 'IMPORTEER DATABASE'}
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
