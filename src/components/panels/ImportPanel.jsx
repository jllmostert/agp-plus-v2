/**
 * ImportPanel.jsx
 * 
 * Panel for data import functionality.
 * Extracted from AGPGenerator.jsx (Sprint C1 Phase 4)
 * 
 * Handles:
 * - CSV file upload
 * - Sensor import
 * - ProTime PDF upload
 * - Error display
 * 
 * @version 1.0.0
 * @created 2025-11-02
 */

import React, { useState } from 'react';
import { AlertCircle } from 'lucide-react';
import FileUpload from '../FileUpload';
import SensorImport from '../SensorImport';

function ImportPanel({
  // Data state
  csvData,
  workdays,
  csvError,
  v3UploadError,
  
  // Handlers
  onCSVLoad,
  onProTimeLoad,
  onProTimeDelete,
  onImportDatabase
}) {
  // Progress tracking state
  const [uploadProgress, setUploadProgress] = useState({
    isUploading: false,
    currentFile: 0,
    totalFiles: 0,
    fileName: '',
    percentage: 0
  });

  return (
    <div className="mb-4" style={{ 
      background: 'var(--bg-secondary)',
      border: '2px solid var(--border-primary)',
      borderRadius: '4px',
      padding: '1rem',
      marginTop: '1rem'
    }}>
      {/* Sub-buttons for import options */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '0.75rem',
        marginBottom: '1rem'
      }}>
        <button
          onClick={() => document.getElementById('csv-upload-input')?.click()}
          style={{
            background: 'var(--bg-primary)',
            border: '2px solid var(--border-primary)',
            color: 'var(--text-primary)',
            cursor: 'pointer',
            padding: '1rem',
            fontSize: '0.75rem',
            fontWeight: 700,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '0.5rem'
          }}
          title="Upload multiple CareLink CSV files at once"
        >
          📄 Upload CSV(s)
          {csvData && <span style={{ color: 'var(--color-green)', fontSize: '1rem' }}>✓</span>}
        </button>

        <div>
          <SensorImport />
        </div>

        <button
          onClick={() => document.getElementById('protime-upload-input')?.click()}
          style={{
            background: 'var(--bg-primary)',
            border: '2px solid var(--border-primary)',
            color: 'var(--text-primary)',
            cursor: 'pointer',
            padding: '1rem',
            fontSize: '0.75rem',
            fontWeight: 700,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '0.5rem'
          }}
          title="Upload ProTime PDF for workday analysis"
        >
          📋 ProTime PDFs
          {workdays && <span style={{ color: 'var(--color-green)', fontSize: '1rem' }}>✓</span>}
        </button>

        <button
          onClick={onImportDatabase}
          style={{
            background: 'var(--bg-primary)',
            border: '2px solid var(--border-primary)',
            color: 'var(--text-primary)',
            cursor: 'pointer',
            padding: '1rem',
            fontSize: '0.75rem',
            fontWeight: 700,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '0.5rem'
          }}
          title="Import complete database from JSON backup"
        >
          💾 Import JSON
        </button>
      </div>

      {/* Hidden file inputs */}
      <input
        id="csv-upload-input"
        type="file"
        accept=".csv"
        multiple
        onChange={async (e) => {
          const files = Array.from(e.target.files || []);
          
          if (files.length === 0) return;
          
          // Start progress tracking
          setUploadProgress({
            isUploading: true,
            currentFile: 0,
            totalFiles: files.length,
            fileName: '',
            percentage: 0
          });
          
          // Process files sequentially
          for (let i = 0; i < files.length; i++) {
            const file = files[i];
            
            // Update progress
            setUploadProgress(prev => ({
              ...prev,
              currentFile: i + 1,
              fileName: file.name,
              percentage: Math.round(((i + 1) / files.length) * 100)
            }));
            
            if (file.name.endsWith('.csv')) {
              console.log(`[ImportPanel] Processing CSV ${i + 1}/${files.length}:`, file.name);
              const text = await file.text();
              await onCSVLoad(text);
            }
          }
          
          // Complete progress
          setUploadProgress({
            isUploading: false,
            currentFile: files.length,
            totalFiles: files.length,
            fileName: '',
            percentage: 100
          });
          
          // Show completion message if multiple files
          if (files.length > 1) {
            alert(`✅ Import Complete\n\n${files.length} CSV files processed`);
          }
          
          e.target.value = '';
        }}
        style={{ display: 'none' }}
      />
      
      <input
        id="protime-upload-input"
        type="file"
        accept=".pdf"
        multiple
        onChange={async (e) => {
          const files = Array.from(e.target.files || []);
          
          if (files.length === 0) return;
          
          // Start progress tracking
          setUploadProgress({
            isUploading: true,
            currentFile: 0,
            totalFiles: files.length,
            fileName: '',
            percentage: 0
          });
          
          try {
            const { extractTextFromPDF, extractTextFromMultiplePDFs } = await import('../../utils/pdfParser');
            
            if (files.length === 1) {
              // Single file
              setUploadProgress(prev => ({
                ...prev,
                currentFile: 1,
                fileName: files[0].name,
                percentage: 100
              }));
              
              const text = await extractTextFromPDF(files[0]);
              onProTimeLoad(text);
            } else {
              // Multiple files - process sequentially
              for (let i = 0; i < files.length; i++) {
                const file = files[i];
                
                // Update progress
                setUploadProgress(prev => ({
                  ...prev,
                  currentFile: i + 1,
                  fileName: file.name,
                  percentage: Math.round(((i + 1) / files.length) * 100)
                }));
                
                console.log(`[ImportPanel] Processing PDF ${i + 1}/${files.length}:`, file.name);
              }
              
              const text = await extractTextFromMultiplePDFs(files);
              onProTimeLoad(text);
            }
            
            // Complete progress
            setUploadProgress({
              isUploading: false,
              currentFile: files.length,
              totalFiles: files.length,
              fileName: '',
              percentage: 100
            });
            
            // Show completion message if multiple files
            if (files.length > 1) {
              alert(`✅ Import Complete\n\n${files.length} PDF files processed`);
            }
          } catch (err) {
            console.error('PDF processing error:', err);
            
            // Reset progress on error
            setUploadProgress({
              isUploading: false,
              currentFile: 0,
              totalFiles: 0,
              fileName: '',
              percentage: 0
            });
          }
          
          e.target.value = '';
        }}
        style={{ display: 'none' }}
      />

      {/* FileUpload - hidden for backwards compat */}
      <div style={{ display: 'none' }}>
        <FileUpload
          onCSVLoad={onCSVLoad}
          onProTimeLoad={onProTimeLoad}
          onProTimeDelete={onProTimeDelete}
          csvLoaded={!!csvData}
          proTimeLoaded={!!workdays}
        />
      </div>
      
      {/* Progress Indicator */}
      {uploadProgress.isUploading && (
        <div style={{
          marginTop: '1rem',
          padding: '1.5rem',
          border: '3px solid var(--border-primary)',
          background: 'var(--bg-secondary)'
        }}>
          <div style={{
            fontFamily: 'Courier New, monospace',
            fontSize: '0.875rem',
            fontWeight: 'bold',
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            marginBottom: '0.75rem'
          }}>
            📤 Uploading Files ({uploadProgress.currentFile} of {uploadProgress.totalFiles})
          </div>
          
          {/* Progress Bar */}
          <div style={{
            width: '100%',
            height: '24px',
            background: 'var(--bg-primary)',
            border: '2px solid var(--border-primary)',
            overflow: 'hidden',
            marginBottom: '0.75rem'
          }}>
            <div style={{
              height: '100%',
              background: 'var(--color-green)',
              width: `${uploadProgress.percentage}%`,
              transition: 'width 0.3s ease'
            }} />
          </div>
          
          {/* Current File */}
          <div style={{
            fontFamily: 'Courier New, monospace',
            fontSize: '0.75rem',
            color: 'var(--text-secondary)'
          }}>
            Processing: {uploadProgress.fileName}
          </div>
        </div>
      )}
      
      {/* Error Display */}
      {(csvError || v3UploadError) && (
        <div className="card mt-4" style={{ 
          background: 'rgba(220, 38, 38, 0.1)', 
          color: 'var(--color-red)',
          border: '2px solid var(--color-red)',
          padding: '1rem'
        }}>
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: 'var(--color-red)' }} />
            <div>
              <p style={{ fontSize: '0.875rem', fontWeight: 700, marginBottom: '0.5rem' }}>
                CSV Import Error
              </p>
              <p style={{ fontSize: '0.875rem', lineHeight: '1.5' }}>
                {csvError || v3UploadError}
              </p>
              <p style={{ fontSize: '0.75rem', marginTop: '0.5rem', opacity: 0.8 }}>
                Please ensure you're uploading a valid CareLink CSV export.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ImportPanel;
