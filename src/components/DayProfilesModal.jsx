/**
 * DayProfilesModal.jsx
 * Full-screen modal overlay showing last 7 day profiles
 * 
 * Brutalist design:
 * - Solid black backdrop (90% opacity)
 * - Scrollable container with 7x DayProfileCard
 * - Simple close button (top-right X or ← Terug)
 */

import React from 'react';
import DayProfileCard from './DayProfileCard';
import { downloadDayProfilesHTML } from '../core/day-profiles-exporter';

export default function DayProfilesModal({ isOpen, onClose, dayProfiles, patientInfo = null }) {
  if (!isOpen) return null;

  return (
    <div 
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
        <div className="sticky top-0 z-10 flex justify-end gap-4 p-6 bg-black bg-opacity-90">
          {/* Close button - NOW FIRST */}
          <button
            onClick={onClose}
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

          {/* Print button - NOW SECOND */}
          <button
            onClick={() => {
              try {
                downloadDayProfilesHTML(dayProfiles, patientInfo);
              } catch (error) {
                console.error('Failed to export day profiles:', error);
                alert('Er is een fout opgetreden bij het exporteren van dagprofielen.');
              }
            }}
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
          {/* Title */}
          <div
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
            Dagprofielen - Laatste 7 dagen
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
