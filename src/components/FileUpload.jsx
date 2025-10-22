import React, { useState, useRef } from 'react';
import { Upload, FileText, Calendar, X, AlertCircle } from 'lucide-react';

/**
 * FileUpload - Interactive file upload component
 * 
 * Provides UI for uploading:
 * 1. Medtronic CareLink CSV export
 * 2. ProTime workday data (PDF text or JSON)
 * 
 * @param {Function} props.onCSVLoad - Callback when CSV is loaded: (text) => void
 * @param {Function} props.onProTimeLoad - Callback when ProTime data is loaded: (text) => void
 * @param {boolean} props.csvLoaded - Whether CSV has been loaded
 * @param {boolean} props.proTimeLoaded - Whether ProTime has been loaded
 * 
 * @version 2.1.0
 */
export default function FileUpload({ 
  onCSVLoad, 
  onProTimeLoad, 
  csvLoaded = false,
  proTimeLoaded = false 
}) {
  const [isProTimeModalOpen, setIsProTimeModalOpen] = useState(false);
  const [error, setError] = useState(null);

  const handleCSVUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setError(null);

    // Validate file type
    if (!file.name.endsWith('.csv')) {
      setError('Please upload a CSV file');
      return;
    }

    try {
      const text = await file.text();
      
      // Basic validation: check for expected CSV structure
      if (!text.includes('YYYY/MM/DD') && !text.includes('Sensor Glucose')) {
        setError('This does not appear to be a Medtronic CareLink CSV file');
        return;
      }

      onCSVLoad(text);
    } catch (err) {
      setError(`Failed to read CSV file: ${err.message}`);
    }

    // Reset input so same file can be uploaded again
    event.target.value = '';
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Upload className="w-5 h-5 text-gray-400" />
        <h3 className="text-lg font-semibold text-gray-100">Data Import</h3>
      </div>

      {/* Upload Buttons */}
      <div className="flex flex-wrap gap-3">
        {/* CSV Upload Button */}
        <CSVUploadButton 
          onUpload={handleCSVUpload}
          isLoaded={csvLoaded}
        />

        {/* ProTime Import Button */}
        <ProTimeButton 
          onClick={() => setIsProTimeModalOpen(true)}
          isLoaded={proTimeLoaded}
        />
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-900/20 border border-red-700 rounded-lg p-3 flex items-start gap-2">
          <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm text-red-300">{error}</p>
          </div>
          <button
            onClick={() => setError(null)}
            className="text-red-400 hover:text-red-300"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ProTime Modal */}
      {isProTimeModalOpen && (
        <ProTimeModal
          onClose={() => setIsProTimeModalOpen(false)}
          onLoad={onProTimeLoad}
          setError={setError}
        />
      )}
    </div>
  );
}

/**
 * CSVUploadButton - Button for CSV file upload
 */
function CSVUploadButton({ onUpload, isLoaded }) {
  const fileInputRef = useRef(null);

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv"
        onChange={onUpload}
        className="hidden"
      />
      
      <button
        onClick={() => fileInputRef.current?.click()}
        className={`
          btn flex items-center gap-2
          ${isLoaded 
            ? 'btn-secondary border-green-600 text-green-400' 
            : 'btn-primary'
          }
        `}
      >
        <FileText className="w-4 h-4" />
        {isLoaded ? 'CSV Loaded ✓' : 'Upload CSV'}
      </button>
    </>
  );
}

/**
 * ProTimeButton - Button to open ProTime import modal
 */
function ProTimeButton({ onClick, isLoaded }) {
  return (
    <button
      onClick={onClick}
      className={`
        btn flex items-center gap-2
        ${isLoaded 
          ? 'btn-secondary border-green-600 text-green-400' 
          : 'btn-secondary'
        }
      `}
    >
      <Calendar className="w-4 h-4" />
      {isLoaded ? 'ProTime Loaded ✓' : 'Import ProTime'}
    </button>
  );
}

/**
 * ProTimeModal - Modal for ProTime data import (PDF text or JSON)
 */
