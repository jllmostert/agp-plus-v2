import React, { useState } from 'react';
import { Lock, Unlock, Trash2, Check, X, Edit2 } from 'lucide-react';

/**
 * SavedUploadsList - UI for managing saved uploads
 * 
 * Shows list of saved uploads with lock/unlock/delete controls.
 * Brutalist design matching AGP+ aesthetic.
 * 
 * @param {Array} uploads - List of saved uploads
 * @param {string} activeId - Currently active upload ID
 * @param {Object} storageInfo - Storage usage info
 * @param {Function} onLoad - Load upload callback
 * @param {Function} onToggleLock - Toggle lock callback
 * @param {Function} onDelete - Delete upload callback
 * @param {Function} onRename - Rename upload callback
 * 
 * @version 1.0.0
 */
export default function SavedUploadsList({ 
  uploads, 
  activeId, 
  storageInfo,
  onLoad, 
  onToggleLock, 
  onDelete,
  onRename 
}) {
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');

  /**
   * Start editing name
   */
  const startEdit = (upload) => {
    if (upload.locked) return;
    setEditingId(upload.id);
    setEditName(upload.name);
  };

  /**
   * Save edited name
   */
  const saveEdit = () => {
    if (editName.trim()) {
      onRename(editingId, editName.trim());
    }
    setEditingId(null);
    setEditName('');
  };

  /**
   * Cancel editing
   */
  const cancelEdit = () => {
    setEditingId(null);
    setEditName('');
  };

  /**
   * Handle delete with confirmation
   */
  const handleDelete = (upload) => {
    if (upload.locked) {
      alert('⚠️ Cannot delete locked upload. Unlock first.');
      return;
    }
    
    if (confirm(`Delete "${upload.name}"? This cannot be undone.`)) {
      try {
        onDelete(upload.id);
      } catch (err) {
        alert(err.message);
      }
    }
  };

  /**
   * Format date for display
   */
  const formatDate = (isoString) => {
    return new Date(isoString).toLocaleDateString('nl-NL', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  if (uploads.length === 0) {
    return (
      <div style={{
        padding: '1.5rem',
        border: '2px solid var(--border-secondary)',
        background: 'var(--bg-secondary)',
        textAlign: 'center'
      }}>
        <p style={{
          fontSize: '0.875rem',
          color: 'var(--text-secondary)',
          textTransform: 'uppercase',
          letterSpacing: '0.05em'
        }}>
          No saved uploads yet
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* Upload List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {uploads.map(upload => (
          <div
            key={upload.id}
            style={{
              border: upload.id === activeId 
                ? '3px solid var(--border-primary)' 
                : '2px solid var(--border-secondary)',
              background: upload.id === activeId 
                ? 'var(--bg-primary)' 
                : 'var(--bg-secondary)',
              padding: '0.75rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              transition: 'all 100ms linear'
            }}
          >
            {/* Lock Icon */}
            <div style={{ flexShrink: 0 }}>
              {upload.locked ? (
                <Lock className="w-5 h-5" style={{ color: 'var(--text-primary)' }} />
              ) : (
                <Unlock className="w-5 h-5" style={{ color: 'var(--text-secondary)' }} />
              )}
            </div>

            {/* Name (editable if unlocked) */}
            <div style={{ flex: 1, minWidth: 0 }}>
              {editingId === upload.id ? (
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') saveEdit();
                      if (e.key === 'Escape') cancelEdit();
                    }}
                    autoFocus
                    style={{
                      flex: 1,
                      padding: '0.25rem 0.5rem',
                      border: '2px solid var(--border-primary)',
                      background: 'var(--bg-primary)',
                      color: 'var(--text-primary)',
                      fontFamily: 'inherit',
                      fontSize: '0.875rem',
                      fontWeight: 700
                    }}
                  />
                  <button
                    onClick={saveEdit}
                    style={{
                      padding: '0.25rem',
                      border: '2px solid var(--color-green)',
                      background: 'transparent',
                      cursor: 'pointer'
                    }}
                  >
                    <Check className="w-4 h-4" style={{ color: 'var(--color-green)' }} />
                  </button>
                  <button
                    onClick={cancelEdit}
                    style={{
                      padding: '0.25rem',
                      border: '2px solid var(--border-secondary)',
                      background: 'transparent',
                      cursor: 'pointer'
                    }}
                  >
                    <X className="w-4 h-4" style={{ color: 'var(--text-secondary)' }} />
                  </button>
                </div>
              ) : (
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <span style={{
                      fontSize: '0.875rem',
                      fontWeight: 700,
                      color: 'var(--text-primary)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      flex: 1
                    }}>
                      {upload.name}
                    </span>
                    {upload.id === activeId && (
                      <span style={{
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        color: 'var(--color-green)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        padding: '0.25rem 0.5rem',
                        border: '2px solid var(--color-green)'
                      }}>
                        ✓ ACTIVE
                      </span>
                    )}
                    {!upload.locked && (
                      <button
                        onClick={() => startEdit(upload)}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          cursor: 'pointer',
                          padding: 0
                        }}
                      >
                        <Edit2 className="w-3 h-3" style={{ color: 'var(--text-secondary)' }} />
                      </button>
                    )}
                  </div>
                  
                  {/* Metadata Line */}
                  <div style={{
                    fontSize: '0.75rem',
                    color: 'var(--text-secondary)',
                    marginBottom: '0.5rem'
                  }}>
                    {formatDate(upload.timestamp)}
                    {upload.dateRange && (
                      <> · {formatDate(upload.dateRange.min)} → {formatDate(upload.dateRange.max)}</>
                    )}
                    {upload.proTimeData && (
                      <> · 📊 {upload.proTimeData.length} workdays</>
                    )}
                  </div>

                  {/* Load Button - Always visible */}
                  <button
                    onClick={() => onLoad(upload.id)}
                    style={{
                      width: '100%',
                      padding: '0.5rem',
                      background: upload.id === activeId ? 'var(--color-green)' : 'var(--bg-primary)',
                      border: upload.id === activeId ? '2px solid var(--color-green)' : '2px solid var(--border-primary)',
                      color: upload.id === activeId ? 'var(--color-black)' : 'var(--text-primary)',
                      cursor: 'pointer',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      letterSpacing: '0.1em',
                      textTransform: 'uppercase',
                      transition: 'all 100ms linear'
                    }}
                    onMouseEnter={(e) => {
                      if (upload.id === activeId) {
                        e.target.style.background = 'var(--bg-tertiary)';
                        e.target.style.color = 'var(--color-black)';
                        e.target.style.border = '2px solid var(--color-green)';
                      } else {
                        e.target.style.background = 'var(--text-primary)';
                        e.target.style.color = 'var(--bg-primary)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (upload.id === activeId) {
                        e.target.style.background = 'var(--color-green)';
                        e.target.style.color = 'var(--color-black)';
                        e.target.style.border = '2px solid var(--color-green)';
                      } else {
                        e.target.style.background = 'var(--bg-primary)';
                        e.target.style.color = 'var(--text-primary)';
                      }
                    }}
                  >
                    {upload.id === activeId ? '↻ RELOAD DATA' : 'LOAD DATA'}
                  </button>
                </div>
              )}
            </div>

            {/* Actions */}
            {editingId !== upload.id && (
              <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
                {/* Lock/Unlock Button */}
                <button
                  onClick={() => onToggleLock(upload.id)}
                  className="btn"
                  style={{
                    padding: '0.5rem',
                    minWidth: 'auto',
                    border: '2px solid var(--border-secondary)',
                    background: 'var(--bg-secondary)'
                  }}
                  title={upload.locked ? 'Unlock' : 'Lock'}
                >
                  {upload.locked ? (
                    <Unlock className="w-4 h-4" />
                  ) : (
                    <Lock className="w-4 h-4" />
                  )}
                </button>

                {/* Delete Button (only if unlocked) */}
                {!upload.locked && (
                  <button
                    onClick={() => handleDelete(upload)}
                    className="btn"
                    style={{
                      padding: '0.5rem',
                      minWidth: 'auto',
                      border: '2px solid var(--color-red)',
                      background: 'transparent'
                    }}
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" style={{ color: 'var(--color-red)' }} />
                  </button>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Storage Info */}
      {storageInfo && (
        <div style={{
          marginTop: '1rem',
          padding: '0.75rem',
          border: '2px solid var(--border-secondary)',
          background: 'var(--bg-secondary)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <span style={{
            fontSize: '0.75rem',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.05em'
          }}>
            Storage
          </span>
          <span style={{
            fontSize: '0.75rem',
            fontFamily: 'monospace'
          }}>
            {storageInfo.usedMB} / {storageInfo.totalMB} MB ({storageInfo.percentage}%)
          </span>
        </div>
      )}
    </div>
  );
}
