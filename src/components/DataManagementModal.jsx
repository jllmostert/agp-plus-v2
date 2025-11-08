import React, { useState } from 'react';
import { X, Trash2, Database } from 'lucide-react';
import { debug } from '../utils/debug.js';

export default function DataManagementModal({ onClose, onDelete, currentDataStats }) {
  // State for date range selection
  const [rangeType, setRangeType] = useState('14d'); // '14d' | '30d' | 'custom'
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  
  // State for data type checkboxes
  const [deleteGlucose, setDeleteGlucose] = useState(false);
  const [deleteProTime, setDeleteProTime] = useState(false);
  const [deleteCartridge, setDeleteCartridge] = useState(false);
  
  // State for deletion process
  const [isDeleting, setIsDeleting] = useState(false);
  const [preview, setPreview] = useState(null);

  // Calculate date range based on selection
  const getDateRange = () => {
    const now = new Date();
    let start, end;
    
    if (rangeType === '14d') {
      start = new Date(now);
      start.setDate(start.getDate() - 14);
      end = now;
    } else if (rangeType === '30d') {
      start = new Date(now);
      start.setDate(start.getDate() - 30);
      end = now;
    } else if (rangeType === 'custom') {
      if (!customStart || !customEnd) return null;
      start = new Date(customStart);
      end = new Date(customEnd);
      end.setHours(23, 59, 59, 999);
    }
    
    return { start, end };
  };
  
  // Generate preview of what will be deleted
  const generatePreview = async () => {
    const dateRange = getDateRange();
    if (!dateRange) {
      alert('Select valid date range');
      return;
    }
    
    // Count what would be deleted
    const counts = {
      glucoseCount: 0,
      proTimeCount: 0,
      cartridgeCount: 0
    };
    
    if (deleteGlucose && currentDataStats.hasData) {
      // Estimate from total - we can't easily count without actually filtering
      counts.glucoseCount = Math.floor(currentDataStats.readingCount * 0.1); // Rough estimate
    }
    
    if (deleteProTime) {
      // Load workdays from IndexedDB
      try {
        const { loadProTimeData } = await import('../storage/masterDatasetStorage');
        const workdaySet = await loadProTimeData();
        counts.proTimeCount = workdaySet ? workdaySet.size : 0;
      } catch (err) {
        console.warn('[DataManagementModal] Failed to load ProTime data:', err);
        counts.proTimeCount = 0;
      }
    }
    
    if (deleteCartridge) {
      // Load cartridge events from IndexedDB
      try {
        const { getCartridgeHistory } = await import('../storage/eventStorage');
        const cartridges = await getCartridgeHistory();
        counts.cartridgeCount = cartridges ? cartridges.length : 0;
      } catch (err) {
        console.warn('[DataManagementModal] Failed to load cartridge data:', err);
        counts.cartridgeCount = 0;
      }
    }
    
    setPreview(counts);
  };
  
  // Handle deletion
  const handleDelete = async () => {
    debug.log('[DataManagementModal] ====== handleDelete CALLED ======');
    debug.log('[DataManagementModal] Button click registered!');
    
    const dateRange = getDateRange();
    if (!dateRange) {
      debug.warn('[DataManagementModal] No valid date range');
      alert('Select valid date range');
      return;
    }
    
    debug.log('[DataManagementModal] Date range valid:', dateRange);
    
    if (!deleteGlucose && !deleteProTime && !deleteCartridge) {
      debug.warn('[DataManagementModal] No data types selected');
      alert('Select at least one data type');
      return;
    }
    
    debug.log('[DataManagementModal] Delete types:', { deleteGlucose, deleteProTime, deleteCartridge });
    debug.log('[DataManagementModal] Starting deletion process...');
    
    setIsDeleting(true);
    
    try {
      debug.log('[DataManagementModal] Calling onDelete function...');
      const result = await onDelete({
        dateRange,
        deleteTypes: {
          glucose: deleteGlucose,
          proTime: deleteProTime,
          cartridge: deleteCartridge
        }
      });
      
      debug.log('[DataManagementModal] Deletion complete:', result);
      alert(`Deleted: ${result.glucose} readings, ${result.proTime} workdays, ${result.cartridge} cartridge events`);
      onClose();
      
    } catch (err) {
      debug.error('[DataManagementModal] Delete failed:', err);
      alert('Deletion failed: ' + err.message);
    } finally {
      setIsDeleting(false);
      debug.log('[DataManagementModal] ====== handleDelete FINISHED ======');
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.9)',
      display: 'flex',
      alignItems: 'flex-start',
      justifyContent: 'center',
      zIndex: 9999,
      padding: '1rem',
      paddingTop: '5vh'
    }}>
      <div style={{
        background: 'var(--paper)',
        border: '4px solid var(--ink)',
        maxWidth: '600px',
        width: '100%',
        maxHeight: '85vh',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '1.5rem',
          borderBottom: '4px solid var(--ink)',
          background: 'var(--color-black)',
          color: 'var(--color-white)',
          flexShrink: 0
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Database size={24} />
            <h2 style={{
              fontSize: '1.25rem',
              fontWeight: 700,
              letterSpacing: '0.15em',
              textTransform: 'uppercase',
              margin: 0
            }}>
              DATA CLEANUP
            </h2>
          </div>
          <button 
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--color-white)',
              cursor: 'pointer',
              padding: '0.5rem'
            }}
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div style={{
          padding: '2rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '2rem',
          flex: '1 1 auto',
          overflowY: 'auto',
          minHeight: 0
        }}>
          {/* ALL-IN Nuclear Option */}
          <div style={{
            background: 'rgba(220, 38, 38, 0.1)',
            border: '3px solid var(--color-red)',
            padding: '1.5rem'
          }}>
            <h3 style={{
              fontSize: '0.875rem',
              fontWeight: 700,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              marginBottom: '1rem',
              color: 'var(--color-red)'
            }}>
              NUCLEAR OPTION
            </h3>
            <p style={{
              fontSize: '0.875rem',
              lineHeight: '1.6',
              marginBottom: '1rem',
              color: 'var(--ink)'
            }}>
              <strong>ALL-IN</strong> verwijdert ALLE data behalve patiënt info, sensoren en sensor stock:
            </p>
            <ul style={{
              margin: '0 0 1rem 1.5rem',
              fontSize: '0.75rem',
              lineHeight: '1.8',
              listStyle: 'disc'
            }}>
              <li>Alle glucose readings</li>
              <li>Alle cartridge changes</li>
              <li>Alle ProTime werkdagen</li>
            </ul>
            <p style={{
              fontSize: '0.75rem',
              marginBottom: '1rem',
              color: 'var(--text-secondary)'
            }}>
              Behoudt: Patiënt info, sensoren, sensor stock<br/>
              Automatische backup wordt gemaakt voor cleanup
            </p>
            <button
              onClick={async () => {
                const confirmed = confirm(
                  'ALL-IN CLEANUP\n\n' +
                  'This will delete:\n' +
                  '- All glucose readings\n' +
                  '- All cartridge changes\n' +
                  '- All ProTime workdays\n\n' +
                  'Automatic backup will be created\n' +
                  'Preserves: Patient info, sensors, sensor stock\n\n' +
                  'Are you ABSOLUTELY SURE?'
                );
                
                if (!confirmed) {
                  return;
                }
                
                setIsDeleting(true);
                
                try {
                  // Create backup first
                  debug.log('[DataManagementModal] Creating backup before ALL-IN...');
                  const { exportAndDownload } = await import('../storage/masterDatasetStorage');
                  const backupResult = await exportAndDownload();
                  
                  if (!backupResult.success) {
                    alert(`Backup failed: ${backupResult.error}\n\nCleanup cancelled for safety.`);
                    setIsDeleting(false);
                    return;
                  }
                  
                  debug.log('[DataManagementModal] Backup created:', backupResult.filename);
                  
                  // Execute ALL-IN cleanup
                  const { cleanupRecords } = await import('../storage/masterDatasetStorage');
                  const result = await cleanupRecords({ type: 'all-in' });
                  
                  if (result.success) {
                    alert(`ALL-IN Cleanup Complete\n\nBackup: ${backupResult.filename}\n\nDeleted: Readings, cartridges, ProTime\nKept: Patient, sensors, sensor stock`);
                    onClose();
                    window.location.reload(); // Force reload to clear all caches
                  } else {
                    alert(`Cleanup failed: ${result.error}`);
                  }
                  
                } catch (err) {
                  debug.error('[DataManagementModal] ALL-IN failed:', err);
                  alert(`ALL-IN failed: ${err.message}`);
                } finally {
                  setIsDeleting(false);
                }
              }}
              disabled={isDeleting}
              style={{
                width: '100%',
                padding: '1rem',
                border: '3px solid var(--border-primary)',
                background: 'var(--color-red)',
                color: '#fff',
                fontWeight: 700,
                fontSize: '0.875rem',
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                cursor: isDeleting ? 'not-allowed' : 'pointer',
                opacity: isDeleting ? 0.5 : 1
              }}
            >
              ALL-IN (Nuclear Reset)
            </button>
          </div>
          
          {/* Divider */}
          <div style={{
            borderTop: '2px solid var(--border-primary)',
            paddingTop: '1rem'
          }}>
            <p style={{
              fontSize: '0.75rem',
              fontWeight: 700,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: 'var(--text-secondary)',
              marginBottom: '1rem'
            }}>
              OF: SELECTIEVE CLEANUP
            </p>
          </div>
          
          {/* Date Range Selector */}
          <div>
            <h3 style={{
              fontSize: '0.875rem',
              fontWeight: 700,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              marginBottom: '1rem',
              color: 'var(--ink)'
            }}>
              DATE RANGE
            </h3>
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '0.75rem'
            }}>
              <label style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                cursor: 'pointer',
                fontSize: '0.875rem'
              }}>
                <input 
                  type="radio" 
                  name="range" 
                  value="14d" 
                  checked={rangeType === '14d'} 
                  onChange={(e) => setRangeType(e.target.value)}
                  style={{ cursor: 'pointer' }}
                />
                Last 14 days
              </label>
              <label style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                cursor: 'pointer',
                fontSize: '0.875rem'
              }}>
                <input 
                  type="radio" 
                  name="range" 
                  value="30d"
                  checked={rangeType === '30d'}
                  onChange={(e) => setRangeType(e.target.value)}
                  style={{ cursor: 'pointer' }}
                />
                Last 30 days
              </label>
              <label style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                cursor: 'pointer',
                fontSize: '0.875rem'
              }}>
                <input 
                  type="radio" 
                  name="range" 
                  value="custom"
                  checked={rangeType === 'custom'}
                  onChange={(e) => setRangeType(e.target.value)}
                  style={{ cursor: 'pointer' }}
                />
                Custom range
              </label>
              {rangeType === 'custom' && (
                <div style={{
                  marginLeft: '1.5rem',
                  display: 'flex',
                  gap: '0.75rem',
                  alignItems: 'center',
                  fontSize: '0.875rem'
                }}>
                  <input 
                    type="date" 
                    value={customStart} 
                    onChange={(e) => setCustomStart(e.target.value)}
                    style={{
                      padding: '0.5rem',
                      border: '2px solid var(--ink)',
                      fontFamily: 'monospace',
                      fontSize: '0.875rem'
                    }}
                  />
                  <span style={{ fontWeight: 600 }}>→</span>
                  <input 
                    type="date" 
                    value={customEnd}
                    onChange={(e) => setCustomEnd(e.target.value)}
                    style={{
                      padding: '0.5rem',
                      border: '2px solid var(--ink)',
                      fontFamily: 'monospace',
                      fontSize: '0.875rem'
                    }}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Data Type Checkboxes */}
          <div>
            <h3 style={{
              fontSize: '0.875rem',
              fontWeight: 700,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              marginBottom: '1rem',
              color: 'var(--ink)'
            }}>
              DATA TO DELETE
            </h3>
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '0.75rem'
            }}>
              <label style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                cursor: 'pointer',
                fontSize: '0.875rem'
              }}>
                <input 
                  type="checkbox" 
                  checked={deleteGlucose}
                  onChange={(e) => setDeleteGlucose(e.target.checked)}
                  style={{ cursor: 'pointer' }}
                />
                Glucose readings
              </label>
              <label style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                cursor: 'pointer',
                fontSize: '0.875rem'
              }}>
                <input 
                  type="checkbox" 
                  checked={deleteProTime}
                  onChange={(e) => setDeleteProTime(e.target.checked)}
                  style={{ cursor: 'pointer' }}
                />
                ProTime workday data
              </label>
              <label style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                cursor: 'pointer',
                fontSize: '0.875rem'
              }}>
                <input 
                  type="checkbox" 
                  checked={deleteCartridge}
                  onChange={(e) => setDeleteCartridge(e.target.checked)}
                  style={{ cursor: 'pointer' }}
                />
                Cartridge change events
              </label>
              <label style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                opacity: 0.4,
                cursor: 'not-allowed',
                fontSize: '0.875rem'
              }}>
                <input 
                  type="checkbox" 
                  disabled 
                  checked={false}
                  style={{ cursor: 'not-allowed' }}
                />
                Sensor changes (always kept)
              </label>
            </div>
          </div>

          {/* Preview Section */}
          {preview && (
            <div style={{
              background: 'rgba(239, 68, 68, 0.1)',
              border: '3px solid var(--color-red)',
              padding: '1rem',
              marginTop: '1rem'
            }}>
              <h4 style={{
                fontSize: '0.875rem',
                fontWeight: 700,
                color: 'var(--color-red)',
                marginBottom: '0.75rem',
                letterSpacing: '0.05em'
              }}>
                ⚠️ PREVIEW
              </h4>
              <ul style={{
                fontSize: '0.875rem',
                listStyle: 'none',
                padding: 0,
                margin: 0,
                display: 'flex',
                flexDirection: 'column',
                gap: '0.5rem'
              }}>
                {preview.glucoseCount > 0 && (
                  <li>• <strong>{preview.glucoseCount.toLocaleString()}</strong> glucose readings</li>
                )}
                {preview.proTimeCount > 0 && (
                  <li>• <strong>{preview.proTimeCount.toLocaleString()}</strong> ProTime workdays</li>
                )}
                {preview.cartridgeCount > 0 && (
                  <li>• <strong>{preview.cartridgeCount.toLocaleString()}</strong> cartridge events</li>
                )}
              </ul>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{
          display: 'flex',
          justifyContent: 'flex-end',
          gap: '1rem',
          padding: '1.5rem',
          borderTop: '4px solid var(--ink)',
          flexShrink: 0
        }}>
          <button 
            onClick={generatePreview}
            disabled={!deleteGlucose && !deleteProTime && !deleteCartridge}
            style={{
              padding: '0.75rem 1.5rem',
              border: '3px solid var(--ink)',
              background: 'var(--paper)',
              color: 'var(--ink)',
              fontWeight: 700,
              fontSize: '0.875rem',
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
              cursor: (!deleteGlucose && !deleteProTime && !deleteCartridge) ? 'not-allowed' : 'pointer',
              opacity: (!deleteGlucose && !deleteProTime && !deleteCartridge) ? 0.5 : 1
            }}
          >
            PREVIEW
          </button>
          <button 
            onClick={onClose}
            style={{
              padding: '0.75rem 1.5rem',
              border: '3px solid var(--ink)',
              background: 'var(--paper)',
              color: 'var(--ink)',
              fontWeight: 700,
              fontSize: '0.875rem',
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
              cursor: 'pointer'
            }}
          >
            CANCEL
          </button>
          <button 
            onClick={handleDelete}
            disabled={isDeleting || (!deleteGlucose && !deleteProTime && !deleteCartridge)}
            style={{
              padding: '0.75rem 1.5rem',
              border: '3px solid var(--color-red)',
              background: 'var(--color-red)',
              color: 'var(--color-white)',
              fontWeight: 700,
              fontSize: '0.875rem',
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
              cursor: (isDeleting || (!deleteGlucose && !deleteProTime && !deleteCartridge)) ? 'not-allowed' : 'pointer',
              opacity: (isDeleting || (!deleteGlucose && !deleteProTime && !deleteCartridge)) ? 0.5 : 1
            }}
          >
            {isDeleting ? 'DELETING...' : '🗑️ DELETE DATA'}
          </button>
        </div>
      </div>
    </div>
  );
}
