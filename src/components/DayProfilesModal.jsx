/**
 * DayProfilesModal.jsx
 * Full-screen modal overlay showing last N day profiles
 * 
 * Brutalist design:
 * - Solid black backdrop (90% opacity)
 * - Scrollable container with NxDayProfileCard
 * - Toggle between 7 and 14 days
 * - Simple close button (top-right X or ← Terug)
 */

import React from 'react';
import DayProfileCard from './DayProfileCard';
import { downloadDayProfilesHTML } from '../core/day-profiles-exporter';

export default function DayProfilesModal({ 
  isOpen, 
  onClose, 
  dayProfiles, 
  patientInfo = null,
  numDays = 7,
  onChangeNumDays 
}) {
  if (!isOpen) return null;

  return (
    <div 
      role="dialog"
      aria-modal="true"
      aria-labelledby="day-profiles-modal-title"
      aria-describedby="day-profiles-modal-desc"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 9999,
        backgroundColor: 'rgba(0, 0, 0, 0.92)',
        overflow: 'hidden'
      }}
      onClick={onClose}
    >
      {/* Modal content container */}
      <div 
        style={{
          position: 'relative',
          height: '100%',
          overflowY: 'auto',
          overflowX: 'hidden'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Control buttons - top right, sticky */}
        <div 
          className="sticky top-0 z-10 flex justify-end gap-4 p-6 bg-black bg-opacity-90"
          role="toolbar"
          aria-label="Day profiles controls"
        >
          {/* Close button */}
          <button
            onClick={onClose}
            aria-label="Close day profiles modal"
            style={{
              fontFamily: 'Courier New, monospace',
              fontSize: '18px',
              fontWeight: 'bold',
              padding: '12px 24px',
              border: '3px solid var(--color-white)',
              backgroundColor: 'var(--color-black)',
              color: 'var(--color-white)',
              cursor: 'pointer',
              textTransform: 'uppercase',
              letterSpacing: '2px'
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = 'var(--color-white)';
              e.target.style.color = 'var(--color-black)';
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = 'var(--color-black)';
              e.target.style.color = 'var(--color-white)';
            }}
          >
            ← Sluiten
          </button>

          {/* Toggle: 7 or 14 days */}
          {onChangeNumDays && (
            <div 
              style={{ display: 'flex', gap: '0' }}
              role="group"
              aria-label="Number of days to display"
            >
              <button
                onClick={() => onChangeNumDays(7)}
                aria-label="Show 7 days"
                aria-pressed={numDays === 7}
                style={{
                  fontFamily: 'Courier New, monospace',
                  fontSize: '18px',
                  fontWeight: 'bold',
                  padding: '12px 24px',
                  border: '3px solid var(--color-white)',
                  borderRight: 'none',
                  backgroundColor: numDays === 7 ? 'var(--color-white)' : 'var(--color-black)',
                  color: numDays === 7 ? 'var(--color-black)' : 'var(--color-white)',
                  cursor: 'pointer',
                  textTransform: 'uppercase',
                  letterSpacing: '2px'
                }}
              >
                7D
              </button>
              <button
                onClick={() => onChangeNumDays(14)}
                aria-label="Show 14 days"
                aria-pressed={numDays === 14}
                style={{
                  fontFamily: 'Courier New, monospace',
                  fontSize: '18px',
                  fontWeight: 'bold',
                  padding: '12px 24px',
                  border: '3px solid var(--color-white)',
                  backgroundColor: numDays === 14 ? 'var(--color-white)' : 'var(--color-black)',
                  color: numDays === 14 ? 'var(--color-black)' : 'var(--color-white)',
                  cursor: 'pointer',
                  textTransform: 'uppercase',
                  letterSpacing: '2px'
                }}
              >
                14D
              </button>
            </div>
          )}

          {/* Print button */}
          <button
            onClick={() => {
              try {
                downloadDayProfilesHTML(dayProfiles, patientInfo);
              } catch (error) {
                console.error('Failed to export day profiles:', error);
                alert('Er is een fout opgetreden bij het exporteren van dagprofielen.');
              }
            }}
            aria-label="Print day profiles to HTML"
            style={{
              fontFamily: 'Courier New, monospace',
              fontSize: '18px',
              fontWeight: 'bold',
              padding: '12px 24px',
              border: '3px solid var(--color-white)',
              backgroundColor: 'var(--color-black)',
              color: 'var(--color-white)',
              cursor: 'pointer',
              textTransform: 'uppercase',
              letterSpacing: '2px'
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = 'var(--color-white)';
              e.target.style.color = 'var(--color-black)';
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = 'var(--color-black)';
              e.target.style.color = 'var(--color-white)';
            }}
          >
            🖨 Print
          </button>
        </div>

        {/* Day profiles container */}
        <div 
          style={{
            maxWidth: '1400px',
            margin: '0 auto',
            padding: '0 24px 48px'
          }}
        >
          {/* Screen reader description */}
          <p id="day-profiles-modal-desc" className="sr-only">
            Modal showing glucose day profiles for the last {numDays} days. Each profile shows glucose patterns, metrics, and events for a single day. Use toolbar at top to change number of days displayed or print the profiles.
          </p>

          {/* Title */}
          <div
            id="day-profiles-modal-title"
            className="day-profiles-title"
            style={{
              fontFamily: 'Courier New, monospace',
              fontSize: '32px',
              fontWeight: 'bold',
              color: 'var(--color-white)',
              textTransform: 'uppercase',
              letterSpacing: '3px',
              marginBottom: '48px',
              borderBottom: '3px solid var(--color-white)',
              paddingBottom: '16px'
            }}
          >
            Dagprofielen - Laatste {numDays} dagen
          </div>

          {/* Day cards - stacked vertically */}
          {dayProfiles && dayProfiles.length > 0 ? (
            <div className="day-profiles-container" style={{ display: 'flex', flexDirection: 'column', gap: '48px' }}>
              {dayProfiles.map((profile, index) => (
                <DayProfileCard key={profile.date} profile={profile} />
              ))}
            </div>
          ) : (
            <div
              style={{
                fontFamily: 'Courier New, monospace',
                fontSize: '18px',
                color: 'var(--text-tertiary)',
                textAlign: 'center',
                padding: '48px',
                border: '3px solid var(--border-secondary)',
                backgroundColor: 'var(--bg-card-dark)'
              }}
            >
              Geen volledige dagen beschikbaar. Upload meer data.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
