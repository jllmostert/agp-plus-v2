import React, { useState } from 'react';
import { Bug, X, Upload, Database, AlertTriangle } from 'lucide-react';

/**
 * DebugPanel Component
 * 
 * Hidden debug tools for diagnosing sensor detection and event storage.
 * Accessible via small bug icon in top-right corner.
 * 
 * Features:
 * - CSV upload and sensor alert analysis
 * - Event filtering visualization
 * - Clustering results display
 * - localStorage inspection
 * 
 * @version 1.0.0 (Oct 28, 2025)
 */
export default function DebugPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [csvText, setCsvText] = useState(null);
  const [parsedReadings, setParsedReadings] = useState(null);
  const [analysisResults, setAnalysisResults] = useState(null);
  const [storageContents, setStorageContents] = useState(null);

  const handleFileLoad = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const text = await file.text();
    setCsvText(text);

    // Parse CSV
    const { parseCSV } = await import('../../core/parsers.js');
    const parsed = parseCSV(text);
    const readings = parsed.data || parsed; // Backwards compatibility
    setParsedReadings(readings);

    // Analyze alerts
    await analyzeAlerts(readings);
  };

  const analyzeAlerts = async (readings) => {
    // Get all alerts
    const allAlerts = readings
      .filter(r => r.alert && r.date && r.time)
      .map(r => ({
        date: r.date,
        time: r.time,
        alert: r.alert
      }));

    // Filter for valid sensor alerts
    const { isValidSensorChangeAlert, deduplicateSensorEvents } = 
      await import('../../utils/eventClustering.js');
    
    const validAlerts = allAlerts.filter(a => isValidSensorChangeAlert(a.alert));

    // Cluster events
    const sensorEvents = validAlerts.map(a => {
      const [year, month, day] = a.date.split('/').map(Number);
      const [hours, minutes, seconds] = a.time.split(':').map(Number);
      return {
        timestamp: new Date(year, month - 1, day, hours, minutes, seconds),
        date: a.date,
        time: a.time,
        alert: a.alert
      };
    });

    const { confirmedEvents, ambiguousGroups } = deduplicateSensorEvents(sensorEvents);

    setAnalysisResults({
      rawAlerts: allAlerts,
      validAlerts,
      confirmedEvents,
      ambiguousGroups
    });
  };

  const handleUploadToV3 = async () => {
    if (!csvText) {
      alert('Load a CSV first!');
      return;
    }

    try {
      const { uploadCSVToV3 } = await import('../../storage/masterDatasetStorage.js');
      
      // Clear old events for clean test
      localStorage.removeItem('agp-device-events');
      
      const result = await uploadCSVToV3(csvText);
      
      alert(`Upload successful!\nReadings: ${result.readingsAdded}\nTotal: ${result.totalReadings}`);
      
      // Refresh storage contents
      checkStorage();
    } catch (err) {
      alert(`Upload failed: ${err.message}`);
      console.error(err);
    }
  };

  const checkStorage = () => {
    const events = JSON.parse(localStorage.getItem('agp-device-events') || '{}');
    const cache = localStorage.getItem('agp-v3-cache');
    const settings = localStorage.getItem('agp-v3-settings');

    setStorageContents({
      sensorChanges: events.sensorChanges || [],
      cartridgeChanges: events.cartridgeChanges || [],
      cacheSize: cache ? JSON.parse(cache).length : 0,
      hasSettings: !!settings
    });
  };

  return (
    <>
      {/* Debug Button - Small bug icon in top-right */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed top-4 right-4 p-2 bg-gray-800 hover:bg-gray-700 border border-gray-600 rounded-md transition-colors z-50 opacity-30 hover:opacity-100"
        title="Open Debug Panel"
      >
        <Bug className="w-4 h-4 text-gray-400" />
      </button>

      {/* Debug Panel Modal */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border-4 border-green-500 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-auto">
            {/* Header */}
            <div className="sticky top-0 bg-gray-900 border-b-4 border-green-500 p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bug className="w-6 h-6 text-green-500" />
                <h2 className="text-xl font-bold text-green-500 font-mono">
                  AGP+ DEBUG PANEL
                </h2>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 hover:bg-gray-800 rounded transition-colors"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6 font-mono text-sm">
              
              {/* Step 1: Load CSV */}
              <section className="border-2 border-green-500 rounded p-4 bg-black">
                <h3 className="text-cyan-500 text-lg mb-3 flex items-center gap-2">
                  <Upload className="w-5 h-5" />
                  STEP 1: LOAD CSV
                </h3>
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleFileLoad}
                  className="block w-full text-green-500 file:mr-4 file:py-2 file:px-4 file:border file:border-green-500 file:bg-black file:text-green-500 hover:file:bg-gray-900"
                />
              </section>

              {/* Step 2: Raw Alerts */}
              {analysisResults && (
                <section className="border-2 border-green-500 rounded p-4 bg-black">
                  <h3 className="text-cyan-500 text-lg mb-3">
                    STEP 2: RAW ALERTS
                  </h3>
                  <div className="bg-gray-950 p-3 rounded">
                    <p className="text-green-500 mb-2">
                      Found {analysisResults.rawAlerts.length} total alerts:
                    </p>
                    <div className="space-y-1 max-h-40 overflow-y-auto">
                      {analysisResults.rawAlerts.map((a, i) => (
                        <div key={i} className="text-gray-400 text-xs">
                          {a.date} {a.time} - {a.alert}
                        </div>
                      ))}
                    </div>
                  </div>
                </section>
              )}

              {/* Step 3: Valid Alerts */}
              {analysisResults && (
                <section className="border-2 border-green-500 rounded p-4 bg-black">
                  <h3 className="text-cyan-500 text-lg mb-3">
                    STEP 3: VALID SENSOR ALERTS
                  </h3>
                  <div className="bg-gray-950 p-3 rounded">
                    <p className="text-green-500 mb-2">
                      Found {analysisResults.validAlerts.length} valid sensor change alerts:
                    </p>
                    <div className="space-y-1">
                      {analysisResults.validAlerts.map((a, i) => (
                        <div key={i} className="text-cyan-500">
                          {a.date} {a.time} - {a.alert}
                        </div>
                      ))}
                    </div>
                  </div>
                </section>
              )}

              {/* Step 4: Clustered Events */}
              {analysisResults && (
                <section className="border-2 border-green-500 rounded p-4 bg-black">
                  <h3 className="text-cyan-500 text-lg mb-3">
                    STEP 4: CLUSTERED EVENTS
                  </h3>
                  <div className="bg-gray-950 p-3 rounded">
                    <p className="text-green-500 mb-2">
                      Confirmed sensor changes: {analysisResults.confirmedEvents.length}
                    </p>
                    <div className="space-y-1 mb-3">
                      {analysisResults.confirmedEvents.map((e, i) => (
                        <div key={i} className="text-cyan-500">
                          {e.date} {e.time} - {e.alert}
                        </div>
                      ))}
                    </div>
                    
                    {analysisResults.ambiguousGroups.length > 0 && (
                      <>
                        <p className="text-yellow-500 mb-2 flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4" />
                          Ambiguous groups: {analysisResults.ambiguousGroups.length}
                        </p>
                        <div className="space-y-1">
                          {analysisResults.ambiguousGroups.map((g, i) => (
                            <div key={i} className="text-yellow-500 text-xs">
                              Date: {g.date}, Events: {g.events.length}, 
                              Time span: {g.timeSpan.toFixed(1)} min
                            </div>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                </section>
              )}

              {/* Step 5: Upload & Storage */}
              {csvText && (
                <section className="border-2 border-green-500 rounded p-4 bg-black">
                  <h3 className="text-cyan-500 text-lg mb-3 flex items-center gap-2">
                    <Database className="w-5 h-5" />
                    STEP 5: UPLOAD & STORAGE
                  </h3>
                  <div className="flex gap-2 mb-3">
                    <button
                      onClick={handleUploadToV3}
                      className="px-4 py-2 bg-black border-2 border-green-500 text-green-500 hover:bg-gray-900 rounded"
                    >
                      Upload to V3
                    </button>
                    <button
                      onClick={checkStorage}
                      className="px-4 py-2 bg-black border-2 border-cyan-500 text-cyan-500 hover:bg-gray-900 rounded"
                    >
                      Check localStorage
                    </button>
                  </div>

                  {storageContents && (
                    <div className="bg-gray-950 p-3 rounded">
                      <p className="text-green-500 mb-2">📦 localStorage Contents:</p>
                      
                      <div className="space-y-2">
                        <div>
                          <p className="text-cyan-500">
                            Sensor Changes: {storageContents.sensorChanges.length}
                          </p>
                          <div className="ml-4 space-y-1 text-xs">
                            {storageContents.sensorChanges.map((s, i) => (
                              <div key={i} className="text-gray-400">
                                {s.date} {s.time} - {s.alert} ({s.source})
                              </div>
                            ))}
                          </div>
                        </div>

                        <div>
                          <p className="text-yellow-500">
                            Cartridge Changes: {storageContents.cartridgeChanges.length}
                          </p>
                          <div className="ml-4 space-y-1 text-xs">
                            {storageContents.cartridgeChanges.map((c, i) => (
                              <div key={i} className="text-gray-400">
                                {c.date} {c.time} ({c.source})
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="pt-2 border-t border-gray-800">
                          <p className="text-gray-500 text-xs">
                            Cache size: {storageContents.cacheSize} readings
                          </p>
                          <p className="text-gray-500 text-xs">
                            Settings: {storageContents.hasSettings ? '✓' : '✗'}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </section>
              )}

            </div>

            {/* Footer */}
            <div className="border-t-4 border-green-500 p-4 bg-gray-950">
              <p className="text-green-500 text-xs font-mono">
                AGP+ Debug Panel v1.0 | Sensor Detection Diagnostics
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
