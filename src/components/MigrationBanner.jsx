/**
 * MigrationBanner - Automatic v2.x → v3.0 Migration UI
 * 
 * Checks if migration is needed on mount and automatically triggers it.
 * Shows progress during migration, errors on failure, and dismisses when complete.
 * 
 * States:
 * - checking: Initial check if migration needed
 * - migrating: Migration in progress
 * - error: Migration failed
 * - complete: Migration successful (auto-dismisses after 3s)
 * - hidden: No migration needed or already dismissed
 */

import React, { useState, useEffect } from 'react';
import { needsMigration, migrateToV3 } from '../storage/migrations/migrateToV3.js';

export function MigrationBanner() {
  const [status, setStatus] = useState('checking'); // checking | migrating | error | complete | hidden
  const [progress, setProgress] = useState('');
  const [error, setError] = useState(null);

  useEffect(() => {
    checkAndMigrate();
  }, []);

  async function checkAndMigrate() {
    try {
      // Check if migration needed
      const needed = await needsMigration();
      
      if (!needed) {
        setStatus('hidden');
        return;
      }

      // Migration needed - trigger it
      setStatus('migrating');
      setProgress('Starting migration...');

      const result = await migrateToV3();

      if (result.success) {
        setStatus('complete');
        setProgress(`✅ Migrated ${result.totalReadings} readings in ${result.totalTime}s`);
        
        // Auto-dismiss after 10 seconds (for testing)
        setTimeout(() => {
          setStatus('hidden');
        }, 10000);
      } else {
        setStatus('error');
        setError(result.errors?.[0]?.message || 'Migration failed');
      }

    } catch (err) {
      console.error('[MigrationBanner] Error:', err);
      setStatus('error');
      setError(err.message);
    }
  }  function handleDismiss() {
    setStatus('hidden');
  }

  if (status === 'hidden') {
    return null;
  }

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      zIndex: 9999,
      background: status === 'error' ? '#dc2626' : status === 'complete' ? '#16a34a' : '#2563eb',
      color: '#ffffff',
      padding: '12px 20px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      fontFamily: 'monospace',
      fontSize: '14px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
      opacity: status === 'complete' ? 0.6 : 1.0
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {status === 'checking' && (
          <>
            <div style={{ 
              width: '16px', 
              height: '16px', 
              border: '2px solid rgba(255,255,255,0.3)',
              borderTopColor: '#ffffff',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite'
            }} />
            <span>Checking migration status...</span>
          </>
        )}

        {status === 'migrating' && (
          <>
            <div style={{ 
              width: '16px', 
              height: '16px', 
              border: '2px solid rgba(255,255,255,0.3)',
              borderTopColor: '#ffffff',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite'
            }} />
            <span>{progress}</span>
          </>
        )}

        {status === 'complete' && (
          <>
            <span style={{ fontSize: '18px' }}>✅</span>
            <span>{progress}</span>
          </>
        )}

        {status === 'error' && (
          <>
            <span style={{ fontSize: '18px' }}>❌</span>
            <span>Migration error: {error}</span>
          </>
        )}
      </div>

      {(status === 'error' || status === 'complete') && (
        <button
          onClick={handleDismiss}
          style={{
            background: 'rgba(255,255,255,0.2)',
            border: '1px solid rgba(255,255,255,0.3)',
            color: '#ffffff',
            padding: '4px 12px',
            borderRadius: '4px',
            cursor: 'pointer',
            fontFamily: 'monospace',
            fontSize: '12px'
          }}
        >
          Dismiss
        </button>
      )}

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}