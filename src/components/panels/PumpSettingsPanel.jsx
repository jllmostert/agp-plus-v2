/**
 * PumpSettingsPanel
 * 
 * Displays and allows editing of MiniMed 780G pump settings.
 * Auto-detects settings from CSV uploads, allows manual override.
 * 
 * Features:
 * - Device info display
 * - Carb Ratio (CR) by time block
 * - Insulin Sensitivity Factor (ISF)
 * - Target glucose range
 * - Active Insulin Time (AIT)
 * - Basal profile
 * - TDD calculation with 500/1800 rule comparison
 */

import React, { useState, useEffect } from 'react';
import { 
  getPumpSettings, 
  savePumpSettings, 
  updatePumpSettings,
  calculateRecommendedSettings,
  clearPumpSettings,
  getDeviceHistory,
  archiveDevice,
  removeFromHistory
} from '../../storage/pumpSettingsStorage.js';

export default function PumpSettingsPanel() {
  const [settings, setSettings] = useState(null);
  const [editing, setEditing] = useState(false);
  const [editedSettings, setEditedSettings] = useState(null);
  const [deviceHistory, setDeviceHistory] = useState([]);
  const [showArchiveDialog, setShowArchiveDialog] = useState(false);
  const [archiveNotes, setArchiveNotes] = useState('');

  useEffect(() => {
    loadSettings();
    loadHistory();
  }, []);

  const loadSettings = () => {
    const loaded = getPumpSettings();
    setSettings(loaded);
    setEditedSettings(loaded);
  };

  const loadHistory = () => {
    const history = getDeviceHistory();
    setDeviceHistory(history);
  };

  const handleSave = () => {
    if (editedSettings) {
      // Set start date if this is a new device
      if (!editedSettings.device.startDate && editedSettings.device.serial) {
        editedSettings.device.startDate = new Date().toISOString();
      }
      editedSettings.meta.source = 'manual';
      savePumpSettings(editedSettings);
      setSettings(editedSettings);
      setEditing(false);
    }
  };

  const handleCancel = () => {
    setEditedSettings(settings);
    setEditing(false);
  };

  const handleArchiveDevice = () => {
    if (!settings?.device?.serial) {
      alert('Geen apparaat om te archiveren (serienummer ontbreekt)');
      return;
    }
    
    // Archive current device
    const success = archiveDevice(settings.device, new Date().toISOString(), archiveNotes);
    if (success) {
      // Clear current device settings
      clearPumpSettings();
      loadSettings();
      loadHistory();
      setShowArchiveDialog(false);
      setArchiveNotes('');
      alert('Apparaat gearchiveerd! Je kunt nu een nieuwe pomp configureren.');
    }
  };

  const handleRemoveFromHistory = (serial) => {
    if (confirm(`Weet je zeker dat je apparaat ${serial} uit de geschiedenis wilt verwijderen?`)) {
      removeFromHistory(serial);
      loadHistory();
    }
  };

  const handleClear = () => {
    if (confirm('Weet je zeker dat je alle pompinstellingen wilt wissen?')) {
      clearPumpSettings();
      loadSettings();
    }
  };

  if (!settings) {
    return (
      <div style={styles.container}>
        <div style={styles.loading}>Laden...</div>
      </div>
    );
  }

  const data = editing ? editedSettings : settings;
  const recommended = data.calculated?.recommended || {};

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <h2 style={styles.title}>⚙️ POMP INSTELLINGEN</h2>
        <div style={styles.headerButtons}>
          {!editing ? (
            <>
              <button style={styles.editButton} onClick={() => setEditing(true)}>
                BEWERKEN
              </button>
              <button style={styles.clearButton} onClick={handleClear}>
                WISSEN
              </button>
            </>
          ) : (
            <>
              <button style={styles.saveButton} onClick={handleSave}>
                OPSLAAN
              </button>
              <button style={styles.cancelButton} onClick={handleCancel}>
                ANNULEREN
              </button>
            </>
          )}
        </div>
      </div>

      {/* Source indicator */}
      <div style={styles.sourceBar}>
        <span style={styles.sourceLabel}>Bron:</span>
        <span style={styles.sourceValue}>
          {data.meta?.source === 'csv' ? '📄 CSV Import' : 
           data.meta?.source === 'manual' ? '✏️ Handmatig' : '⚙️ Standaard'}
        </span>
        {data.meta?.lastUpdated && (
          <span style={styles.lastUpdated}>
            (laatst bijgewerkt: {new Date(data.meta.lastUpdated).toLocaleDateString('nl-NL')})
          </span>
        )}
      </div>

      {/* Device Info */}
      <Section title="APPARAAT">
        <div style={styles.deviceGrid}>
          <InfoRow label="Model" value={data.device?.model || 'MiniMed 780G'} />
          <InfoRow label="Serienr" value={data.device?.serial || '-'} />
          <InfoRow label="Hardware" value={data.device?.hardwareVersion || '-'} />
          <InfoRow label="Firmware" value={data.device?.firmwareVersion || '-'} />
          {data.device?.transmitter && (
            <InfoRow label="CGM" value={data.device.transmitter} />
          )}
          {/* Transmitter Serial - manual entry */}
          <div style={styles.infoRow}>
            <span style={styles.infoLabel}>Transmitter:</span>
            {editing ? (
              <input
                type="text"
                value={editedSettings?.device?.transmitterSerial || ''}
                onChange={(e) => setEditedSettings({
                  ...editedSettings,
                  device: { ...editedSettings.device, transmitterSerial: e.target.value }
                })}
                placeholder="Serienummer transmitter"
                style={styles.inputText}
              />
            ) : (
              <span style={styles.infoValue}>
                {data.device?.transmitterSerial || '-'}
              </span>
            )}
          </div>
          {data.device?.startDate && (
            <InfoRow 
              label="In gebruik" 
              value={`sinds ${new Date(data.device.startDate).toLocaleDateString('nl-NL')}`} 
            />
          )}
        </div>
        
        {/* Archive device button */}
        {data.device?.serial && !editing && (
          <div style={styles.archiveBar}>
            <button 
              style={styles.archiveButton}
              onClick={() => setShowArchiveDialog(true)}
            >
              📦 ARCHIVEER APPARAAT
            </button>
            <span style={styles.archiveHint}>
              Gebruik dit voordat je een nieuwe pomp/transmitter gaat gebruiken
            </span>
          </div>
        )}
      </Section>

      {/* Device History */}
      {deviceHistory.length > 0 && (
        <Section title="APPARAAT GESCHIEDENIS" collapsed>
          <div style={styles.historyList}>
            {deviceHistory.map((device, i) => (
              <div key={i} style={styles.historyItem}>
                <div style={styles.historyHeader}>
                  <strong>{device.model || 'MiniMed 780G'}</strong>
                  <span style={styles.historySerial}>{device.serial}</span>
                </div>
                <div style={styles.historyDetails}>
                  <span>HW: {device.hardwareVersion || '-'}</span>
                  <span>FW: {device.firmwareVersion || '-'}</span>
                  {device.transmitterSerial && (
                    <span>Transmitter: {device.transmitterSerial}</span>
                  )}
                </div>
                <div style={styles.historyDates}>
                  {device.startDate && (
                    <span>Van: {new Date(device.startDate).toLocaleDateString('nl-NL')}</span>
                  )}
                  {device.endDate && (
                    <span>Tot: {new Date(device.endDate).toLocaleDateString('nl-NL')}</span>
                  )}
                </div>
                {device.notes && (
                  <div style={styles.historyNotes}>{device.notes}</div>
                )}
                <button 
                  style={styles.removeHistoryBtn}
                  onClick={() => handleRemoveFromHistory(device.serial)}
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Archive Dialog */}
      {showArchiveDialog && (
        <div style={styles.dialogOverlay}>
          <div style={styles.dialog}>
            <h3 style={styles.dialogTitle}>📦 Apparaat Archiveren</h3>
            <p style={styles.dialogText}>
              Je gaat dit apparaat archiveren:<br/>
              <strong>{data.device?.model}</strong> ({data.device?.serial})
            </p>
            <div style={styles.dialogField}>
              <label>Notities (optioneel):</label>
              <textarea
                value={archiveNotes}
                onChange={(e) => setArchiveNotes(e.target.value)}
                placeholder="Bijv. 'Teruggestuurd voor vervanging'"
                style={styles.dialogTextarea}
              />
            </div>
            <div style={styles.dialogButtons}>
              <button 
                style={styles.dialogCancel}
                onClick={() => setShowArchiveDialog(false)}
              >
                ANNULEREN
              </button>
              <button 
                style={styles.dialogConfirm}
                onClick={handleArchiveDevice}
              >
                ARCHIVEREN
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TDD & Recommendations */}
      <Section title="TDD & AANBEVELINGEN">
        <div style={styles.tddGrid}>
          <div style={styles.tddBox}>
            <div style={styles.tddLabel}>Gem. TDD</div>
            <div style={styles.tddValue}>
              {data.calculated?.tdd ? `${data.calculated.tdd} U` : '-'}
            </div>
            <div style={styles.tddDetail}>
              Bolus: {data.calculated?.tddBolus || '-'} U | 
              Basaal: {data.calculated?.tddBasal || '-'} U
            </div>
          </div>
          <div style={styles.recommendBox}>
            <div style={styles.recommendLabel}>500-regel CR</div>
            <div style={styles.recommendValue}>
              {recommended.cr ? `${recommended.cr} g/U` : '-'}
            </div>
          </div>
          <div style={styles.recommendBox}>
            <div style={styles.recommendLabel}>1800-regel ISF</div>
            <div style={styles.recommendValue}>
              {recommended.isf ? `${recommended.isf} mg/dL/U` : '-'}
            </div>
          </div>
        </div>
      </Section>

      {/* Carb Ratios */}
      <Section title="KOOLHYDRAATRATIO (CR)">
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Vanaf</th>
              <th style={styles.th}>Ratio (g/U)</th>
              <th style={styles.th}>vs 500-regel</th>
            </tr>
          </thead>
          <tbody>
            {data.carbRatios?.map((block, i) => {
              const diff = recommended.cr ? block.ratio - recommended.cr : null;
              return (
                <tr key={i}>
                  <td style={styles.td}>{block.startTime}</td>
                  <td style={styles.td}>
                    {editing ? (
                      <input
                        type="number"
                        step="0.5"
                        value={block.ratio}
                        onChange={(e) => {
                          const newRatios = [...editedSettings.carbRatios];
                          newRatios[i] = { ...block, ratio: parseFloat(e.target.value) };
                          setEditedSettings({ ...editedSettings, carbRatios: newRatios });
                        }}
                        style={styles.input}
                      />
                    ) : (
                      <strong>{block.ratio}</strong>
                    )}
                  </td>
                  <td style={{...styles.td, ...getDiffStyle(diff, true)}}>
                    {diff !== null ? (diff > 0 ? `+${diff.toFixed(1)}` : diff.toFixed(1)) : '-'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Section>

      {/* ISF */}
      <Section title="INSULINEGEVOELIGHEID (ISF)">
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Vanaf</th>
              <th style={styles.th}>Factor (mg/dL/U)</th>
              <th style={styles.th}>vs 1800-regel</th>
            </tr>
          </thead>
          <tbody>
            {data.insulinSensitivity?.map((block, i) => {
              const diff = recommended.isf ? block.factor - recommended.isf : null;
              return (
                <tr key={i}>
                  <td style={styles.td}>{block.startTime}</td>
                  <td style={styles.td}>
                    {editing ? (
                      <input
                        type="number"
                        step="1"
                        value={block.factor}
                        onChange={(e) => {
                          const newISF = [...editedSettings.insulinSensitivity];
                          newISF[i] = { ...block, factor: parseInt(e.target.value) };
                          setEditedSettings({ ...editedSettings, insulinSensitivity: newISF });
                        }}
                        style={styles.input}
                      />
                    ) : (
                      <strong>{block.factor}</strong>
                    )}
                  </td>
                  <td style={{...styles.td, ...getDiffStyle(diff, false)}}>
                    {diff !== null ? (diff > 0 ? `+${diff}` : diff) : '-'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Section>

      {/* Target Glucose */}
      <Section title="DOELGLUCOSE">
        {/* SmartGuard Target - most important, not from CSV */}
        <div style={styles.smartGuardBox}>
          <div style={styles.smartGuardRow}>
            <span style={styles.smartGuardLabel}>🎯 SmartGuard Target</span>
            {editing ? (
              <select
                value={editedSettings.smartGuardTarget || 100}
                onChange={(e) => setEditedSettings({
                  ...editedSettings,
                  smartGuardTarget: parseInt(e.target.value)
                })}
                style={styles.selectLarge}
              >
                <option value={100}>100 mg/dL (Agressief)</option>
                <option value={110}>110 mg/dL (Gemiddeld)</option>
                <option value={120}>120 mg/dL (Conservatief)</option>
              </select>
            ) : (
              <span style={styles.smartGuardValue}>{data.smartGuardTarget || 100} mg/dL</span>
            )}
          </div>
          <div style={styles.smartGuardNote}>
            ⚠️ Handmatig instellen - niet in CSV export
          </div>
        </div>
        
        {/* BWZ Target (Manual Mode) */}
        <div style={styles.bwzNote}>BWZ Target (Manual Mode - uit CSV):</div>
        <div style={styles.targetGrid}>
          <div style={styles.targetBox}>
            <div style={styles.targetLabel}>Laag</div>
            {editing ? (
              <input
                type="number"
                value={editedSettings.targetGlucose?.low || 90}
                onChange={(e) => setEditedSettings({
                  ...editedSettings,
                  targetGlucose: { ...editedSettings.targetGlucose, low: parseInt(e.target.value) }
                })}
                style={styles.inputLarge}
              />
            ) : (
              <div style={styles.targetValue}>{data.targetGlucose?.low || 90}</div>
            )}
            <div style={styles.targetUnit}>mg/dL</div>
          </div>
          <div style={styles.targetBox}>
            <div style={styles.targetLabel}>Hoog</div>
            {editing ? (
              <input
                type="number"
                value={editedSettings.targetGlucose?.high || 120}
                onChange={(e) => setEditedSettings({
                  ...editedSettings,
                  targetGlucose: { ...editedSettings.targetGlucose, high: parseInt(e.target.value) }
                })}
                style={styles.inputLarge}
              />
            ) : (
              <div style={styles.targetValue}>{data.targetGlucose?.high || 120}</div>
            )}
            <div style={styles.targetUnit}>mg/dL</div>
          </div>
          <div style={styles.targetBox}>
            <div style={styles.targetLabel}>AIT</div>
            {editing ? (
              <input
                type="number"
                step="0.5"
                min="2"
                max="8"
                value={editedSettings.activeInsulinTime || 2}
                onChange={(e) => setEditedSettings({
                  ...editedSettings,
                  activeInsulinTime: parseFloat(e.target.value)
                })}
                style={styles.inputLarge}
              />
            ) : (
              <div style={styles.targetValue}>{data.activeInsulinTime || 2}</div>
            )}
            <div style={styles.targetUnit}>uur</div>
          </div>
        </div>
      </Section>

      {/* Basal Profile */}
      <Section title="BASAALPROFIEL" collapsed>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Vanaf</th>
              <th style={styles.th}>Snelheid (U/h)</th>
            </tr>
          </thead>
          <tbody>
            {data.basalProfile?.map((block, i) => (
              <tr key={i}>
                <td style={styles.td}>{block.startTime}</td>
                <td style={styles.td}>
                  {editing ? (
                    <input
                      type="number"
                      step="0.05"
                      value={block.rate}
                      onChange={(e) => {
                        const newBasal = [...editedSettings.basalProfile];
                        newBasal[i] = { ...block, rate: parseFloat(e.target.value) };
                        setEditedSettings({ ...editedSettings, basalProfile: newBasal });
                      }}
                      style={styles.input}
                    />
                  ) : (
                    <strong>{block.rate}</strong>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Section>
    </div>
  );
}

// Helper Components
function Section({ title, children, collapsed = false }) {
  const [isCollapsed, setIsCollapsed] = useState(collapsed);
  
  return (
    <div style={styles.section}>
      <div 
        style={styles.sectionHeader} 
        onClick={() => setIsCollapsed(!isCollapsed)}
      >
        <span style={styles.sectionTitle}>{title}</span>
        <span style={styles.collapseIcon}>{isCollapsed ? '▼' : '▲'}</span>
      </div>
      {!isCollapsed && <div style={styles.sectionContent}>{children}</div>}
    </div>
  );
}

function InfoRow({ label, value }) {
  return (
    <div style={styles.infoRow}>
      <span style={styles.infoLabel}>{label}:</span>
      <span style={styles.infoValue}>{value}</span>
    </div>
  );
}

function getDiffStyle(diff, higherIsBetter) {
  if (diff === null) return {};
  const isGood = higherIsBetter ? diff >= 0 : diff <= 0;
  return {
    color: Math.abs(diff) < 1 ? 'var(--text-secondary)' : 
           isGood ? 'var(--color-green)' : 'var(--color-red)',
    fontWeight: Math.abs(diff) >= 2 ? 'bold' : 'normal',
  };
}

// Styles
const styles = {
  container: {
    fontFamily: 'var(--font-mono)',
    backgroundColor: 'var(--paper)',
    color: 'var(--ink)',
    padding: '1rem',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: '3px solid var(--ink)',
    paddingBottom: '0.5rem',
    marginBottom: '1rem',
  },
  title: {
    margin: 0,
    fontSize: '1.25rem',
    fontWeight: 'bold',
  },
  headerButtons: {
    display: 'flex',
    gap: '0.5rem',
  },
  editButton: {
    padding: '0.5rem 1rem',
    backgroundColor: 'var(--ink)',
    color: 'var(--paper)',
    border: '2px solid var(--ink)',
    fontFamily: 'var(--font-mono)',
    fontWeight: 'bold',
    cursor: 'pointer',
  },
  clearButton: {
    padding: '0.5rem 1rem',
    backgroundColor: 'transparent',
    color: 'var(--color-red)',
    border: '2px solid var(--color-red)',
    fontFamily: 'var(--font-mono)',
    fontWeight: 'bold',
    cursor: 'pointer',
  },
  saveButton: {
    padding: '0.5rem 1rem',
    backgroundColor: 'var(--color-green)',
    color: 'white',
    border: '2px solid var(--color-green)',
    fontFamily: 'var(--font-mono)',
    fontWeight: 'bold',
    cursor: 'pointer',
  },
  cancelButton: {
    padding: '0.5rem 1rem',
    backgroundColor: 'transparent',
    color: 'var(--ink)',
    border: '2px solid var(--ink)',
    fontFamily: 'var(--font-mono)',
    fontWeight: 'bold',
    cursor: 'pointer',
  },
  sourceBar: {
    display: 'flex',
    gap: '0.5rem',
    alignItems: 'center',
    padding: '0.5rem',
    backgroundColor: 'var(--bg-secondary)',
    marginBottom: '1rem',
    fontSize: '0.85rem',
  },
  sourceLabel: {
    fontWeight: 'bold',
  },
  sourceValue: {
    color: 'var(--text-secondary)',
  },
  lastUpdated: {
    color: 'var(--text-secondary)',
    fontSize: '0.8rem',
  },
  loading: {
    padding: '2rem',
    textAlign: 'center',
    color: 'var(--text-secondary)',
  },
  section: {
    marginBottom: '1rem',
    border: '2px solid var(--ink)',
  },
  sectionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '0.5rem 1rem',
    backgroundColor: 'var(--bg-secondary)',
    cursor: 'pointer',
    userSelect: 'none',
  },
  sectionTitle: {
    fontWeight: 'bold',
    fontSize: '0.9rem',
  },
  collapseIcon: {
    fontSize: '0.75rem',
  },
  sectionContent: {
    padding: '1rem',
  },
  deviceGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '0.5rem',
  },
  infoRow: {
    display: 'flex',
    gap: '0.5rem',
  },
  infoLabel: {
    color: 'var(--text-secondary)',
    minWidth: '80px',
  },
  infoValue: {
    fontWeight: 'bold',
  },
  tddGrid: {
    display: 'grid',
    gridTemplateColumns: '1.5fr 1fr 1fr',
    gap: '1rem',
  },
  tddBox: {
    padding: '1rem',
    backgroundColor: 'var(--ink)',
    color: 'var(--paper)',
    textAlign: 'center',
  },
  tddLabel: {
    fontSize: '0.75rem',
    opacity: 0.8,
    marginBottom: '0.25rem',
  },
  tddValue: {
    fontSize: '1.5rem',
    fontWeight: 'bold',
  },
  tddDetail: {
    fontSize: '0.7rem',
    opacity: 0.7,
    marginTop: '0.25rem',
  },
  recommendBox: {
    padding: '1rem',
    border: '2px solid var(--ink)',
    textAlign: 'center',
  },
  recommendLabel: {
    fontSize: '0.75rem',
    color: 'var(--text-secondary)',
    marginBottom: '0.25rem',
  },
  recommendValue: {
    fontSize: '1.25rem',
    fontWeight: 'bold',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
  },
  th: {
    textAlign: 'left',
    padding: '0.5rem',
    borderBottom: '2px solid var(--ink)',
    fontSize: '0.8rem',
    fontWeight: 'bold',
  },
  td: {
    padding: '0.5rem',
    borderBottom: '1px solid var(--grid-line)',
  },
  input: {
    width: '80px',
    padding: '0.25rem',
    border: '2px solid var(--ink)',
    fontFamily: 'var(--font-mono)',
    fontSize: '1rem',
    fontWeight: 'bold',
  },
  inputLarge: {
    width: '80px',
    padding: '0.5rem',
    border: '2px solid var(--ink)',
    fontFamily: 'var(--font-mono)',
    fontSize: '1.25rem',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  targetGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '1rem',
  },
  targetBox: {
    textAlign: 'center',
    padding: '1rem',
    border: '2px solid var(--ink)',
  },
  targetLabel: {
    fontSize: '0.8rem',
    color: 'var(--text-secondary)',
    marginBottom: '0.5rem',
  },
  targetValue: {
    fontSize: '2rem',
    fontWeight: 'bold',
  },
  targetUnit: {
    fontSize: '0.75rem',
    color: 'var(--text-secondary)',
    marginTop: '0.25rem',
  },
  smartGuardBox: {
    backgroundColor: 'var(--ink)',
    color: 'var(--paper)',
    padding: '1rem',
    marginBottom: '1rem',
  },
  smartGuardRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '1rem',
  },
  smartGuardLabel: {
    fontSize: '1rem',
    fontWeight: 'bold',
  },
  smartGuardValue: {
    fontSize: '1.5rem',
    fontWeight: 'bold',
    color: 'var(--color-green)',
  },
  smartGuardNote: {
    fontSize: '0.75rem',
    opacity: 0.7,
    marginTop: '0.5rem',
  },
  selectLarge: {
    padding: '0.5rem',
    border: '2px solid var(--paper)',
    fontFamily: 'var(--font-mono)',
    fontSize: '1rem',
    fontWeight: 'bold',
    backgroundColor: 'var(--paper)',
    color: 'var(--ink)',
  },
  bwzNote: {
    fontSize: '0.8rem',
    color: 'var(--text-secondary)',
    marginBottom: '0.5rem',
    fontStyle: 'italic',
  },
  inputText: {
    flex: 1,
    padding: '0.25rem 0.5rem',
    border: '2px solid var(--ink)',
    fontFamily: 'var(--font-mono)',
    fontSize: '0.9rem',
  },
  archiveBar: {
    marginTop: '1rem',
    paddingTop: '1rem',
    borderTop: '1px solid var(--grid-line)',
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
  },
  archiveButton: {
    padding: '0.5rem 1rem',
    backgroundColor: 'var(--color-orange)',
    color: 'white',
    border: '2px solid var(--color-orange)',
    fontFamily: 'var(--font-mono)',
    fontWeight: 'bold',
    cursor: 'pointer',
  },
  archiveHint: {
    fontSize: '0.75rem',
    color: 'var(--text-secondary)',
    fontStyle: 'italic',
  },
  historyList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
  },
  historyItem: {
    padding: '0.75rem',
    border: '2px solid var(--grid-line)',
    position: 'relative',
  },
  historyHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '0.5rem',
  },
  historySerial: {
    fontFamily: 'var(--font-mono)',
    color: 'var(--text-secondary)',
  },
  historyDetails: {
    display: 'flex',
    gap: '1rem',
    fontSize: '0.8rem',
    color: 'var(--text-secondary)',
  },
  historyDates: {
    display: 'flex',
    gap: '1rem',
    fontSize: '0.8rem',
    marginTop: '0.25rem',
  },
  historyNotes: {
    fontSize: '0.8rem',
    fontStyle: 'italic',
    color: 'var(--text-secondary)',
    marginTop: '0.5rem',
  },
  removeHistoryBtn: {
    position: 'absolute',
    top: '0.5rem',
    right: '0.5rem',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    color: 'var(--color-red)',
    fontSize: '1rem',
  },
  dialogOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  dialog: {
    backgroundColor: 'var(--paper)',
    padding: '1.5rem',
    border: '3px solid var(--ink)',
    maxWidth: '400px',
    width: '90%',
  },
  dialogTitle: {
    margin: '0 0 1rem 0',
    fontSize: '1.25rem',
  },
  dialogText: {
    marginBottom: '1rem',
    lineHeight: 1.5,
  },
  dialogField: {
    marginBottom: '1rem',
  },
  dialogTextarea: {
    width: '100%',
    minHeight: '80px',
    padding: '0.5rem',
    border: '2px solid var(--ink)',
    fontFamily: 'var(--font-mono)',
    fontSize: '0.9rem',
    marginTop: '0.5rem',
    resize: 'vertical',
  },
  dialogButtons: {
    display: 'flex',
    gap: '0.75rem',
    justifyContent: 'flex-end',
  },
  dialogCancel: {
    padding: '0.5rem 1rem',
    backgroundColor: 'transparent',
    color: 'var(--ink)',
    border: '2px solid var(--ink)',
    fontFamily: 'var(--font-mono)',
    fontWeight: 'bold',
    cursor: 'pointer',
  },
  dialogConfirm: {
    padding: '0.5rem 1rem',
    backgroundColor: 'var(--color-orange)',
    color: 'white',
    border: '2px solid var(--color-orange)',
    fontFamily: 'var(--font-mono)',
    fontWeight: 'bold',
    cursor: 'pointer',
  },
};
