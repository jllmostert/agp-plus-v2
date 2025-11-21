import React, { useState, useEffect } from 'react';
import { User, Mail, Calendar, Stethoscope, Activity, Save, X, Lock, Unlock } from 'lucide-react';
import { patientStorage } from '../utils/patientStorage';

/**
 * PatientInfo - Patient Information Management
 * 
 * One-time entry form for patient demographics stored in IndexedDB.
 * Used in HTML export headers and as clinical context.
 * 
 * Fields:
 * - Name (Achternaam, Voornaam)
 * - Email
 * - Date of Birth
 * - Physician
 * - CGM Device
 * 
 * @version 2.1.2
 */
export default function PatientInfo({ onClose, isModal = false }) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    dob: '',
    physician: '',
    cgm: '',
    deviceSerial: '',
    device: '',
    isLocked: false
  });
  
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isLocked, setIsLocked] = useState(false);

  useEffect(() => {
    // Load existing patient info
    const loadPatientInfo = async () => {
      try {
        const info = await patientStorage.get();
        console.log('[PatientInfo] Loaded from storage:', info);
        if (info) {
          setFormData(info);
          setIsLocked(info.isLocked === true);
          console.log('[PatientInfo] isLocked set to:', info.isLocked === true);
        }
      } catch (err) {
        console.error('Failed to load patient info:', err);
      }
    };
    loadPatientInfo();
  }, []);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setSaveSuccess(false);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await patientStorage.save({ ...formData, isLocked });
      setSaveSuccess(true);
      setTimeout(() => {
        if (onClose) onClose();
      }, 1000);
    } catch (err) {
      console.error('Failed to save patient info:', err);
      alert('Failed to save patient information. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleLock = async () => {
    const newLockState = !isLocked;
    console.log('[PatientInfo] Toggling lock to:', newLockState);
    setIsLocked(newLockState);
    setFormData(prev => ({ ...prev, isLocked: newLockState }));
    try {
      await patientStorage.setLocked(newLockState);
      console.log('[PatientInfo] Lock state saved successfully');
    } catch (err) {
      console.error('Failed to toggle lock:', err);
    }
  };

  const containerStyle = isModal ? {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0, 0, 0, 0.9)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: '2rem'
  } : {};

  const cardStyle = isModal ? {
    background: 'var(--bg-secondary)',
    border: '2px solid var(--text-primary)',
    maxWidth: '600px',
    width: '100%',
    maxHeight: '90vh',
    overflow: 'auto'
  } : {};

  return (
    <div style={containerStyle}>
      <div className="card" style={cardStyle}>
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '2rem',
          paddingBottom: '1rem',
          borderBottom: '2px solid var(--text-primary)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <User style={{ width: '24px', height: '24px' }} />
            <h2 style={{
              fontSize: '1.5rem',
              fontWeight: 700,
              letterSpacing: '0.05em',
              textTransform: 'uppercase'
            }}>
              Patient Information
            </h2>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {/* Lock Toggle */}
            <button
              onClick={handleToggleLock}
              title={isLocked ? 'CSV overschrijft niet (klik om te ontgrendelen)' : 'CSV kan overschrijven (klik om te vergrendelen)'}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem',
                padding: '0.5rem 0.75rem',
                background: isLocked ? 'var(--color-green)' : 'transparent',
                color: isLocked ? 'white' : 'var(--text-primary)',
                border: '2px solid var(--text-primary)',
                cursor: 'pointer',
                fontSize: '0.75rem',
                fontWeight: 700,
                letterSpacing: '0.05em',
                transition: 'all 0.2s'
              }}
            >
              {isLocked ? <Lock style={{ width: '14px', height: '14px' }} /> : <Unlock style={{ width: '14px', height: '14px' }} />}
              {isLocked ? 'VERGRENDELD' : 'OPEN'}
            </button>
            {isModal && (
            <button
              onClick={onClose}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-primary)',
                cursor: 'pointer',
                padding: '0.5rem'
              }}
            >
              <X style={{ width: '24px', height: '24px' }} />
            </button>
            )}
          </div>
        </div>

        {/* Form Fields */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Name */}
          <FormField
            icon={User}
            label="Full Name"
            placeholder="Achternaam, Voornaam"
            value={formData.name}
            onChange={(val) => handleChange('name', val)}
            helpText="Format: LASTNAME, Firstname"
          />

          {/* Email */}
          <FormField
            icon={Mail}
            label="Email"
            type="email"
            placeholder="patient@example.com"
            value={formData.email}
            onChange={(val) => handleChange('email', val)}
            helpText="Optional - for contact purposes"
          />

          {/* Date of Birth */}
          <FormField
            icon={Calendar}
            label="Date of Birth"
            type="date"
            value={formData.dob}
            onChange={(val) => handleChange('dob', val)}
            helpText="Used for age calculation in reports"
          />

          {/* Physician */}
          <FormField
            icon={Stethoscope}
            label="Physician"
            placeholder="Dr. Name"
            value={formData.physician}
            onChange={(val) => handleChange('physician', val)}
            helpText="Treating physician or endocrinologist"
          />

          {/* CGM Device */}
          <FormField
            icon={Activity}
            label="CGM Device"
            placeholder="e.g., Guardian 4 Sensor"
            value={formData.cgm}
            onChange={(val) => handleChange('cgm', val)}
            helpText="Sensor model (auto-filled from CSV)"
          />

          {/* Device Serial Number */}
          <FormField
            icon={Activity}
            label="Device Serial Number"
            placeholder="e.g., NG4114235H"
            value={formData.deviceSerial}
            onChange={(val) => handleChange('deviceSerial', val)}
            helpText="Pump serial number (auto-filled from CSV)"
          />

          {/* Pump Device */}
          <FormField
            icon={Activity}
            label="Pump Device"
            placeholder="e.g., MiniMed 780G MMT-1886"
            value={formData.device}
            onChange={(val) => handleChange('device', val)}
            helpText="Pump model (auto-filled from CSV)"
          />
        </div>

        {/* Save Button */}
        <div style={{ marginTop: '2rem', paddingTop: '2rem', borderTop: '2px solid var(--text-primary)' }}>
          <button
            onClick={handleSave}
            disabled={isSaving || !formData.name}
            style={{
              width: '100%',
              padding: '1rem',
              background: saveSuccess ? 'var(--color-green)' : 'var(--text-primary)',
              color: saveSuccess ? 'var(--color-black)' : 'var(--bg-primary)',
              border: 'none',
              fontSize: '0.875rem',
              fontWeight: 700,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              cursor: isSaving || !formData.name ? 'not-allowed' : 'pointer',
              opacity: isSaving || !formData.name ? 0.5 : 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              transition: 'all 0.2s'
            }}
          >
            <Save style={{ width: '18px', height: '18px' }} />
            {saveSuccess ? 'Saved Successfully!' : isSaving ? 'Saving...' : 'Save Patient Information'}
          </button>
          
          {!formData.name && (
            <p style={{
              marginTop: '0.75rem',
              fontSize: '0.75rem',
              color: 'var(--text-secondary)',
              textAlign: 'center'
            }}>
              Name is required to save
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * FormField Component
 * Reusable form field with icon and help text
 */
function FormField({ icon: Icon, label, type = 'text', placeholder, value, onChange, helpText }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
      <label style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        fontSize: '0.875rem',
        fontWeight: 600,
        letterSpacing: '0.05em',
        textTransform: 'uppercase',
        color: 'var(--text-primary)'
      }}>
        <Icon style={{ width: '16px', height: '16px', opacity: 0.7 }} />
        {label}
      </label>
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          padding: '0.75rem',
          background: 'var(--bg-primary)',
          border: '1px solid var(--text-primary)',
          color: 'var(--text-primary)',
          fontSize: '0.875rem',
          fontFamily: 'inherit',
          outline: 'none'
        }}
      />
      {helpText && (
        <span style={{
          fontSize: '0.75rem',
          color: 'var(--text-secondary)',
          fontStyle: 'italic'
        }}>
          {helpText}
        </span>
      )}
    </div>
  );
}
