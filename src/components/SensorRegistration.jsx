import React, { useState } from 'react';
import { parseCareLinkSections } from '../core/csvSectionParser';
import { detectSensorChanges } from '../core/sensorDetectionEngine';
import { addSensor, getSensorHistory } from '../storage/sensorStorage';
import './SensorRegistration.css';

export default function SensorRegistration({ isOpen, onClose }) {
  const [csvFile, setCsvFile] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [candidates, setCandidates] = useState([]);
  const [debugLog, setDebugLog] = useState([]);
  const [error, setError] = useState(null);

  const addDebugLog = (message, data = null) => {
    const timestamp = new Date().toLocaleTimeString();
    setDebugLog(prev => [...prev, { timestamp, message, data }]);
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    if (!file.name.endsWith('.csv')) {
      setError('Please select a CSV file');
      return;
    }
    
    setCsvFile(file);
    setError(null);
    setDebugLog([]);
    setCandidates([]);
    addDebugLog(`File selected: ${file.name} (${(file.size / 1024).toFixed(1)} KB)`);
  };
  const handleAnalyze = async () => {
    if (!csvFile) {
      setError('No file selected');
      return;
    }

    setIsAnalyzing(true);
    setError(null);
    setCandidates([]);
    setDebugLog([]);
    
    try {
      // Step 1: Read CSV file
      addDebugLog('Reading CSV file...');
      const csvText = await csvFile.text();
      addDebugLog(`CSV loaded: ${csvText.length} characters, ${csvText.split('\n').length} lines`);

      // Step 2: Parse sections
      addDebugLog('Parsing CSV sections...');
      const { alerts, glucose } = parseCareLinkSections(csvText);
      addDebugLog(`Parsed: ${alerts.length} alerts, ${glucose.length} glucose readings`);

      // Step 3: Detect sensor changes (includes clustering, gap detection, and matching)
      addDebugLog('Detecting sensor changes...');
      const { candidates: matches, summary } = detectSensorChanges(alerts, glucose);
      addDebugLog(`Identified ${matches.length} sensor change candidates`, matches);
      addDebugLog('Detection summary:', summary);

      setCandidates(matches);

      if (matches.length === 0) {
        addDebugLog('⚠️ No sensor changes detected in this CSV');
      } else {
        addDebugLog(`✅ Analysis complete: ${matches.length} candidates found`);
      }

    } catch (err) {
      console.error('Analysis error:', err);
      setError(`Analysis failed: ${err.message}`);
      addDebugLog(`❌ Error: ${err.message}`);
    } finally {
      setIsAnalyzing(false);
    }
  };
  const handleConfirm = async (candidate) => {
    try {
      addDebugLog(`Confirming sensor change: ${candidate.timestamp}`);
      
      const sensorData = {
        insertDate: candidate.timestamp,
        notes: `Auto-detected from CSV (confidence: ${candidate.confidence})`,
        source: 'csv_detection'
      };
      
      const sensorId = await addSensor(sensorData);
      addDebugLog(`✅ Sensor added to database: ID ${sensorId}`);
      
      // Remove from candidates list
      setCandidates(prev => prev.filter(c => c.timestamp !== candidate.timestamp));
      
    } catch (err) {
      console.error('Confirm error:', err);
      setError(`Failed to add sensor: ${err.message}`);
      addDebugLog(`❌ Failed to add sensor: ${err.message}`);
    }
  };

  const handleIgnore = (candidate) => {
    addDebugLog(`Ignoring candidate: ${candidate.timestamp}`);
    setCandidates(prev => prev.filter(c => c.timestamp !== candidate.timestamp));
  };

  const handleSplit = (candidate) => {
    addDebugLog(`Split requested for: ${candidate.timestamp}`);
    // TODO: Phase 5 - Implement split logic for manual date adjustment
    alert('Split functionality coming in Phase 5');
  };

  const getConfidenceBadge = (confidence) => {
    if (confidence === 'HIGH') return '🟢 HIGH';
    if (confidence === 'MEDIUM') return '🟡 MEDIUM';
    return '🔴 LOW';
  };

  const getConfidenceClass = (confidence) => {
    if (confidence === 'HIGH') return 'confidence-high';
    if (confidence === 'MEDIUM') return 'confidence-medium';
    return 'confidence-low';
  };

  if (!isOpen) return null;
  return (
    <div className="sensor-registration-overlay">
      <div className="sensor-registration-modal">
        
        {/* Header */}
        <div className="modal-header">
          <h2>SENSOR REGISTRATION</h2>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        {/* CSV Upload Section */}
        <div className="upload-section">
          <h3>1. UPLOAD CARELINK CSV</h3>
          <input
            type="file"
            accept=".csv"
            onChange={handleFileSelect}
            className="file-input"
            id="csv-upload"
          />
          <label htmlFor="csv-upload" className="file-label">
            {csvFile ? `📄 ${csvFile.name}` : '📁 SELECT CSV FILE'}
          </label>
          
          <button
            onClick={handleAnalyze}
            disabled={!csvFile || isAnalyzing}
            className="analyze-btn"
          >
            {isAnalyzing ? '⚙️ ANALYZING...' : '🔍 LOAD & ANALYSE'}
          </button>
        </div>

        {/* Error Display */}
        {error && (
          <div className="error-box">
            ⚠️ {error}
          </div>
        )}

        {/* Candidates Section */}
        {candidates.length > 0 && (
          <div className="candidates-section">
            <h3>2. REVIEW DETECTED SENSORS ({candidates.length})</h3>
            <div className="candidates-table">
              <div className="table-header">
                <div>TIMESTAMP</div>
                <div>CONFIDENCE</div>
                <div>SCORE</div>
                <div>ACTIONS</div>
              </div>
              {candidates.map((candidate, idx) => (
                <div key={idx} className="table-row">
                  <div className="timestamp">{candidate.timestamp}</div>
                  <div className={`confidence ${getConfidenceClass(candidate.confidence)}`}>
                    {getConfidenceBadge(candidate.confidence)}
                  </div>
                  <div className="score">{candidate.score}/100</div>
                  <div className="actions">
                    <button onClick={() => handleConfirm(candidate)} className="btn-confirm">
                      ✓ CONFIRM
                    </button>
                    <button onClick={() => handleIgnore(candidate)} className="btn-ignore">
                      ✗ IGNORE
                    </button>
                    <button onClick={() => handleSplit(candidate)} className="btn-split">
                      ✂ SPLIT
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        {/* Debug Log Section */}
        {debugLog.length > 0 && (
          <div className="debug-section">
            <h3>3. DEBUG LOG</h3>
            <div className="debug-log">
              {debugLog.map((entry, idx) => (
                <div key={idx} className="log-entry">
                  <span className="log-time">[{entry.timestamp}]</span>
                  <span className="log-message">{entry.message}</span>
                  {entry.data && (
                    <pre className="log-data">{JSON.stringify(entry.data, null, 2)}</pre>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
