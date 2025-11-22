import React from 'react';
import { User } from 'lucide-react';
import { debug } from '../utils/debug.js';
import { APP_VERSION } from '../utils/version.js';

/**
 * AppHeader - Main application header component
 * 
 * Displays:
 * - App branding (AGP+ logo, version)
 * - Patient info button and summary
 * - Dataset status with indicator light
 * - Analysis period summary
 * - Data management (cleanup) button
 * - Migration and load toasts
 * 
 * @param {Object} props
 * @param {string} props.migrationStatus - Migration status message (optional)
 * @param {string} props.loadToast - Load success toast message (optional)
 * @param {Object} props.patientInfo - Patient info object
 * @param {Function} props.onPatientInfoOpen - Callback to open patient info modal
 * @param {Function} props.onDataManagementOpen - Callback to open data management modal
 * @param {Object} props.dataStatus - Dataset status object
 * @param {Date} props.startDate - Analysis period start date
 * @param {Date} props.endDate - Analysis period end date
 * @param {Array} props.activeReadings - Active glucose readings array
 * @param {Set} props.workdays - Set of ProTime workday dates
 */
const AppHeader = ({
  migrationStatus,
  loadToast,
  patientInfo,
  onPatientInfoOpen,
  onDataManagementOpen,
  dataStatus,
  startDate,
  endDate,
  activeReadings,
  workdays
}) => {
  return (
    <>
      {/* Migration Status Toast */}
      {migrationStatus && (
        <div style={{
          padding: '1rem',
          marginBottom: '1rem',
          background: 'var(--color-green)',
          color: 'var(--color-black)',
          fontWeight: 600,
          borderRadius: '4px',
          textAlign: 'center'
        }}>
          ✅ {migrationStatus} - Now using IndexedDB for unlimited storage!
        </div>
      )}

      {/* Load Success Toast */}
      {loadToast && (
        <div style={{
          padding: '1rem',
          marginBottom: '1rem',
          background: 'var(--color-green)',
          color: 'var(--color-black)',
          fontWeight: 700,
          letterSpacing: '0.05em',
          textTransform: 'uppercase',
          textAlign: 'center',
          border: '3px solid var(--color-black)',
          animation: 'slideDown 200ms ease-out'
        }}>
          {loadToast}
        </div>
      )}

      {/* Main Header */}
      <header className="section">
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1.618fr',
          border: '3px solid var(--ink)',
          overflow: 'hidden'
        }}>
          {/* LEFT: Sidebar - Ink background */}
          <div style={{
            background: 'var(--ink)',
            color: 'var(--paper)',
            padding: '2rem',
            borderRight: '3px solid var(--ink)',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.5rem'
          }}>
            {/* Version + Title */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div>
                <h1 style={{ 
                  letterSpacing: '0.2em', 
                  fontWeight: 700, 
                  fontSize: '1.75rem',
                  marginBottom: '0.25rem',
                  color: 'var(--paper)'
                }}>
                  AGP+
                </h1>
                <div style={{ 
                  fontSize: '0.875rem', 
                  color: 'var(--paper)',
                  fontWeight: 600,
                  opacity: 0.9
                }}>
                  v{APP_VERSION}
                </div>
              </div>
            </div>

            {/* Patient Button - Compact */}
            <button
              onClick={onPatientInfoOpen}
              style={{
                padding: '0.5rem 0.75rem',
                background: 'var(--color-green)',
                border: '2px solid var(--paper)',
                color: 'var(--paper)',
                cursor: 'pointer',
                fontSize: '0.625rem',
                fontWeight: 700,
                letterSpacing: '0.15em',
                textTransform: 'uppercase',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={(e) => {
                e.target.style.background = 'var(--paper)';
                e.target.style.color = 'var(--color-green)';
                e.target.style.borderColor = 'var(--color-green)';
              }}
              onMouseLeave={(e) => {
                e.target.style.background = 'var(--color-green)';
                e.target.style.color = 'var(--paper)';
                e.target.style.borderColor = 'var(--paper)';
              }}
            >
              <User size={12} />
              PATIËNT
            </button>

            {/* Patient Info Display */}
            {patientInfo && patientInfo.name && (
              <div style={{
                fontSize: '0.75rem',
                color: 'var(--paper)',
                opacity: 0.8,
                lineHeight: 1.6
              }}>
                <div style={{ fontWeight: 600, marginBottom: '0.25rem' }}>
                  {patientInfo.name}
                </div>
                {patientInfo.dob && (
                  <div>DOB: {new Date(patientInfo.dob).toLocaleDateString('nl-NL')}</div>
                )}
                {patientInfo.cgm && (
                  <div>CGM: {patientInfo.cgm}</div>
                )}
                {patientInfo.deviceSerial && (
                  <div>SN: {patientInfo.deviceSerial}</div>
                )}
              </div>
            )}
          </div>

          {/* RIGHT: Main info area - Paper background */}
          <div style={{
            background: 'var(--paper)',
            color: 'var(--ink)',
            padding: '2rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0'
          }}>
            {/* Top Section: Dataset overview + Cleanup button */}
            <div style={{ 
              paddingBottom: '1.5rem',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start'
            }}>
              <div style={{ flex: 1 }}>
                <div style={{
                  fontSize: '0.75rem',
                  color: 'var(--text-secondary)',
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  marginBottom: '0.5rem'
                }}>
                  Dataset
                </div>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem',
                  marginBottom: '0.5rem'
                }}>
                  {/* Status light */}
                  <div style={{
                    width: '20px',
                    height: '20px',
                    border: '3px solid var(--ink)',
                    background: dataStatus.lightColor === 'green' 
                      ? 'var(--color-green)' 
                      : dataStatus.lightColor === 'yellow' 
                      ? 'var(--color-yellow)' 
                      : 'var(--color-red)',
                    flexShrink: 0
                  }} />
                  <div style={{ 
                    fontWeight: 700, 
                    fontSize: '1.125rem',
                    letterSpacing: '0.05em' 
                  }}>
                    {dataStatus.hasData ? (
                      <>{dataStatus.readingCount.toLocaleString()} READINGS</>
                    ) : (
                      <>NO DATA</>
                    )}
                  </div>
                </div>
                {dataStatus.hasData && (
                  <div style={{ 
                    fontSize: '0.875rem',
                    color: 'var(--text-secondary)',
                    letterSpacing: '0.05em',
                    paddingLeft: '32px'
                  }}>
                    {dataStatus.dateRangeFormatted}
                  </div>
                )}
              </div>

              {/* CLEANUP button */}
              <button
                onClick={() => {
                  debug.log('[AppHeader] CLEANUP button clicked!');
                  debug.log('[AppHeader] dataStatus.hasData:', dataStatus.hasData);
                  onDataManagementOpen();
                }}
                disabled={!dataStatus.hasData}
                style={{
                  padding: '0.5rem 1rem',
                  border: '3px solid var(--ink)',
                  background: dataStatus.hasData ? 'var(--color-red)' : 'transparent',
                  color: dataStatus.hasData ? 'var(--color-white)' : 'var(--text-secondary)',
                  fontWeight: 700,
                  fontSize: '0.75rem',
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  cursor: dataStatus.hasData ? 'pointer' : 'not-allowed',
                  opacity: dataStatus.hasData ? 1 : 0.4,
                  whiteSpace: 'nowrap'
                }}
                title={!dataStatus.hasData ? "Load data first" : "Clean up database"}
              >
                🗑️ CLEANUP
              </button>
            </div>

            {/* Divider - Double line */}
            <div style={{
              borderTop: '3px solid var(--ink)',
              borderBottom: '3px solid var(--ink)',
              height: '2px',
              margin: '0'
            }} />

            {/* Bottom Section: Analysis period */}
            {startDate && endDate ? (
              <div style={{ paddingTop: '1.5rem' }}>
                <div style={{
                  fontSize: '0.75rem',
                  color: 'var(--text-secondary)',
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  marginBottom: '0.5rem'
                }}>
                  Analysis
                </div>
                <div style={{ 
                  fontWeight: 700,
                  fontSize: '1rem',
                  letterSpacing: '0.05em',
                  marginBottom: '0.5rem'
                }}>
                  {startDate.toLocaleDateString('nl-NL', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                  <span style={{ color: 'var(--color-orange)', margin: '0 0.5rem' }}>→</span>
                  {endDate.toLocaleDateString('nl-NL', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                </div>
                <div style={{ 
                  fontSize: '0.875rem',
                  color: 'var(--text-secondary)'
                }}>
                  <strong>{Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1}</strong> dagen
                  {activeReadings && <> • <strong>{activeReadings.length.toLocaleString()}</strong> readings</>}
                  {workdays && <> • <strong>{workdays.size}</strong> ProTime workdays</>}
                </div>
                {/* Last glucose reading timestamp */}
                {activeReadings && activeReadings.length > 0 && (() => {
                  const lastReading = activeReadings[activeReadings.length - 1];
                  if (lastReading?.date && lastReading?.time) {
                    return (
                      <div style={{ 
                        fontSize: '0.75rem',
                        color: 'var(--text-secondary)',
                        marginTop: '0.25rem'
                      }}>
                        Laatste meting: {lastReading.date.split('/').reverse().join('/')} {lastReading.time.substring(0, 5)}
                      </div>
                    );
                  }
                  return null;
                })()}
              </div>
            ) : (
              <div style={{ 
                paddingTop: '1.5rem',
                fontSize: '0.875rem',
                color: 'var(--text-secondary)',
                fontStyle: 'italic'
              }}>
                No analysis period selected
              </div>
            )}
          </div>
        </div>

        {/* Data Status Warning (Red/Yellow) - Below header when needed */}
        {dataStatus.actionRequired && (
          <div style={{
            padding: '0.75rem',
            marginTop: '1rem',
            background: dataStatus.lightColor === 'red' 
              ? 'var(--color-red)' 
              : 'var(--color-yellow)',
            border: '3px solid var(--color-black)',
            color: 'var(--color-black)',
            fontWeight: 700,
            fontSize: '0.875rem',
            letterSpacing: '0.05em',
            textAlign: 'center'
          }}>
            ⚠️ {dataStatus.message}
          </div>
        )}
      </header>
    </>
  );
};

export default AppHeader;
