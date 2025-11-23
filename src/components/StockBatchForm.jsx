/**
 * StockBatchForm.jsx
 * Form for adding/editing batches
 * v3.15.0
 */

import React, { useState, useEffect } from 'react';
import { addBatch, updateBatch, validateBatch } from '../storage/stockStorage.js';

export default function StockBatchForm({ batch, onSave, onCancel }) {
  const [formData, setFormData] = useState({
    lot_number: '',
    received_date: '',
    source: 'hospital',
    expiry_date: '',
    box_quantity: '',
    total_quantity: '',
    notes: ''
  });
  const [errors, setErrors] = useState([]);

  // Load batch data if editing
  useEffect(() => {
    if (batch) {
      setFormData({
        lot_number: batch.lot_number || '',
        received_date: batch.received_date || '',
        source: batch.source || 'hospital',
        expiry_date: batch.expiry_date || '',
        box_quantity: batch.box_quantity || '',
        total_quantity: batch.total_quantity || '',
        notes: batch.notes || ''
      });
    }
  }, [batch]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate
    const validation = validateBatch(formData);
    if (!validation.valid) {
      setErrors(validation.errors);
      return;
    }
    
    // Convert string numbers to actual numbers
    const cleanData = {
      ...formData,
      box_quantity: formData.box_quantity ? parseInt(formData.box_quantity) : null,
      total_quantity: formData.total_quantity ? parseInt(formData.total_quantity) : null
    };
    
    // Save
    if (batch) {
      await updateBatch(batch.batch_id, cleanData);
    } else {
      await addBatch(cleanData);
    }
    
    onSave();
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setErrors([]); // Clear errors on change
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 10000
    }}>
      <div style={{
        backgroundColor: 'var(--paper)',
        border: '3px solid var(--ink)',
        padding: '24px',
        maxWidth: '600px',
        width: '90%',
        maxHeight: '90vh',
        overflow: 'auto',
        fontFamily: '"SF Mono", "Monaco", "Courier New", monospace'
      }}>
        <h2 style={{
          margin: '0 0 24px 0',
          fontSize: '18px',
          fontWeight: 'bold',
          textTransform: 'uppercase',
          color: 'var(--ink)'
        }}>
          {batch ? 'BATCH BEWERKEN' : 'NIEUWE BATCH'}
        </h2>

        {errors.length > 0 && (
          <div style={{
            padding: '12px',
            backgroundColor: 'var(--bg-tertiary)',
            border: '2px solid var(--color-red)',
            marginBottom: '16px'
          }}>
            {errors.map((err, i) => (
              <div key={i} style={{ fontSize: '12px', color: 'var(--color-red)' }}>{err}</div>
            ))}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* LOT NUMBER */}
          <FormField label="LOT NUMMER *" required>
            <input
              type="text"
              value={formData.lot_number}
              onChange={(e) => handleChange('lot_number', e.target.value)}
              style={inputStyle}
              placeholder="NG4A12345"
            />
          </FormField>

          {/* RECEIVED DATE */}
          <FormField label="ONTVANGST DATUM *" required>
            <input
              type="date"
              value={formData.received_date}
              onChange={(e) => handleChange('received_date', e.target.value)}
              style={inputStyle}
            />
          </FormField>

          {/* SOURCE */}
          <FormField label="BRON *" required>
            <select
              value={formData.source}
              onChange={(e) => handleChange('source', e.target.value)}
              style={inputStyle}
            >
              <option value="hospital">Ziekenhuis</option>
              <option value="medtronic">Medtronic</option>
              <option value="pharmacy">Apotheek</option>
              <option value="other">Anders</option>
            </select>
          </FormField>
          {/* EXPIRY DATE */}
          <FormField label="VERVALDATUM (optioneel)">
            <input
              type="date"
              value={formData.expiry_date}
              onChange={(e) => handleChange('expiry_date', e.target.value)}
              style={inputStyle}
            />
          </FormField>

          {/* BOX QUANTITY */}
          <FormField label="AANTAL PER DOOS (optioneel)">
            <input
              type="number"
              value={formData.box_quantity}
              onChange={(e) => handleChange('box_quantity', e.target.value)}
              style={inputStyle}
              placeholder="10"
            />
          </FormField>

          {/* TOTAL QUANTITY */}
          <FormField label="TOTAAL AANTAL (optioneel)">
            <input
              type="number"
              value={formData.total_quantity}
              onChange={(e) => handleChange('total_quantity', e.target.value)}
              style={inputStyle}
              placeholder="30"
            />
          </FormField>

          {/* NOTES */}
          <FormField label="NOTITIES (optioneel)">
            <textarea
              value={formData.notes}
              onChange={(e) => handleChange('notes', e.target.value)}
              style={{ ...inputStyle, minHeight: '80px', resize: 'vertical' }}
              placeholder="Extra informatie..."
            />
          </FormField>

          {/* BUTTONS */}
          <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
            <button
              type="submit"
              style={{
                ...buttonStyle,
                flex: 1,
                backgroundColor: 'var(--ink)',
                color: 'var(--paper)'
              }}
            >
              {batch ? 'OPSLAAN' : 'TOEVOEGEN'}
            </button>
            <button
              type="button"
              onClick={onCancel}
              style={{
                ...buttonStyle,
                flex: 1
              }}
            >
              ANNULEREN
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Helper component for form fields
function FormField({ label, required, children }) {
  return (
    <div style={{ marginBottom: '16px' }}>
      <label style={{
        display: 'block',
        fontSize: '12px',
        fontWeight: 'bold',
        textTransform: 'uppercase',
        marginBottom: '8px',
        color: 'var(--ink)'
      }}>
        {label}
      </label>
      {children}
    </div>
  );
}

const inputStyle = {
  width: '100%',
  padding: '12px',
  border: '3px solid var(--ink)',
  fontSize: '14px',
  fontFamily: 'inherit',
  backgroundColor: 'var(--paper)',
  color: 'var(--ink)'
};

const buttonStyle = {
  padding: '12px 24px',
  border: '3px solid var(--ink)',
  backgroundColor: 'var(--paper)',
  color: 'var(--ink)',
  fontSize: '14px',
  fontWeight: 'bold',
  cursor: 'pointer',
  textTransform: 'uppercase'
};
