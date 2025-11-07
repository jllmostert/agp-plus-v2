/**
 * DataExportModal.jsx
 * 
 * Modal for selecting which data categories to export in JSON format.
 * Implements feature mask for selective data export.
 * 
 * @version 3.8.0
 * @created 2025-11-07
 */

import React, { useState } from 'react';

const EXPORT_FEATURES = [
  { id: 'glucose_readings', label: 'Glucose Readings', description: 'All CGM sensor readings', defaultChecked: true },
  { id: 'sensors', label: 'Sensor Changes', description: 'Guardian 4 sensor replacement history', defaultChecked: true },
  { id: 'cartridges', label: 'Cartridge Changes', description: 'Insulin reservoir replacement history', defaultChecked: true },
  { id: 'insulin_delivery', label: 'Insulin Delivery', description: 'Basal rates and bolus doses', defaultChecked: true },
  { id: 'bg_readings', label: 'BG Readings', description: 'Fingerstick blood glucose tests', defaultChecked: false },
  { id: 'protime_workdays', label: 'ProTime Data', description: 'Work schedule from ProTime cards', defaultChecked: false },
  { id: 'patient_info', label: 'Patient Info', description: 'Name, DOB, physician, device settings', defaultChecked: false },
];

export default function DataExportModal({ isOpen, onClose, onConfirm }) {
  const [selectedFeatures, setSelectedFeatures] = useState(
    EXPORT_FEATURES.reduce((acc, feature) => {
      acc[feature.id] = feature.defaultChecked;
      return acc;
    }, {})
  );

  const handleToggle = (featureId) => {
    setSelectedFeatures(prev => ({
      ...prev,
      [featureId]: !prev[featureId]
    }));
  };

  const handleSelectAll = () => {
    setSelectedFeatures(
      EXPORT_FEATURES.reduce((acc, feature) => {
        acc[feature.id] = true;
        return acc;
      }, {})
    );
  };

  const handleSelectNone = () => {
    setSelectedFeatures(
      EXPORT_FEATURES.reduce((acc, feature) => {
        acc[feature.id] = false;
        return acc;
      }, {})
    );
  };

  const handleConfirm = () => {
    onConfirm(selectedFeatures);
    onClose();
  };

  const selectedCount = Object.values(selectedFeatures).filter(Boolean).length;

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
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}
      onClick={onClose}
    >
      <div 
        style={{
          background: 'var(--bg-primary)',
          border: '3px solid var(--border-primary)',
          maxWidth: '600px',
          width: '90%',
          maxHeight: '80vh',
          overflow: 'auto',
          padding: '2rem'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ marginBottom: '1.5rem' }}>
          <h2 style={{
            fontFamily: 'Courier New, monospace',
            fontSize: '1.5rem',
            fontWeight: 'bold',
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            marginBottom: '0.5rem'
          }}>
            💾 Export Database (JSON)
          </h2>
          <p style={{
            fontFamily: 'Courier New, monospace',
            fontSize: '0.875rem',
            color: 'var(--text-secondary)',
            lineHeight: 1.5
          }}>
            Select which data categories to include in the export file.
          </p>
        </div>

        {/* Quick Actions */}
        <div style={{ 
          display: 'flex', 
          gap: '0.5rem', 
          marginBottom: '1rem',
          paddingBottom: '1rem',
          borderBottom: '2px solid var(--border-secondary)'
        }}>
          <button
            onClick={handleSelectAll}
            style={{
              flex: 1,
              padding: '0.5rem 1rem',
              background: 'var(--bg-secondary)',
              border: '2px solid var(--border-primary)',
              color: 'var(--text-primary)',
              fontFamily: 'Courier New, monospace',
              fontSize: '0.75rem',
              fontWeight: 'bold',
              textTransform: 'uppercase',
              cursor: 'pointer'
            }}
          >
            Select All
          </button>
          <button
            onClick={handleSelectNone}
            style={{
              flex: 1,
              padding: '0.5rem 1rem',
              background: 'var(--bg-secondary)',
              border: '2px solid var(--border-primary)',
              color: 'var(--text-primary)',
              fontFamily: 'Courier New, monospace',
              fontSize: '0.75rem',
              fontWeight: 'bold',
              textTransform: 'uppercase',
              cursor: 'pointer'
            }}
          >
            Select None
          </button>
        </div>

        {/* Feature Checkboxes */}
        <div style={{ marginBottom: '1.5rem' }}>
          {EXPORT_FEATURES.map((feature) => (
            <label
              key={feature.id}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '0.75rem',
                padding: '0.75rem',
                marginBottom: '0.5rem',
                background: selectedFeatures[feature.id] ? 'var(--bg-secondary)' : 'transparent',
                border: '2px solid',
                borderColor: selectedFeatures[feature.id] ? 'var(--border-primary)' : 'var(--border-secondary)',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              <input
                type="checkbox"
                checked={selectedFeatures[feature.id]}
                onChange={() => handleToggle(feature.id)}
                style={{
                  width: '18px',
                  height: '18px',
                  cursor: 'pointer',
                  marginTop: '2px'
                }}
              />
              <div style={{ flex: 1 }}>
                <div style={{
                  fontFamily: 'Courier New, monospace',
                  fontSize: '0.875rem',
                  fontWeight: 'bold',
                  marginBottom: '0.25rem'
                }}>
                  {feature.label}
                </div>
                <div style={{
                  fontFamily: 'Courier New, monospace',
                  fontSize: '0.75rem',
                  color: 'var(--text-secondary)',
                  lineHeight: 1.4
                }}>
                  {feature.description}
                </div>
              </div>
            </label>
          ))}
        </div>

        {/* Summary */}
        <div style={{
          padding: '1rem',
          background: 'var(--bg-secondary)',
          border: '2px solid var(--border-primary)',
          marginBottom: '1.5rem'
        }}>
          <div style={{
            fontFamily: 'Courier New, monospace',
            fontSize: '0.75rem',
            fontWeight: 'bold',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            marginBottom: '0.5rem'
          }}>
            Export Summary
          </div>
          <div style={{
            fontFamily: 'Courier New, monospace',
            fontSize: '0.875rem'
          }}>
            {selectedCount} of {EXPORT_FEATURES.length} categories selected
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button
            onClick={onClose}
            style={{
              flex: 1,
              padding: '0.75rem 1.5rem',
              background: 'var(--bg-secondary)',
              border: '2px solid var(--border-primary)',
              color: 'var(--text-primary)',
              fontFamily: 'Courier New, monospace',
              fontSize: '0.875rem',
              fontWeight: 'bold',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              cursor: 'pointer'
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={selectedCount === 0}
            style={{
              flex: 1,
              padding: '0.75rem 1.5rem',
              background: selectedCount > 0 ? 'var(--color-black)' : 'var(--bg-secondary)',
              border: '2px solid var(--border-primary)',
              color: selectedCount > 0 ? 'var(--color-white)' : 'var(--text-secondary)',
              fontFamily: 'Courier New, monospace',
              fontSize: '0.875rem',
              fontWeight: 'bold',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              cursor: selectedCount > 0 ? 'pointer' : 'not-allowed',
              opacity: selectedCount > 0 ? 1 : 0.5
            }}
          >
            💾 Export ({selectedCount})
          </button>
        </div>
      </div>
    </div>
  );
}
