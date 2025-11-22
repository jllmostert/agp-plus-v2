/**
 * SensorHistoryPanel.jsx - Re-export from modular architecture
 * 
 * This file has been refactored from a 1163-line monolith into a clean
 * modular architecture (Fase 3, v4.5.0).
 * 
 * New structure:
 * - SensorHistoryPanel/
 *   ├── index.jsx (orchestrator, 243 lines)
 *   ├── useSensorHistory.js (state hook, 401 lines)
 *   ├── SensorStatsPanel.jsx (184 lines)
 *   ├── SensorTable.jsx (192 lines)
 *   └── SeasonManager.jsx (354 lines)
 * 
 * Total: 1374 lines (modular) vs 1163 lines (monolith)
 * Benefit: Each file <400 lines, single responsibility, testable
 * 
 * Backwards compatibility: All consumers import from this location
 * and get the new implementation transparently.
 * 
 * Refactored: 2025-11-22
 */

export { default } from './SensorHistoryPanel/index.jsx';
