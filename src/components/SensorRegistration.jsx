import React, { useState } from 'react';
import { parseCareLinkSections } from '../core/csvSectionParser';
import { detectSensorChanges } from '../core/sensorDetectionEngine';
import { addSensor, getAllSensors, updateSensor } from '../storage/sensorStorage';
import './SensorRegistration.css';

export default function SensorRegistration({ isOpen, onClose }) {
  const [csvFile, setCsvFile] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [candidates, setCandidates] = useState([]);
  const [debugLog, setDebugLog] = useState([]);
  const [error, setError] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [successToast, setSuccessToast] = useState(null); // { message, timestamp }

  // Handle close with auto-reload to refresh sensor data
  const handleClose = () => {
    onClose();
    window.location.reload();
  };

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

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files[0];
    if (!file) return;
    
    if (!file.name.endsWith('.csv')) {
      setError('Please drop a CSV file');
      return;
    }
    
    setCsvFile(file);
    setError(null);
    setDebugLog([]);
    setCandidates([]);
    addDebugLog(`File dropped: ${file.name} (${(file.size / 1024).toFixed(1)} KB)`);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
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
      const detectionResult = detectSensorChanges(alerts, glucose);
      console.log('[SensorRegistration] Detection result:', detectionResult);
      addDebugLog('Raw detection result:', detectionResult);
      
      const matches = detectionResult.candidates || [];
      console.log('[SensorRegistration] Extracted candidates:', matches);
      addDebugLog(`Identified ${matches.length} sensor change candidates`, matches);
      addDebugLog('Detection summary:', detectionResult.summary);
      
      // Extra debug: log each candidate structure
      if (matches.length > 0) {
        matches.forEach((c, i) => {
          addDebugLog(`Candidate ${i+1}:`, {
            timestamp: formatTimestamp(c.timestamp),
            confidence: c.confidence,
            score: c.score,
            alerts: c.alerts?.length || 0,
            alertTypes: c.alerts?.slice(0, 3),
            gaps: c.gaps?.length || 0,
            gapDuration: c.gaps?.[0]?.duration
          });
        });
      }

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
      addDebugLog(`Confirming sensor change: ${formatTimestamp(candidate.timestamp)}`);
      
      // v3.8.0+: stopped_at is now determined by detection engine (EoL gap detection)
      // No need to update previous sensor's end time here - it's already set during detection
      if (candidate.stopped_at) {
        addDebugLog(`✅ Sensor lifecycle detected: ended at ${formatTimestamp(candidate.stopped_at)}`);
      } else if (candidate.lifecycle === 'active') {
        addDebugLog(`ℹ️ Sensor still active (no EoL gap detected)`);
      } else {
        addDebugLog(`⚠️ Sensor lifecycle unknown (insufficient data)`);
      }
      
      // Auto-close previous sensor if it has no end_date
      const allSensors = await getAllSensors();
      const previousSensor = allSensors
        .filter(s => {
          const startDate = s.start_date || s.startTimestamp;
          return startDate && new Date(startDate) < candidate.timestamp;
        })
        .sort((a, b) => {
          const dateA = new Date(a.start_date || a.startTimestamp);
          const dateB = new Date(b.start_date || b.startTimestamp);
          return dateB - dateA;
        })[0];
      
      if (previousSensor) {
        const prevEndDate = previousSensor.end_date || previousSensor.endTimestamp || previousSensor.stoppedAt;
        if (!prevEndDate) {
          addDebugLog(`🔄 Auto-closing previous sensor ${previousSensor.id}`);
          addDebugLog(`   End date: ${candidate.timestamp.toISOString()}`);
          
          await updateSensor(previousSensor.id, {
            end_date: candidate.timestamp.toISOString(),
            duration_hours: (candidate.timestamp - new Date(previousSensor.start_date || previousSensor.startTimestamp)) / (1000 * 60 * 60),
            duration_days: (candidate.timestamp - new Date(previousSensor.start_date || previousSensor.startTimestamp)) / (1000 * 60 * 60 * 24)
          });
          
          addDebugLog(`✅ Previous sensor closed successfully`);
        }
      }
      
      // Add the new sensor using data from detection engine
      const sensorId = `sensor_${candidate.timestamp.getTime()}`;
      
      const sensorData = {
        id: sensorId,
        start_date: candidate.timestamp.toISOString(),
        end_date: candidate.stopped_at ? candidate.stopped_at.toISOString() : null,
        duration_hours: candidate.stopped_at 
          ? (candidate.stopped_at - candidate.timestamp) / (1000 * 60 * 60)
          : null,
        duration_days: candidate.stopped_at
          ? (candidate.stopped_at - candidate.timestamp) / (1000 * 60 * 60 * 24)
          : null,
        notes: `CSV auto-detected (${candidate.confidence.toUpperCase()}, score: ${candidate.score}/100)`,
        lot_number: null,
        hw_version: null,
        is_locked: false,
        batch_id: null
      };
      
      const result = await addSensor(sensorData);
      
      if (!result) {
        addDebugLog(`⚠️ Duplicate sensor skipped: ${sensorId}`);
        setError(`Sensor already exists: ${sensorId}`);
        return;
      }
      
      addDebugLog(`✅ New sensor added: ${sensorId}`, {
        start: formatTimestamp(candidate.timestamp),
        confidence: candidate.confidence,
        score: candidate.score
      });
      
      // Show success toast
      const sensors = await getAllSensors();
      const sensorCount = sensors.length;
      setSuccessToast({
        message: `Sensor added! Total: ${sensorCount}`,
        timestamp: Date.now()
      });
      
      // Auto-hide toast after 3 seconds
      setTimeout(() => setSuccessToast(null), 3000);
      
      // Remove from candidates list
      setCandidates(prev => prev.filter(c => 
        c.timestamp.getTime() !== candidate.timestamp.getTime()
      ));
      
    } catch (err) {
      console.error('Confirm error:', err);
      setError(`Failed to add sensor: ${err.message}`);
      addDebugLog(`❌ Failed to add sensor: ${err.message}`);
    }
  };

  const handleIgnore = (candidate) => {
    addDebugLog(`Ignoring candidate: ${formatTimestamp(candidate.timestamp)}`);
    setCandidates(prev => prev.filter(c => 
      c.timestamp.getTime() !== candidate.timestamp.getTime()
    ));
  };

  const handleSplit = (candidate) => {
    addDebugLog(`Split requested for: ${candidate.timestamp}`);
    // TODO: Phase 5 - Implement split logic for manual date adjustment
    alert('Split functionality coming in Phase 5');
  };

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return 'Unknown';
    const date = timestamp instanceof Date ? timestamp : new Date(timestamp);
    if (isNaN(date.getTime())) return 'Invalid Date';
    
    // Format: "30 Oct 13:41"
    const day = date.getDate();
    const month = date.toLocaleDateString('en', { month: 'short' });
    const hours = String(date.getHours()).padStart(2, '0');
    const mins = String(date.getMinutes()).padStart(2, '0');
    
    return `${day} ${month} ${hours}:${mins}`;
  };

  const getConfidenceBadge = (confidence) => {
    const conf = String(confidence || '').toUpperCase();
    if (conf === 'HIGH') return '🟢 HIGH';
    if (conf === 'MEDIUM') return '🟡 MEDIUM';
    return '🔴 LOW';
  };

  const getConfidenceClass = (confidence) => {
    const conf = String(confidence || '').toUpperCase();
    if (conf === 'HIGH') return 'confidence-high';
    if (conf === 'MEDIUM') return 'confidence-medium';
    return 'confidence-low';
  };

  const getDetectionMethodBadge = (method) => {
    if (!method) return null;
    
    const badges = {
      'exact_alert': { emoji: '🎯', text: 'Exact Alert', title: 'Timestamp from SENSOR CONNECTED alert' },
      'fallback_reading': { emoji: '📊', text: 'First Reading', title: 'Timestamp from first glucose reading after alert' },
      'estimated': { emoji: '⏱️', text: 'Estimated', title: 'Timestamp estimated from alert cluster' },
      'none': { emoji: '❓', text: 'Unknown', title: 'No reliable timestamp found' }
    };
    
    const badge = badges[method] || badges['none'];
    return `${badge.emoji} ${badge.text}`;
  };

  const getDetectionMethodTitle = (method) => {
    const titles = {
      'exact_alert': 'Timestamp from SENSOR CONNECTED alert',
      'fallback_reading': 'Timestamp from first glucose reading after alert',
      'estimated': 'Timestamp estimated from alert cluster',
      'none': 'No reliable timestamp found'
    };
    return titles[method] || '';
  };

  if (!isOpen) return null;
  return (
    <div className="sensor-registration-overlay">
      <div className="sensor-registration-modal">
        
        {/* Header */}
        <div className="modal-header">
          <h2>SENSOR REGISTRATION</h2>
          <button className="close-btn" onClick={handleClose}>✕</button>
        </div>

        {/* CSV Upload Section */}
        <div className="upload-section">
          <h3>1. UPLOAD CARELINK CSV</h3>
          
          {/* Drag & Drop Zone */}
          <div
            className={`drop-zone ${isDragging ? 'dragging' : ''}`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
          >
            {csvFile ? (
              <div className="file-selected">
                📄 {csvFile.name}
                <span className="file-size">({(csvFile.size / 1024).toFixed(1)} KB)</span>
              </div>
            ) : (
              <div className="drop-prompt">
                {isDragging ? '📥 DROP CSV HERE' : '📁 DRAG & DROP CSV OR CLICK TO BROWSE'}
              </div>
            )}
            <input
              type="file"
              accept=".csv"
              onChange={handleFileSelect}
              className="file-input"
              id="csv-upload"
            />
          </div>
          
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
                <div>DETECTION</div>
                <div>SCORE</div>
                <div>ACTIONS</div>
              </div>
              {candidates.map((candidate, idx) => (
                <div key={idx} className="table-row">
                  <div className="timestamp">{formatTimestamp(candidate.timestamp)}</div>
                  <div className={`confidence ${getConfidenceClass(candidate.confidence)}`}>
                    {getConfidenceBadge(candidate.confidence)}
                  </div>
                  <div 
                    className="detection-method"
                    title={getDetectionMethodTitle(candidate.detection_method)}
                  >
                    {getDetectionMethodBadge(candidate.detection_method)}
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

        {/* Success Toast */}
        {successToast && (
          <div className="success-toast">
            ✅ {successToast.message}
          </div>
        )}

      </div>
    </div>
  );
}