function ProTimeModal({ onClose, onLoad, setError }) {
  const [activeTab, setActiveTab] = useState('pdf'); // 'pdf' or 'json'
  const [pdfText, setPdfText] = useState('');
  const pdfFileInputRef = useRef(null);
  const jsonFileInputRef = useRef(null);

  const handlePDFTextSubmit = () => {
    if (!pdfText.trim()) {
      setError('Please paste ProTime PDF text');
      return;
    }

    // Basic validation: check for expected ProTime content
    if (!pdfText.includes('ProTime') && !pdfText.includes('werkdag')) {
      setError('This does not appear to be ProTime data');
      return;
    }

    onLoad(pdfText);
    onClose();
  };

  const handleJSONUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.json')) {
      setError('Please upload a JSON file');
      return;
    }

    try {
      const text = await file.text();
      const data = JSON.parse(text);

      // Validate JSON structure
      if (!Array.isArray(data) || data.length === 0) {
        setError('Invalid ProTime JSON format');
        return;
      }

      onLoad(JSON.stringify(data));
      onClose();
    } catch (err) {
      setError(`Failed to read JSON file: ${err.message}`);
    }

    // Reset input
    event.target.value = '';
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 border border-gray-700 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <h3 className="text-lg font-semibold text-gray-100">
            Import ProTime Data
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-300"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-700">
          <button
            onClick={() => setActiveTab('pdf')}
            className={`
              flex-1 px-4 py-3 text-sm font-medium transition-colors
              ${activeTab === 'pdf'
                ? 'bg-gray-700 text-blue-400 border-b-2 border-blue-400'
                : 'text-gray-400 hover:text-gray-300'
              }
            `}
          >
            PDF Text
          </button>
          <button
            onClick={() => setActiveTab('json')}
            className={`
              flex-1 px-4 py-3 text-sm font-medium transition-colors
              ${activeTab === 'json'
                ? 'bg-gray-700 text-blue-400 border-b-2 border-blue-400'
                : 'text-gray-400 hover:text-gray-300'
              }
            `}
          >
            JSON File
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {activeTab === 'pdf' ? (
            <PDFTextTab 
              pdfText={pdfText}
              setPdfText={setPdfText}
              onSubmit={handlePDFTextSubmit}
            />
          ) : (
            <JSONFileTab 
              fileInputRef={jsonFileInputRef}
              onUpload={handleJSONUpload}
            />
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * PDFTextTab - Tab for pasting ProTime PDF text
 */
function PDFTextTab({ pdfText, setPdfText, onSubmit }) {
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Paste ProTime PDF text
        </label>
        <p className="text-xs text-gray-500 mb-3">
          Copy the entire content from your ProTime PDF export and paste it here.
        </p>
        <textarea
          value={pdfText}
          onChange={(e) => setPdfText(e.target.value)}
          placeholder="Paste ProTime PDF text here..."
          className="w-full h-64 px-3 py-2 bg-gray-900 border border-gray-600 rounded-md 
                     text-gray-100 font-mono text-sm
                     focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                     placeholder-gray-600"
        />
      </div>

      <div className="bg-blue-900/20 border border-blue-700 rounded-lg p-3">
        <p className="text-xs text-blue-300">
          <strong>How to export from ProTime:</strong><br/>
          1. Open your ProTime PDF<br/>
          2. Select all text (Cmd+A or Ctrl+A)<br/>
          3. Copy (Cmd+C or Ctrl+C)<br/>
          4. Paste here (Cmd+V or Ctrl+V)
        </p>
      </div>

      <button
        onClick={onSubmit}
        disabled={!pdfText.trim()}
        className="btn btn-primary w-full"
      >
        Import PDF Text
      </button>
    </div>
  );
}

/**
 * JSONFileTab - Tab for uploading ProTime JSON file
 */
function JSONFileTab({ fileInputRef, onUpload }) {
  return (
    <div className="space-y-4">
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        onChange={onUpload}
        className="hidden"
      />

      <div className="text-center py-12">
        <div className="mb-4">
          <FileText className="w-16 h-16 text-gray-600 mx-auto" />
        </div>
        
        <h4 className="text-lg font-medium text-gray-300 mb-2">
          Upload ProTime JSON
        </h4>
        
        <p className="text-sm text-gray-500 mb-6">
          Select a previously exported ProTime JSON file
        </p>

        <button
          onClick={() => fileInputRef.current?.click()}
          className="btn btn-primary"
        >
          <Upload className="w-4 h-4 mr-2" />
          Select JSON File
        </button>
      </div>

      <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-4">
        <h5 className="text-sm font-medium text-gray-300 mb-2">
          Expected JSON format:
        </h5>
        <pre className="text-xs text-gray-500 font-mono overflow-x-auto">
{`[
  "2025-01-15",
  "2025-01-16",
  "2025-01-17",
  ...
]`}
        </pre>
        <p className="text-xs text-gray-500 mt-2">
          Array of workday dates in YYYY-MM-DD format
        </p>
      </div>

      <div className="bg-blue-900/20 border border-blue-700 rounded-lg p-3">
        <p className="text-xs text-blue-300">
          <strong>First time using ProTime data?</strong><br/>
          Use the "PDF Text" tab instead. You can export to JSON later from the app.
        </p>
      </div>
    </div>
  );
}
