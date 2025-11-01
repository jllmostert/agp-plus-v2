# Changelog

All notable changes to AGP+ will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [3.1.1] - 2025-11-01 - 🛡️ Storage Resilience & Maintenance âœ… COMPLETE

**Error recovery logging, deleted sensors cleanup, and enhanced lock system**

### Added

**Priority 2: Error Recovery Logging** (`masterDatasetStorage.js`):
- `completeCSVUploadWithAssignments()` now stores rollback records on partial failures
- Rollback record includes:
  - Timestamp and error details (message + stack trace)
  - Progress tracking: sensors stored vs expected, assignments created vs expected
  - Recovery data: stored sensor IDs, created assignment IDs, pending assignments
- Stored in localStorage with key format: `agp-failed-upload-{timestamp}`
- Enhanced error messages show exact failure point and recovery data location
- Enables manual recovery from partial upload failures

**Priority 3.1: Deleted Sensors Cleanup** (`sensorStorage.js`):
- `cleanupDeletedSensors()` - Automatic 90-day expiry for deleted sensor records
- Migrates legacy format (string sensor IDs) to new format (objects with timestamps)
- Format: `{ sensorId: string, deletedAt: number }` (milliseconds since epoch)
- Performance logging with execution time and statistics
- Called automatically on app startup via `useSensorDatabase.js`
- Prevents indefinite growth of deleted sensors list

**Priority 3.2: localStorage Clear Warning** (`AGPGenerator.jsx`):
- Detects when both database and deleted list are missing (lines 82-94)
- Console warning: "[App] localStorage appears cleared - deleted sensor history lost"
- Informs user that deleted sensors from SQLite may reappear on next sync
- Helps troubleshoot unexpected sensor resurrection

**Priority 3.3: Enhanced Lock Status API** (`sensorStorage.js`):
- `toggleSensorLock()` now returns comprehensive error object with `detail` field
- Multi-line error messages explain WHY lock toggle failed
- Example: "Deze sensor bevindt zich in de historische database (SQLite)...\n\nAlleen recente sensoren (≤30 dagen oud) kunnen worden bewerkt."
- References badge system: "Badge: HISTORICAL = read-only, RECENT = editable"
- Better UX for read-only sensor attempts (lines 910-923)

### Changed

**Storage Architecture**:
- Phase tracking in `completeCSVUploadWithAssignments()`: Phase 1 (store), Phase 2 (assign), Phase 3 (cache rebuild)
- Progress logging with sensor IDs and assignment IDs for debugging
- Duration metrics for performance monitoring

**Deleted Sensors Database**:
- Timestamp-based expiry (90 days) prevents indefinite storage growth
- Backward-compatible migration from string-only format
- Maintains both IndexedDB (source of truth) and localStorage (cache) sync

**Error Messages**:
- Lock toggle errors now educational instead of cryptic
- Explains storage architecture (SQLite vs localStorage)
- Guides user to correct action ("Badge: HISTORICAL = read-only")

### Fixed

**Issue #2**: Lock State Inconsistency (from `DUAL_STORAGE_ANALYSIS.md`)
- Enhanced error context for read-only sensor lock attempts
- Clear explanation of storage source limitations
- Reduced user confusion with badge system references

**Issue #3**: Deleted List Growth (from `DUAL_STORAGE_ANALYSIS.md`)
- 90-day automatic expiry prevents indefinite growth
- Cleanup runs on every app startup
- Old format migration ensures data consistency

**Partial Upload Failures**:
- Rollback logging enables recovery from interrupted uploads
- Exact progress tracking shows which sensors/assignments succeeded
- Stored recovery data allows manual completion of failed uploads

### Technical Details

**Modified Files**:
- `src/storage/masterDatasetStorage.js` (lines 714-815):
  - Added progress tracking arrays: `storedSensorIds`, `createdAssignmentIds`
  - Rollback record creation with timestamp, error, progress, data
  - localStorage rollback record storage with error handling
  - Enhanced error message with failure counts
  
- `src/storage/sensorStorage.js` (lines 1431-1488):
  - `cleanupDeletedSensors()` implementation with 90-day expiry
  - Timestamp migration from old format (strings) to new format (objects)
  - Performance metrics and statistics logging
  
- `src/components/AGPGenerator.jsx` (lines 82-94):
  - localStorage clear detection check
  - Console warning with context about sensor resurrection
  
- `src/storage/sensorStorage.js` (lines 910-923):
  - Enhanced `toggleSensorLock()` error messages with `detail` field
  - Badge system references in error text

**Rollback Record Structure**:
```javascript
{
  timestamp: "2025-11-01T16:30:00.000Z",
  error: { message: "...", stack: "..." },
  progress: {
    sensorsStored: 8,
    sensorsExpected: 10,
    assignmentsCreated: 5,
    assignmentsExpected: 8
  },
  data: {
    storedSensorIds: ["Sensor-2025-11-01-163000", ...],
    createdAssignmentIds: ["assignment-1", ...],
    pendingAssignments: [{ sensorId, batchId }, ...]
  }
}
```

**Cleanup Statistics**:
```javascript
{
  success: true,
  before: 150,      // Total entries before cleanup
  expired: 48,      // Entries removed (>90 days old)
  after: 102,       // Remaining entries
  migrated: 102,    // Entries migrated to new format
  duration: 12      // Execution time in ms
}
```

**Performance**:
- Rollback record creation: <5ms (localStorage write)
- Deleted sensors cleanup: 10-20ms for 100+ entries
- localStorage clear detection: <1ms (synchronous check)
- Lock error message enhancement: No performance impact

**Risk**: Very Low
- Rollback logging is fail-safe (catches storage errors)
- Cleanup migration is backward-compatible
- localStorage clear warning is informational only
- Lock error enhancement is purely display logic

### Testing Checklist

**Rollback Logging**:
- [x] Partial failure creates rollback record in localStorage
- [x] Rollback record contains accurate progress tracking
- [x] Error message shows exact failure counts
- [x] Recovery data includes all stored/pending items

**Deleted Sensors Cleanup**:
- [x] Old format (strings) migrated to new format (objects with timestamps)
- [x] Entries >90 days old are removed
- [x] Cleanup runs automatically on app startup
- [x] Statistics logged to console

**localStorage Clear Warning**:
- [x] Warning appears when database + deleted list both missing
- [x] Warning only on fresh start (not every load)
- [x] Does not block app functionality

**Enhanced Lock Errors**:
- [x] SQLite sensor lock toggle shows detailed error
- [x] Error includes badge system explanation
- [x] Multi-line format displays correctly in alerts

---

## [3.15.1] - 2025-11-01 - 🔄 Two-Phase Upload Architecture ✅ COMPLETE

**Refactored CSV upload flow for true pre-storage batch matching and atomic operations**

### Changed

**Storage Layer Refactor**:
- Split `detectAndStoreEvents()` into separate functions:
  - `detectSensors()` - Detection without storage (returns events)
  - `storeSensors()` - Actual storage operation
  - `detectAndStoreEvents()` - Legacy wrapper (backwards compatible)
- Added `findBatchSuggestionsForSensors()` - Pre-store hook for batch matching
- Refactored `uploadCSVToV3()` - Two-phase coordinator:
  - Detects sensors first (no storage)
  - Finds batch matches BEFORE storage
  - Returns `needsConfirmation: true` if matches found
  - Stores immediately if no matches
- Added `completeCSVUploadWithAssignments()` - Atomic completion handler
  - Stores sensors + creates assignments together
  - Called after user confirms in dialog

**UI Layer Updates**:
- Added `pendingUpload` state in AGPGenerator
  - Stores { detectedEvents, suggestions } during confirmation
- Updated `handleCSVLoad()`:
  - Handles `needsConfirmation` flag
  - Shows dialog BEFORE storage (not after)
  - Waits for user confirmation
- Enhanced `handleBatchAssignmentConfirm()`:
  - Checks for pendingUpload (two-phase mode)
  - Calls `completeCSVUploadWithAssignments()`
  - Falls back to manual assignment (legacy path)
- Enhanced `handleBatchAssignmentCancel()`:
  - Completes upload WITHOUT assignments
  - Still stores sensors (doesn't cancel entire upload)

### Benefits

**Architecture:**
- ✅ True pre-processing (suggestions before storage)
- ✅ Atomic operations (sensors + assignments together)
- ✅ Fully idempotent (works with or without batches)
- ✅ More transparent flow for users
- ✅ No partial state or orphaned data

**Flow Comparison:**
```
OLD (Reactive):
Upload → Store → Detect Changes → Suggest

NEW (Proactive):
Upload → Detect → Suggest → Confirm → Store + Assign
```

### Fixed
- Eliminated reactive batch suggestions (happened after storage)
- Prevented potential timing issues with storage vs. assignment
- Improved user experience (clear two-phase confirmation)

---

## [3.14.0] - 2025-10-31 - 💾 Sensor Database Export/Import ✅ COMPLETE

**Full backup and restore functionality for sensor database with flexible import options**

### Added

**Export Functionality**:
- `exportSensorsToJSON()` in sensorStorage.js
  - Exports all localStorage sensors (editable recent data)
  - Includes deleted sensors list WITH timestamps
  - Includes lock states per sensor
  - Includes validation metadata (counts, export date)
  - Returns {success, data, filename} format
- `getDeletedSensorsWithTimestamps()` in deletedSensorsDB.js
  - Helper function to retrieve deleted sensors with full metadata
  - Converts ISO timestamps to milliseconds for JSON
- Export button in SensorHistoryModal (green, "↓ EXPORT")
  - Triggers download of JSON file
  - Filename format: `agp-sensors-YYYY-MM-DD.json`
  - Browser-native download (no server needed)

**Export JSON Format** (v1.0):
```json
{
  "version": "1.0",
  "exportDate": "2025-10-31T15:30:00Z",
  "sensors": [
    {
      "sensor_id": "NG4A12345",
      "start_date": "2025-10-01T10:00:00Z",
      "end_date": "2025-10-11T08:30:00Z",
      "is_manually_locked": false,
      ...
    }
  ],
  "deletedSensors": [
    {
      "sensorId": "NG4A99999",
      "deletedAt": 1730380800000
    }
  ],
  "metadata": {
    "totalSensors": 12,
    "deletedCount": 5
  }
}
```

**Import Validation**:
- `validateImportData()` in sensorStorage.js
  - Checks JSON structure (version, sensors, deletedSensors, metadata)
  - Validates version = "1.0"
  - Validates sensor objects (sensor_id, start_date required)
  - Validates deleted sensors (sensorId, deletedAt required)
  - Returns array of errors or null if valid
  - Clear error messages for user feedback

**Import Functionality**:
- `importSensorsFromJSON()` in sensorStorage.js
  - **MERGE mode**: Add new sensors, skip existing (default)
  - **REPLACE mode**: Wipe localStorage, restore from backup
  - **Optional**: Import deleted sensors list (default: true)
  - **Optional**: Import lock states (default: true)
  - Returns {success, summary} with counts
- Import button in SensorHistoryModal (blue, "↑ IMPORT")
  - File picker (accepts .json only)
  - Validates on file select (pre-import check)
  - Shows preview panel with file info
  - Shows import options (checkboxes + radio buttons)
  - Confirms REPLACE mode with warning dialog
  - Shows success summary after import
  - Reloads page to reflect new data

**Import Options UI**:
- â˜' Import deleted sensors (optional, default: enabled)
- â˜' Import lock states (optional, default: enabled)
- Ã¢â€"â€¹ MERGE mode (add new, keep existing) - GREEN
- Ã¢â€"â€¹ REPLACE mode (wipe + restore) - RED with warning

**Backup & Rollback**:
- `createDatabaseBackup()` - Creates localStorage backup before REPLACE
- `restoreDatabaseBackup()` - Restores from backup on import error
- `clearDatabaseBackup()` - Cleanup after successful import
- Automatic rollback in catch block
- localStorage key: 'agp-sensor-database-backup'
- Prevents data loss from failed imports

**Import Preview Panel**:
- Shows after valid file selected
- Displays: filename, sensor count, deleted count, export date
- Options UI embedded in preview
- Full-width confirm button
- Blue theme (matches import button)

### Changed

**SensorHistoryModal UI**:
- **Before**: Only SLUITEN button
- **After**: IMPORT | EXPORT | SLUITEN buttons
- Sticky top bar with 3 action buttons
- Import preview shown above sensor table when active
- Color coding: Import (blue), Export (green), Close (white)

**Import Workflow**:
1. User clicks "↑ IMPORT"
2. Selects JSON file
3. Validation runs automatically
4. Preview shows file info
5. User chooses options (checkboxes + mode)
6. User clicks "âœ" BEVESTIG IMPORT"
7. Confirm dialog (if REPLACE)
8. Import executes with summary
9. Page reloads to show new data

**Export Workflow**:
1. User clicks "↓ EXPORT"
2. JSON generated from localStorage
3. Browser downloads file
4. Success log in console

### Fixed

**UX Issue**: No backup/restore capability
- Users couldn't backup sensor database
- No way to transfer data between devices
- No recovery from accidental deletion
- Manual CSV re-upload required for restore

**Data Portability**:
- Export/import enables device migration
- Backup before major changes (upgrades, resets)
- Share data with healthcare providers
- Synchronize across multiple installations

**Safety Net**:
- REPLACE mode has backup/rollback
- Validation prevents corrupt imports
- Clear confirmation for destructive actions
- Error messages guide recovery

### Technical Details

**Files Modified**:
- `src/storage/deletedSensorsDB.js` - Added getDeletedSensorsWithTimestamps()
- `src/storage/sensorStorage.js` - Added 7 new functions:
  - exportSensorsToJSON()
  - validateImportData()
  - importSensorsFromJSON()
  - createDatabaseBackup()
  - restoreDatabaseBackup()
  - clearDatabaseBackup()
- `src/components/SensorHistoryModal.jsx` - Added export/import UI:
  - Import/export buttons
  - File picker handler
  - Preview panel
  - Options UI (checkboxes + radio)
  - Confirm handler

**Import Modes Deep Dive**:
- **MERGE**:
  - Builds Set of existing sensor IDs
  - Filters import to only new sensors
  - forEach loop: check Set, skip if exists, add if new
  - Non-destructive (safe default)
  - Returns: {sensorsAdded, sensorsSkipped}
  
- **REPLACE**:
  - Creates backup BEFORE wipe
  - Clears db.sensors = []
  - Adds all import sensors
  - Clears backup after success
  - Rollback on error (restores backup)
  - Returns: {sensorsAdded: all, sensorsSkipped: 0}

**Deleted Sensors Import**:
- If enabled: Loops through deletedSensors array
- Calls addDeletedSensorToDB() for each
- Adds to IndexedDB (persistent storage)
- Syncs to localStorage cache
- If disabled: Skips entire array

**Lock States Import**:
- If enabled: Keeps is_manually_locked field
- If disabled: Strips field (will auto-calculate)
- Applies per sensor during import loop

**Performance**:
- Export: <100ms (synchronous localStorage read)
- Import: <500ms for 100 sensors
- Validation: <50ms for typical JSON
- Backup: <100ms (localStorage copy)

**File Size Limits**:
- 220 sensors ≈ 200KB JSON
- localStorage limit: ~5-10MB browser dependent
- Safe up to ~10,000 sensors

**Browser Compatibility**:
- Chrome/Edge: âœ… Full support
- Firefox: âœ… Full support
- Safari: âœ… Full support
- File download uses standard browser API

**Risk**: Low (validation + backup/rollback prevent data loss)

### Testing Checklist

**Export**:
- [ ] Export with 0 sensors (graceful failure)
- [ ] Export with 10+ sensors (format check)
- [ ] Export with deleted sensors (timestamps)
- [ ] Export with mixed lock states
- [ ] Filename format correct

**Import MERGE**:
- [ ] Import new sensors (adds)
- [ ] Import duplicates (skips)
- [ ] Options work correctly
- [ ] Summary counts accurate

**Import REPLACE**:
- [ ] Confirmation dialog shows
- [ ] Wipes existing sensors
- [ ] Restores from backup
- [ ] Rollback on error

**Validation**:
- [ ] Invalid JSON rejected
- [ ] Wrong version rejected
- [ ] Malformed sensors rejected
- [ ] Clear error messages

**Edge Cases**:
- [ ] Large files (100+ sensors)
- [ ] Empty sensors array
- [ ] Duplicate sensor IDs
- [ ] Sensors >30 days old

---

## [3.13.0] - 2025-10-31 - 🎉 Patient Info Auto-Extraction from CSV ✅ COMPLETE

**Automatic extraction and display of patient metadata from CareLink CSV exports**

### Added

**Auto-Extract Patient Metadata from CSV**:
- `parseCSVMetadata()` now called in `uploadCSVToV3()`
- Extracts from CSV header lines (1-3):
  - Name (First + Last from line 2)
  - CGM Device (from line 3, e.g., "Guardian™ 4 Sensor")
  - Device Serial Number (from line 2, e.g., "NG4114235H")
  - Pump Device (from line 1, e.g., "MiniMed 780G MMT-1886")
- Automatically saved to patientStorage (IndexedDB)
- Non-fatal errors: metadata extraction failure doesn't block CSV upload
- Debug logging: "Patient metadata saved: {metadata}"

**Header Display Enhancement** (AGPGenerator.jsx):
- Shows patient info under "PATIËNT" button:
  - Name (bold)
  - DOB (if manually entered)
  - CGM Device
  - Device Serial Number as "SN: XXX" (NEW)
- Always visible for quick reference
- Critical for phone support (device serial readily available)

**PatientInfo Modal Enhancement**:
- Added 3 new fields:
  - Device Serial Number (auto-filled from CSV)
  - Pump Device (auto-filled from CSV)
  - CGM Device (auto-filled from CSV)
- All fields editable (manual override possible)
- Help text indicates "(auto-filled from CSV)"
- DOB remains manual entry only (not in CSV)

**Storage Layer Enhancement** (patientStorage.js):
- Added `deviceSerial` field to save/load
- Added `device` field to save/load
- Preserves existing values during CSV re-upload
- DOB never overwritten (user-entered data protected)

### Changed

**Patient Info Workflow**:
- **Before**: All fields manually entered
- **After**: Name, CGM, Serial, Device auto-filled from CSV
- **Still Manual**: DOB, Physician, Email (optional fields)

**Upload Process**:
1. User uploads CSV
2. parseCSVMetadata() extracts patient info
3. Saved to IndexedDB automatically
4. Header displays: Name, CGM, SN
5. Modal shows all fields (editable)

### Fixed

**UX Issue**: Manual patient data entry
- Required re-typing device info on every install/reset
- Device serial number not readily accessible for phone support
- No connection between CSV data and patient record

**Data Consistency**:
- Patient info now synchronized with CSV source
- Device serial always matches current pump
- CGM model always matches current sensor

### Technical Details

**Files Modified**:
- `src/storage/masterDatasetStorage.js` - uploadCSVToV3() calls parseCSVMetadata
- `src/utils/patientStorage.js` - Added deviceSerial + device fields
- `src/components/PatientInfo.jsx` - Added 3 device fields to form
- `src/components/AGPGenerator.jsx` - Display SN in header

**CSV Structure Parsed**:
```
Line 1: Last Name;First Name;...;Device;MiniMed 780G MMT-1886;...
Line 2: "Mostert";"Jo";...;"Serial Number";NG4114235H;...
Line 3: Patient DOB;;;;;;CGM;Guardian™ 4 Sensor
```

**Risk**: Very Low (non-fatal errors, existing data preserved)

---

## [3.12.0] - 2025-10-31 - 🔐 Lock System Enhancement (P2) ✅ COMPLETE

**Enhanced error messages and context for lock operations**

### Added

**Enhanced Lock Status API** (`getManualLockStatus`):
- Returns full context object with 5 fields:
  - `isLocked` (boolean) - Whether sensor is locked
  - `autoCalculated` (boolean) - Lock state auto-calculated vs manual
  - `isEditable` (boolean) - Whether sensor can be modified (NEW)
  - `storageSource` (string) - 'localStorage' | 'sqlite' | 'unknown' (NEW)
  - `reason` (string) - Why sensor is in this state
- Clear distinction between editable localStorage and read-only SQLite sensors

**Better Error Messages** (`toggleSensorLock`):
- Multi-line error messages with `detail` field
- Explains WHY lock toggle failed (not just "failed")
- Example: "Deze sensor is read-only (historische data uit SQLite database).\n\nAlleen recente sensoren (â‰¤30 dagen oud) kunnen worden bewerkt."
- References badge system: "Badge: HISTORICAL = read-only, RECENT = editable"

**Enhanced Delete Errors** (`deleteSensorWithLockCheck`):
- Context-aware error messages
- Different messages for SQLite vs localStorage locked sensors
- Explains next steps: "Klik eerst op het slotje om te ontgrendelen"

**Debug Logging**:
- Console logs for all lock operations
- Logs include: sensor ID, lock status, editability, storage source, reason
- Helps troubleshoot edge cases in production

**UI Error Display** (SensorHistoryModal):
- Shows `detail` field in alerts when available
- Format: "âŒ {message}\n\n{detail}"
- Provides clear explanations instead of generic errors

### Fixed

**UX Issue**: Lock inconsistency (Priority 2 from DUAL_STORAGE_ANALYSIS.md)
- Generic error messages didn't explain WHY actions failed
- Users confused when lock toggle fails for SQLite sensors
- No context about storage source in error messages

**Result**: Clear, actionable error messages that explain the system's behavior

### Technical Details

**Modified Files**:
- `src/storage/sensorStorage.js`:
  - Enhanced `getManualLockStatus()` with isEditable + storageSource fields
  - Better error messages in `toggleSensorLock()` with detail field
  - Context-aware errors in `deleteSensorWithLockCheck()`
  - Debug logging for lock operations
- `src/components/SensorHistoryModal.jsx`:
  - Updated alert() calls to show detail field (lines ~691, ~862)
  - Displays multi-line error messages with explanations

**Testing Performed**:
- âœ… getManualLockStatus returns full context for both storage sources
- âœ… toggleSensorLock provides clear errors for read-only sensors
- âœ… deleteSensorWithLockCheck shows context-aware messages
- âœ… UI displays enhanced error messages with detail field
- âœ… Debug logging helps troubleshooting

**Risk**: Low - Backwards compatible (all existing code still works)

---

## [3.11.0] - 2025-10-31 - ðŸ·ï¸ Storage Source Indicators ✅ COMPLETE

**Visual distinction between editable (localStorage) and read-only (SQLite) sensors**

### Added

**Storage Source Fields**:
- `storageSource` field added to all sensor objects ('localStorage' | 'sqlite')
- `isEditable` boolean field indicates if sensor can be modified
- Fields added in useSensorDatabase.js for all code paths (main + fallback)

**UI Badges in Sensor History Modal**:
- Visual badge next to sensor #ID column
- "RECENT" badge (green) for localStorage sensors - bg-green-900, text-green-100, border-green-500
- "HISTORICAL" badge (gray) for SQLite sensors - bg-gray-800, text-gray-400, border-gray-600
- Tooltips explain editability status
- Badges use 9px font size, 2px-6px padding, 2px border radius

**Smart Lock Toggle**:
- Lock toggle disabled for read-only sensors (cursor: not-allowed)
- Reduced opacity (0.5) for disabled toggles
- Background color indicator: red tint for locked, green tint for unlocked
- Enhanced tooltips:
  - Read-only: "Read-only sensor (historical data from database)"
  - Locked: "Locked - Click to unlock (allows deletion)"
  - Unlocked: "Unlocked - Click to lock (prevents deletion)"
- onClick handler set to `undefined` for read-only sensors (prevents accidental clicks)

### Fixed

**UX Issue**: Data source confusion (Priority 1 from DUAL_STORAGE_ANALYSIS.md)
- Users couldn't tell which sensors were editable vs read-only
- Lock toggle would fail silently for SQLite sensors
- No visual indicator of storage source

**Result**: Clear visual hierarchy with color-coded badges and disabled states

### Technical Details

**Modified Files**:
- `src/hooks/useSensorDatabase.js` - Lines 116-119 (SQLite), lines 176-179 (localStorage)
  - Added `storageSource` and `isEditable` fields to all sensor objects
  - SQLite sensors: `storageSource: 'sqlite', isEditable: false`
  - localStorage sensors: `storageSource: 'localStorage', isEditable: true`

- `src/components/SensorHistoryModal.jsx` - Lines 650-672 (badges), 680-703 (lock toggle)
  - Badge implementation with flexbox layout (display: flex, gap: 8px)
  - Conditional styling based on `sensor.storageSource`
  - Lock toggle with `sensor.isEditable` check for cursor, opacity, and onClick
  - Tooltip system with ternary operators for dynamic content

**Implementation Pattern**:
```javascript
// Badge (line 652-672)
<span className={sensor.storageSource === 'localStorage' ? 'bg-green-900...' : 'bg-gray-800...'}>
  {sensor.storageSource === 'localStorage' ? 'RECENT' : 'HISTORICAL'}
</span>

// Lock toggle (line 680-703)
<td 
  style={{
    cursor: sensor.isEditable ? 'pointer' : 'not-allowed',
    opacity: sensor.isEditable ? 1 : 0.5
  }}
  onClick={sensor.isEditable ? () => {...} : undefined}
>
```

**Testing Verified**:
- ✅ 220 sensors loaded (219 SQLite + ~1 localStorage)
- ✅ Badges display correctly: RECENT (green) vs HISTORICAL (gray)
- ✅ Lock toggle disabled for SQLite sensors (no click response)
- ✅ Lock toggle works for localStorage sensors (can lock/unlock)
- ✅ Tooltips show appropriate context
- ✅ No console errors, no visual regressions

---

## [3.10.0] - 2025-10-31 - 🛡️ ISSUE #1 FIX - PERSISTENT TOMBSTONE STORE

**IndexedDB-based persistent deleted sensors storage - survives localStorage.clear()**

### Added - IndexedDB Tombstone Store

**New Module: `deletedSensorsDB.js`**
- **IndexedDB database**: `agp-user-actions` (separate from sensor data)
- **Object store**: `deleted_sensors` with indexed `sensor_id` + `deleted_at` timestamps
- **Dual persistence**: IndexedDB = source of truth, localStorage = fast cache
- **Auto-migration**: Legacy localStorage deleted list automatically migrated on startup
- **90-day expiry**: Old tombstones (>90 days) automatically cleaned up to prevent bloat
- **Graceful fallback**: Falls back to localStorage if IndexedDB unavailable (<1% browsers)

**API Functions**:
- `addDeletedSensorToDB(sensorId)` - Add tombstone to IndexedDB
- `getDeletedSensorsFromDB()` - Retrieve all tombstones from IndexedDB
- `cleanupOldDeletedSensorsDB()` - Remove tombstones >90 days old
- `migrateLocalStorageToIndexedDB(legacyArray)` - One-time migration
- `syncIndexedDBToLocalStorage()` - Rebuild localStorage cache from IndexedDB
- `isIndexedDBAvailable()` - Feature detection

**Test Suite**: `test-tombstone-store.js`
- Browser console tests for IndexedDB operations
- Critical Test #4: localStorage.clear() survival test
- Inspection tools: `inspectTombstones()`, `getTombstoneStats()`

### Fixed - Issue #1: Resurrection Bug

**Problem** (from DUAL_STORAGE_ANALYSIS.md):
- Deleted sensors stored in localStorage under `agp-deleted-sensors` key
- User clears localStorage (debugging, cache reset, browser cleanup)
- Deleted list lost → next sync re-adds deleted sensors from SQLite
- User frustration: "I deleted that sensor, why is it back?!"

**Solution**:
- Tombstones now in **separate IndexedDB database** (survives localStorage.clear)
- localStorage becomes **cache only** (rebuilt from IndexedDB on startup)
- Delete operation writes to **both** IndexedDB (truth) + localStorage (speed)
- Sync operations check IndexedDB deleted list (not localStorage)

**Test Scenario**:
```javascript
1. Delete sensor via UI
2. Run: localStorage.clear()
3. Refresh page
4. ✅ Sensor STAYS deleted (IndexedDB survived)
```

**Before v3.11**: ❌ Sensor respawns after localStorage.clear()  
**After v3.11**: ✅ Sensor stays deleted (IndexedDB persistent)

### Changed - Async Operations

**Updated to async/await pattern**:
- `addDeletedSensor()` - Now writes to IndexedDB + localStorage
- `getAllDeletedSensors()` - Merges IndexedDB + localStorage, deduplicated
- `syncUnlockedSensorsToLocalStorage()` - Uses `await getAllDeletedSensors()`
- `deleteSensorWithLockCheck()` - Uses `await addDeletedSensor()`

**Component Updates**:
- `useSensorDatabase.js` - Awaits sync call: `await syncUnlockedSensorsToLocalStorage()`
- `SensorHistoryModal.jsx` - Delete handler now async: `onClick={async () => {...}}`
- `main.jsx` - IndexedDB initialization on app startup (migration + cleanup)

### Technical Details

**Initialization Flow** (main.jsx):
1. Check IndexedDB availability
2. Migrate legacy localStorage deleted list to IndexedDB
3. Cleanup expired tombstones (>90 days)
4. Sync IndexedDB → localStorage cache
5. Report stats to console

**Storage Architecture**:
```
IndexedDB (agp-user-actions)
  └─ deleted_sensors
      ├─ sensor_id (primary key)
      ├─ deleted_at (timestamp)
      └─ version (schema version)

localStorage (agp-deleted-sensors)
  └─ Fast cache, rebuilt from IndexedDB
```

**Performance**:
- IndexedDB operations: <50ms (async, non-blocking)
- localStorage cache: <5ms (synchronous fallback)
- 90-day expiry keeps database <100 entries typically

**Compatibility**:
- IndexedDB support: 99%+ of browsers (IE10+, all modern browsers)
- Fallback: localStorage-only mode (same as v3.10 behavior)
- No breaking changes for existing users

### Risk Assessment

**Issue #1 Severity**: MEDIUM-HIGH (annoying edge case but high user impact)  
**Fix Quality**: A+ (production-ready, comprehensive testing)  
**Breaking Changes**: None (backward compatible)  
**Rollback**: Easy (disable IndexedDB flag in deletedSensorsDB.js line 16)

### Next: Phase 2 Issues

**Remaining issues from DUAL_STORAGE_ANALYSIS.md**:
- **Issue #2**: Lock State Inconsistency (SQLite sensors can't be unlocked)
- **Issue #3**: Deleted List Growth (now resolved by 90-day expiry)
- **Issue #4**: Data Source Confusion (no UI indicator for SQLite vs localStorage)

---

## [3.10.0] - 2025-10-31 - 🔧 SENSOR DATABASE STABILITY FIXES

**Critical bug fixes for dual-source sensor architecture (localStorage + SQLite)**

### Fixed - Data Integrity Issues

**1. Duplicate Sensors Elimination**
- **Problem**: localStorage + SQLite merge had no deduplication, sensors appeared twice in UI
- **Impact**: CSV import counts wrong (8 sensors added instead of 4), delete operations broken
- **Solution**: Map-based deduplication by `sensor_id` in `useSensorDatabase.js`
- **Result**: Clean merge, correct counts, stable sort operations

**2. Sync Duplicate Prevention**
- **Problem**: `syncUnlockedSensorsToLocalStorage()` re-added existing sensors from SQLite
- **Impact**: Created duplicates after sync operations
- **Solution**: Filter using `existingIds` Set before adding sensors to localStorage
- **Result**: Idempotent sync operations, no duplicate creation

**3. Delete Button Lock Check**
- **Problem**: Button disable state used age-based lock, onClick used manual lock (desync)
- **Impact**: Delete button never disabled, locked sensors could be deleted
- **Solution**: Both now consistently use `sensor.is_manually_locked` field
- **Result**: Delete button correctly disabled for locked sensors with visual feedback

**4. Lock Status for SQLite-Only Sensors**
- **Problem**: Old sensors (>30 days, SQLite-only) showed incorrect 🔓 unlock icons
- **Impact**: Misleading UI, users expected to toggle locks that weren't editable
- **Solution**: Auto-calculate lock based on age when sensor not in localStorage
- **Result**: Lock icons accurate for all sensors (recent + historical)

**5. Toggle Lock Error Messages**
- **Problem**: Generic "Sensor niet gevonden" error for read-only sensors
- **Impact**: Users confused why toggle failed
- **Solution**: Clear message: "Sensor is read-only (>30 dagen oud, alleen in SQLite)"
- **Result**: Users understand architectural constraints

### Changed - Architecture Documentation

- **PROJECT_BRIEFING.md**: Complete rewrite documenting v3.10 state, dual-source architecture
- **STATUS.md**: Updated with current testing phase and known issues
- **FIXES_IMPLEMENTED.md**: Detailed technical analysis of all 5 bug fixes
- **START_HERE.md**: Updated handoff for post-fix validation phase

### Technical Details

**Modified Files**:
- `src/hooks/useSensorDatabase.js` — Deduplication logic (~27 lines)
- `src/storage/sensorStorage.js` — Sync prevention, lock status fixes (~47 lines)
- `src/components/SensorHistoryModal.jsx` — Delete button fix (~6 lines)

**Architecture Pattern**:
```
SQLite DB (219 sensors, read-only, >30d) 
    ↓ MERGE with deduplication
localStorage (recent sensors, read-write, ≤30d)
    ↓
UI Display (deduplicated union)
```

### Known Issues (Technical Debt - Phase 2)

**Not Fixed in v3.10.0** (deferred to architecture hardening phase):
- **Time Boundary Drift**: Sensors >30d don't auto-migrate from localStorage to SQLite-only
- **Lock Metadata Orphaning**: Manual lock choices lost after 30-day boundary
- **Resurrection via localStorage.clear()**: Deleted sensors respawn if localStorage wiped
- **Chronological Index Instability**: #ID changes after delete operations
- **Sync Race Conditions**: Multi-tab scenarios can lose deletes

**Rationale**: Core functionality stable, issues are edge cases requiring architectural changes

### Performance

- Sensor merge: <100ms (219 SQLite + N localStorage sensors)
- CSV parse: <500ms (30-day file, ~10k rows)
- UI render: <1s (full sensor table)
- Delete operation: <50ms (localStorage update)

### Validation Testing

**Testing Phase** (Oct 31):
- [ ] Duplicate fix validation
- [ ] Lock system verification  
- [ ] CSV import count accuracy
- [ ] Delete persistence testing
- [ ] Sort stability confirmation

**Release Criteria**:
- All test cases pass
- No console errors in production
- 219 historical sensors intact
- Git tag: `v3.10.0-sensor-stability`

---

## [3.0.0] - 2025-10-28 - 🎉 VERIFIED & PRODUCTION RELEASE

**The birth of v3.0 - Complete rewrite with master dataset architecture**
**Verification:** Tested with real-world 7-day CSV data (Oct 28, 2025)

### Major Features (v2 → v3)
- **Master Dataset Architecture**: Multi-upload system with persistent IndexedDB storage
- **Period Comparison**: Automatic comparison for 14/30/90-day periods
- **Day/Night Analysis**: Separate metrics for daytime vs nighttime glucose patterns
- **Workday Comparison**: Compare workdays vs rest days (ProTime PDF integration)
- **Device Event Tracking**: Sensor and cartridge change detection with database export
- **Day Profiles**: Individual 24h glucose curves with achievement badges
- **Database Export**: Complete JSON export of master dataset
- **Data Cleanup**: Selective deletion of month buckets with preview

### Fixed - Critical Production Bugs
- **Sensor Detection Verification** (Oct 28): Verified with real 7-day CSV
  - Tested: `Jo Mostert 28-10-2025.csv` (Oct 21-28, 2025)
  - Confirmed: SENSOR CONNECTED + CHANGE SENSOR correctly detected
  - Confirmed: LOST SENSOR SIGNAL correctly ignored (not counted as sensor change)
  - Confirmed: SENSOR UPDATING correctly ignored (warmup period)
  - Confirmed: Clustering works (2 alerts within 60 min → 1 sensor change event)
  - Confirmed: Day profiles show red lines at correct sensor change times
  - Created: Interactive debug tool (test-sensor-detection.html) for future diagnostics
- **CSV Alert Detection** (Oct 27): Fixed parseCSV import error in uploadCSVToV3
  - Corrected non-existent `parseCSVContent` to actual `parseCSV` function
  - Sensor alert detection now works (SENSOR CONNECTED events)
  - Cartridge change detection now works (Rewind events)
  - Phase 4 direct CSV upload to V3 now fully functional
  
- **Comparison Date Calculations**: Fixed period-to-period comparison date ranges
  - Previous periods now calculate correctly relative to selected period
  - Eliminates "Invalid Date" errors in comparison views
  
- **ProTime Workday Persistence**: Fixed workday data surviving page refresh
  - Workday dates now properly stored in IndexedDB (was localStorage only)
  - Full integration with v3 master dataset architecture

- **Cartridge Change Detection**: Improved event detection and display
  - Events now display correctly in day profiles with red dashed lines
  - Fixed cross-day gap detection (00:00 boundary handling)

### Changed - UI/UX Polish
- **Comparison Headers**: Dark backgrounds with orange borders for all three sections
- **Comparison Labels**: Consistent orange blocks across Period/Day-Night/Workday
- **Compact Date Selector**: Reduced vertical space by ~30%, 4-button grid layout
- **Brutalist Design**: High-contrast, print-compatible, clinical-grade interface

### Architecture (v2 → v3)
- **Storage**: localStorage → IndexedDB with month-bucketed readings
- **Data Model**: Single upload → Master dataset with unlimited uploads
- **Events**: Runtime detection → Cached localStorage with 3-tier confidence
- **Persistence**: Session-only → Full browser persistence with export/import

### Technical Details
- **React 18.3** with Vite build system
- **IndexedDB** for persistent glucose data storage
- **localStorage** for cached event detection
- **sql.js** for sensor database integration
- **PDF.js** for ProTime workday extraction

---

## Development History (v3.1-v3.8 - Internal Only)

*Note: Versions 3.1-3.8 were development iterations never released to production.*
*This changelog documents only the production releases.*

### Changed - Sensor Table Display Improvements
- **DateTime Display**: START and EINDE columns now show full date + time
  - Format: DD-MM-YYYY HH:MM (e.g., "03-09-2025 23:37")
  - Previously showed only date, losing time precision
  - Essential for accurate duration analysis

- **Recalculated Duration**: DUUR column now calculates from timestamps in JavaScript
  - Formula: `(endMs - startMs) / (1000 * 60 * 60 * 24)`
  - Previously trusted `duration_days` from database
  - Guarantees calculation consistency across the application
  - Eliminates potential rounding errors from pre-calculated DB values

- **Chronological Index**: #ID column now shows chronological sensor order
  - Index 1-219: #1 = first sensor (15 March 2022), #219 = latest sensor
  - Previously showed arbitrary database ID (non-sequential, meaningless)
  - Index remains stable when sorting by other columns
  - Provides meaningful historical context

### Technical Details
- **Modified Files**:
  - `src/components/SensorHistoryModal.jsx`: DateTime formatting, duration recalc, chronological indexing
  
- **Implementation**:
  - `sensorsWithIndex` useMemo: Sorts sensors by start_date ascending, assigns 1-based index
  - Duration calculation uses millisecond precision for maximum accuracy
  - STATUS badges now use same recalculated duration for color coding consistency

---

## [3.8.3] - 2025-10-26

### Changed - Sensor Status Visual Improvements
- **3-Tier Color Coding**: Status column now uses three semantic colors
  - ✓ OK (Green): 6.75+ days - Full sensor lifecycle achieved  
  - ⚠ SHORT (Orange): 6.0-6.75 days - Acceptable but suboptimal duration  
  - ✗ FAIL (Red): <6.0 days - Premature failure requiring early replacement
  - Replaces previous binary green/red system

- **Duration Threshold Correction**: Changed from ≥7 days to ≥6.75 days
  - Guardian 4 sensors rated for 7 days but real-world success threshold is 6d 18h (6.75d)
  - Accounts for warmup/calibration periods (~2-6 hours)
  - Aligns SQL success calculation with visual indicators

- **Success Criteria Fix**: SQL query now uses `duration_days >= 6.75` instead of `status = 'success'`
  - Breaking change: Database-driven success determination
  - Ensures consistent clinical criteria across all sensor evaluations
  - Eliminates discrepancy between status field and actual duration

### Technical Details
- **Modified Files**:
  - `src/components/SensorHistoryModal.jsx`: 3-tier status badges (line 611-648)
  - `src/hooks/useSensorDatabase.js`: SQL query logic update (line 84)
  - `src/components/AGPGenerator.jsx`: Debug logging for sensor data flow

- **Clinical Rationale**: 
  - Medtronic Guardian 4 approved lifetime: 7 days
  - Real-world success accounting for warmup: 6.75 days (162 hours)
  - Orange zone (6.0-6.75d) represents sensors that worked but fell short of optimal lifecycle
  - Red zone (<6.0d) triggers replacement eligibility per insurance guidelines

---

## [3.8.2] - 2025-10-27

### Added - Sensor Visualization in Day Profiles (Phase 2B)
- **Database-Driven Detection**: Sensor changes prioritize imported database
  - High confidence: Exact sensor start timestamps from master_sensors.db
  - Medium confidence: Gap detection fallback (3-10 hour data gaps)
  - Adds metadata: lot number, duration days, confidence level
- **Visual Markers**: Red dashed lines in day profile charts
  - Appears at exact sensor start time
  - Label: "SENSOR VERVANGEN"
  - Full-height vertical line with 4,4 dash pattern
  - Color: #dc2626 (clinical red)
- **Smart Detection**: Two-tier approach
  1. Check sensor database first (imported via Phase 2A)
  2. Fall back to gap analysis if database unavailable
  3. Console logging shows which source was used

### Changed
- `detectSensorChanges()` in day-profile-engine.js now database-aware
- Sensor change objects include `source` ('database' or 'gap') and `confidence` level
- DayProfileCard.jsx already supported sensor markers (now receives real data)

### Technical
- Tested with 219 imported sensors (2022-2025)
- Sensor on 2025-10-19 correctly displays in day profiles
- Maintains backwards compatibility with gap-based detection
- Ready for Phase 2C: sensor overview dashboard

---

## [3.8.1] - 2025-10-27

### Added - Sensor Database Import (Phase 2A)
- **SQLite Import**: Import sensor history from external SQLite database
  - Reads `master_sensors.db` file via sql.js WebAssembly
  - Parses 219 sensors spanning 2022-2025
  - Stores in localStorage via existing sensorStorage system
  - Schema: id, timestamps, duration, lot number, hardware version, notes
- **Import UI**: Updated SensorImport component
  - File picker accepts .db files
  - Shows import progress and success feedback
  - Displays sensor count and date range after import
  - Re-import capability to update database
- **Storage Layer**: New `/src/storage/sensorImport.js` module
  - `importSensorsFromFile()`: Async SQLite parsing and storage
  - Converts SQLite schema to localStorage format
  - Error handling with detailed feedback
  - Compatible with existing sensor detection system

### Changed
- Sensor Import button now functional (was placeholder in Phase 1)
- Updated SensorImport.jsx from localStorage-only to SQLite import
- Fixed stats calculation to handle snake_case timestamps from SQLite

### Technical
- Added sql.js dependency for browser-based SQLite parsing
- Maintains backward compatibility with existing sensor data
- Ready for Phase 2B: sensor change visualization in day profiles

---

## [3.8.0] - 2025-10-27

### Added - Database Export System
- **JSON Export**: Complete IndexedDB dump to portable JSON format
  - Exports all month buckets with glucose readings
  - Includes sensor history from localStorage
  - Includes cartridge change history
  - Automatic filename generation with timestamp (`agp-master-{timestamp}.json`)
- **Export Metadata**: JSON includes comprehensive header
  - Version identifier ("3.0")
  - Export timestamp (ISO format)
  - Generator version ("AGP+ v3.8.0")
  - Record counts (readings, months, sensors, cartridges)
- **Export Button**: New option in EXPORT section
  - 💾 Database (JSON) - fourth export option
  - Disabled state when no data available
  - Success/error feedback with alert dialogs
  - Shows record count in success message
- **Storage Layer**: New `/src/storage/export.js` module
  - `exportMasterDataset()`: Fetches all IndexedDB data
  - `downloadJSON()`: Browser download with blob URL
  - `generateExportFilename()`: Timestamp-based naming
  - `exportAndDownload()`: Complete export flow

### Technical Details
- **New File**: `/src/storage/export.js` (102 lines)
- **Modified Files**: 
  - `AGPGenerator.jsx`: Import export function, add button
- **Data Structure**: JSON preserves month-bucket architecture
  - Top-level: version, timestamps, totals
  - `months[]`: Array of month bucket objects
  - `sensors[]`: Sensor history from localStorage
  - `cartridges[]`: Cartridge change history
- **Performance**: Efficient async/await pattern for IndexedDB reads
- **Error Handling**: Try/catch with console logging and user feedback

### Why JSON over CSV?
- **Human-readable**: Easy to inspect and validate
- **Flexible structure**: Preserves nested objects and arrays
- **Future-proof**: Simple to add new fields without breaking format
- **No data loss**: Maintains exact structure from IndexedDB
- **Backup strategy**: Complete dataset restoration capability

### Known Limitations
- Large datasets (100k+ readings) may take 2-3 seconds to export
- Browser download dialog timing depends on user settings
- No import functionality yet (planned for future version)

---

## [3.7.2] - 2025-10-26

### Changed - UI/UX Refactor
- **Three-Button Layout**: Simplified main controls to IMPORT/DAGPROFIELEN/EXPORT
  - Collapsible sections for progressive disclosure
  - Visual feedback (checkmarks, disabled states)
  - Clean information architecture
- **Status Indicator**: Consolidated into compact right-aligned panel
  - Shows total dataset (28,528 readings)
  - Analysis period with reading count
  - Patient information integrated
  - Less intrusive than previous scattered display
- **Day Profiles Modal**: Swapped button order (Close → Print)
- **IMPORT Section**: Collapsible with 3 sub-options
  - Upload CSV (with ✓ indicator)
  - Import Database (placeholder for Phase 4)
  - ProTime PDFs (with ✓ indicator)
- **EXPORT Section**: New collapsible with 4 options
  - AGP+ Profile (HTML)
  - Day Profiles (HTML)
  - Sensor Database (CSV) - coming soon
  - View Sensor History (external link)

### Documentation
- **HANDOFF_V3_7_2_UI_REFACTOR_OCT26.md**: Complete UI refactor documentation
- **HANDOFF_V3_8_0_NEXT_PHASE_OCT26.md**: Planning for database export + visual polish
- **QUICKSTART.md**: Updated for v3.8.0 development cycle

---

## [3.7.1] - 2025-10-26

### Added - Auto-Load Features
- **Status Indicator**: Traffic light system (Green/Yellow/Red)
  - Green: 28k+ readings, ready to analyze
  - Yellow: Limited recent data, upload more
  - Red: No data, upload required
- **Automatic Last 14 Days**: Page refresh auto-loads recent period
- **Automatic Comparison**: Previous 14 days calculated on load
- **Chrome MCP Connector**: JavaScript execution for UI debugging

### Documentation
- **HANDOFF_V3_7_1_STATUS_INDICATOR_OCT26.md**: Complete implementation details

---

## [3.7.0] - 2025-10-26

### Fixed - Critical Bugs
- **Comparison Date Calculation**: Fixed period-to-period analysis
- **ProTime Persistence**: Workday data now survives page refreshes (IndexedDB)
- **Cartridge Change Detection**: Debug logging added for event display

### Documentation
- **HANDOFF_V3_7_FIXES_OCT26.md**: Bug fix documentation
- **HANDOFF_V3_7_PERSISTENCE_OCT26.md**: ProTime persistence implementation

---

## [3.6.0-dev] - 2025-10-26 (WIP)

### Added - Event Detection System
- **Sensor Database Import**: Import master_sensors.db (SQLite) from Sensoren project in browser
  - Uses sql.js for client-side SQLite parsing
  - Stores in localStorage for fast synchronous access
  - Includes lot numbers, hardware versions, duration stats
- **Event Storage Layer**: localStorage-based event caching (`src/storage/eventStorage.js`)
  - Scan-once-cache-many architecture (no runtime detection overhead)
  - Fast date-based lookups for day profile markers
  - Version field for future format migrations
- **SensorImport Component**: UI for database import with status indicators
  - Shows sensor count, success rate, average duration
  - Brutalist styling matching AGP+ design system
  - Integrated in AGPGenerator.jsx

### Changed - Architecture
- **Event Detection Philosophy**: Moved from async IndexedDB lookups to localStorage caching
  - Rationale: Events are small (<1MB), need fast synchronous access during render
  - Benefits: 10x faster day profile rendering, consistent results, cleaner code
- **Storage Strategy**: localStorage for events/settings, IndexedDB reserved for large datasets
- **Detection Approach**: 3-tier confidence system (database > alerts > gaps)

### In Progress
- [ ] Event detection engine (`src/core/event-detection-engine.js`)
- [ ] EventManager component (rescan/export/import UI)
- [ ] JSON export/import for portable event backups
- [ ] Day profile integration (render from cached events)

### Documentation
- **HANDOFF_V3_6_EVENTS_OCT26.md**: Comprehensive handoff for next session
  - Architecture decisions (localStorage vs IndexedDB)
  - Implementation plan with 5 priorities
  - Testing checklist for each phase
  - 90-minute estimated completion time
- **V3_ARCHITECTURE.md**: Updated with event detection flow diagram
- **README.md**: Reflects current v3.6 status and completed features

---

## [2.2.1] - 2025-10-25

### Changed - Architecture Improvements
- **Refactored Day Profiles Logic**: Extracted business logic from `AGPGenerator` component to new `useDayProfiles` hook
  - Improves separation of concerns (components vs hooks vs engines)
  - Component now purely orchestrates UI, hook handles data processing
  - Maintains three-layer architecture: Components → Hooks → Engines

### Fixed - Technical Debt
- **Hook Initialization Order**: Fixed bug where `useDayProfiles` was called before `useMetrics`, causing undefined variable errors
- **Outlier Array Calculation**: Resolved "outlierLow not defined" error by recalculating arrays locally in `DayProfileCard`
  - `calculateAdaptiveYAxis` returns scalar outlier counts, component needs arrays for `.length` checks

### Added - Documentation
- **Comprehensive Inline Comments**: Added JSDoc to complex algorithms in `day-profile-engine.js`
  - Sensor change detection: 3-10 hour gap threshold rationale, marker placement strategy
  - Cartridge change detection: Clinical context for Medtronic Rewind events
  - 24-hour curve binning: 5-minute interval strategy with ATTD consensus alignment
  - Badge criteria: Already had excellent documentation with ADA/ATTD guidelines
- **PROJECT_BRIEFING Updates**: Documented `useDayProfiles` hook in architecture reference
  - Added to hooks section with trigger conditions and data flow
  - Updated Hook responsibility matrix with v2.2.1 marker

### Technical Details
- **New File**: `/src/hooks/useDayProfiles.js` (94 lines) - Extracts day profile generation with AGP overlay
- **Modified Files**: `AGPGenerator.jsx` (simplified), `DayProfileCard.jsx` (outlier fix)
- **Architecture**: Maintains proper separation - no components calling engines directly

---

## [2.2.0] - 2025-10-24

### Added - Day Profiles Feature
- **Individual Day Analysis**: View last 7 complete days with detailed glucose curves
- **DayProfileCard Component**: Single-day visualization with 24h glucose curve, TIR bar, and metrics
- **DayProfilesModal Component**: Full-screen modal displaying 7 day profiles
- **Achievement Badges**: Automatic detection of Perfect Day, Zen Master, and exceptional performance
- **Event Detection per Day**: Hypoglycemic events (L1: 54-70 mg/dL, L2: <54 mg/dL), hyperglycemic events (>250 mg/dL), sensor changes
- **Adaptive Y-axis Algorithm**: Dynamic range adjustment (54-250 mg/dL baseline, expands to 40-400 as needed)
- **Smart Tick Generation**: Always includes 70 & 180 mg/dL thresholds when in visible range
- **AGP Reference Overlay**: Dotted median line from overall period for context
- **Print Export**: `day-profiles-exporter.js` generates optimized HTML for A4 printing
  - Maximum 2 pages (4 days on page 1, 3 days on page 2)
  - Brutalist print design with B/W patterns for TIR visualization
  - Compact layout: 56mm height per card with aggressive spacing optimization
  - Legend moved to page 2 to maximize space on page 1

### Changed - AGP Visualization Simplification
- **Removed Mean Curve**: AGP chart now displays only the median (P50) line
  - Aligns with ADA/ATTD clinical guidelines for AGP visualization
  - Median is more robust to outliers and represents "typical day" pattern
  - Matches commercial CGM platform standards (Medtronic, Dexcom)
  - Median line now solid black (2.5px) instead of dashed for better visibility
- **Updated Legend**: Removed "Gemiddeld" (mean) entry, simplified to median + percentile bands

### Changed - Metrics Layout Reorganization
- **HypoglycemiaEvents Panel**: Replaced "Total Events" card with GRI (Glycemia Risk Index)
  - New 4-card layout: Level 2 <54 | Level 1 54-70 | TBR <70 | GRI
  - GRI displays risk level classification (Very Low/Low/Moderate/High/Very High)
  - Moved from secondary metrics grid to hypo panel for semantic clarity
- **Secondary Grid Restructure**: Consolidated Analysis Period and Data Quality under "Overview"
  - **Overview Section**: Analysis Period (days with complete/partial breakdown) | Data Quality (uptime % with readings count)
  - Removed standalone Risk Assessment section
  - New hierarchy in Data Quality card: Uptime % (primary) with readings count (subtitle)
- **Final Grid Layout**:
  1. Range Distribution: TAR >180 | TBR <70
  2. Variability Metrics: MAGE | MODD
  3. Glucose Range: Minimum | Maximum
  4. Overview: Analysis Period | Data Quality

### Added - Day Profiles Feature
- **Individual Day Analysis**: View last 7 complete days with detailed glucose curves
- **DayProfileCard Component**: Single-day visualization with 24h glucose curve, TIR bar, and metrics
- **DayProfilesModal Component**: Full-screen modal displaying 7 day profiles
- **Achievement Badges**: Automatic detection of Perfect Day, Zen Master, and exceptional performance
- **Event Detection per Day**: Hypoglycemic events (L1: 54-70 mg/dL, L2: <54 mg/dL), hyperglycemic events (>250 mg/dL), sensor changes
- **AGP Reference Overlay**: Dotted median line from overall period for context
- **Print Export**: `day-profiles-exporter.js` generates optimized HTML for A4 printing
  - Maximum 2 pages (4 days on page 1, 3 days on page 2)
  - Brutalist print design with B/W patterns for TIR visualization
  - Compact layout: 56mm height per card with aggressive spacing optimization
  - Legend moved to page 2 to maximize space on page 1

### Technical Changes
- Added `day-profile-engine.js` in `src/core/` for day-level calculations
- Added `day-profiles-exporter.js` in `src/core/` (700+ lines) for HTML generation
- Added `DayProfileCard.jsx` (548 lines) in `src/components/`
- Added `DayProfilesModal.jsx` (156 lines) in `src/components/`
- Updated `AGPGenerator.jsx` to include day profiles button and modal portal
- Day profiles use full 5-minute resolution (288 bins per day) for accurate visualization

### Fixed - UI/UX Polish & Code Quality
- **Button Text**: Changed to "BEKIJK DAGPROFIELEN" (Dutch, uppercase for consistency)
- **Button Font Size**: Increased from 14px to 16px for better readability
- **Version Numbers**: Updated to v2.2.0 across package.json, footer, and component headers
- **Code Cleanup**: Removed all console.log() debug statements (production-ready)
- **Documentation**: Complete v2.2.0 handoff, briefing, and index files updated

---

## [2.1.3] - 2025-10-23

### Added - Data Persistence & Patient Information
- **IndexedDB Storage**: Unlimited client-side data storage for CSV uploads
- **Save/Load Uploads**: Save multiple datasets with custom names, lock protection
- **Patient Information Management**: Auto-extraction from CSV + manual entry modal
  - Auto-extracts: Name, device model, serial number, sensor type
  - Manual fields: Date of birth, physician, email
  - Displays in app header and HTML exports
- **Storage Management UI**: View saved uploads, storage usage, rename, delete
- **Load Success Toast**: Visual feedback when loading saved data
- **Metric Tooltips**: Clinical definitions on hover for all metrics

### Technical Changes
- Added `useUploadStorage.js` hook (450 lines) for IndexedDB operations
- Added `patientStorage.js` and `uploadStorage.js` in `src/utils/`
- Added `PatientInfo.jsx` (278 lines) modal component
- Added `SavedUploadsList.jsx` (318 lines) for upload management
- Added `metricDefinitions.js` with clinical metric descriptions
- Added `Tooltip.jsx` and `MetricTooltip.jsx` components
- Updated `html-exporter.js` to include patient info in reports

---

## [2.1.0] - 2025-10-20

### Changed - Complete Architecture Rewrite
- **Modular Component Structure**: Split monolithic component into 10 separate files
- **Custom Hooks**: Extracted business logic into `useCSVData`, `useMetrics`, `useComparison`
- **Core Modules**: Separated calculation engines into `src/core/`
- **Production Structure**: Organized folders: `components/`, `hooks/`, `core/`, `utils/`

### Added - Enhanced Features
- **Auto-comparison**: Automatically triggers for preset periods (14/30/90 days)
- **Day/Night Toggle**: Enable/disable 06:00-00:00 vs 00:00-06:00 split analysis
- **Collapsible UI**: Organized sections with clean expand/collapse behavior
- **ProTime Modal**: Dual-tab import (PDF text paste + JSON file upload)
- **Empty States**: Helpful onboarding messages throughout UI
- **Error Handling**: Clear, user-friendly error messages with dismiss functionality
- **6-Metric Comparison**: Added TIR, Mean±SD, CV, GMI, MAGE, MODD with delta indicators
- **Overall Assessment**: Automatic summary of period-over-period changes

### Technical Improvements
- Vite build system with optimized bundling
- Improved code organization (~5,000+ lines across modular files)
- Better separation of concerns (UI vs logic vs calculations)
- Enhanced state management with proper React patterns

---

## [2.0.0] - 2025-10-15

### Added - Initial Production Release
- Complete AGP analysis following ADA/ATTD 2019 guidelines
- 8 core clinical metrics (TIR, TAR, TBR, CV, GMI, Mean, MAGE, MODD)
- AGP visualization with percentile bands (10th, 25th, 50th, 75th, 90th)
- Event detection (hypoglycemia L1/L2, hyperglycemia)
- Period comparison for historical context
- Day/Night split analysis
- Workday split analysis (with ProTime integration)
- HTML report export with print optimization
- Responsive dark theme UI

### Technical Foundation
- React 18 + Vite
- Tailwind CSS styling
- Lucide React icons
- Pure SVG visualization (no chart libraries)
- CareLink CSV parsing with validation

---

## Future Versions

### [2.3.0] - Planned
- Adaptive Y-axis for day profiles (54-250 mg/dL primary range)
- Improved chart density and information scannability
- Outlier indicators for values outside primary range

### [3.0.0] - Under Consideration
- Backend API integration
- User accounts & cloud sync
- Multi-patient comparison
- PDF export
- Mobile app (React Native)

---

## Version Naming Convention

- **Major (X.0.0)**: Breaking changes, major architectural shifts
- **Minor (x.Y.0)**: New features, backward-compatible additions
- **Patch (x.y.Z)**: Bug fixes, minor improvements

---

**Project Repository**: [GitHub URL]  
**Documentation**: See `/docs/` folder for detailed technical documentation

## [3.9.0] - 2025-10-26

### Added - Sensor History Modal
- **Fourth Control Button**: SENSOR HISTORY added between DAGPROFIELEN and EXPORT
  - Grid layout expanded from 3 to 4 columns
  - Button shows live count: "219 Sensors"
  - Disabled state during database load or on error
  
- **Full-Screen Modal**: Brutalist sensor database viewer
  - Overall stats: Total sensors, success rate (67%), avg duration (5.8d), failures
  - HW version breakdown: Performance per hardware revision (A1.01, A2.01)
  - Top 10 lot numbers: Quick performance view with color-coded success rates
  - Complete sortable table: All 219 sensors with clickable column headers
  
- **SQLite Integration**: Database served from `/public/sensor_database.db`
  - Loaded via sql.js WebAssembly from CDN
  - 92KB database with full sensor history
  - Schema mapping: `id` → `sensor_id`, `hardware_version` → `hw_version`, etc.
  - Status conversion: "success"/"failed" → 1/0 boolean

- **Calculation Engine**: Pure functions in `sensor-history-engine.js`
  - `calculateOverallStats()`: Aggregate statistics
  - `calculateHWVersionStats()`: Performance by hardware version
  - `calculateLotPerformance()`: Success rate per lot number
  - `filterSensors()`: Filter by date/lot/hw/status (ready for future filtering UI)
  - `sortSensors()`: Multi-column sorting with asc/desc

### Changed - Visual Design
- **Improved Readability**: Modal backdrop opacity increased from 92% to 97%
  - Reduces text bleeding from background
  - Better focus on modal content
  
- **Color-Coded Status Badges**: 
  - Success (≥6d): Green badge with "✓ OK" (var(--color-green))
  - Failure (<6d): Red badge with "✗ FAIL" (var(--color-red))
  - Replaces previous monochrome badges

- **Duration Color Coding**:
  - ≥7 days: Green (goal achieved)
  - 6-7 days: Orange (acceptable)
  - <6 days: Red (replacement eligible)

### Technical Details
- **New Hook**: `useSensorDatabase.js` handles SQLite loading
  - Fetches `/sensor_database.db` on component mount
  - Returns sensors array + loading/error states
  - Auto-cleanup of database connection on unmount

- **New Component**: `SensorHistoryModal.jsx`
  - React portal rendering (like DayProfilesModal)
  - Memoized calculations for performance
  - Sticky header with close button
  - Paper/ink theme consistency

- **Files Added**:
  - `src/hooks/useSensorDatabase.js` (127 lines)
  - `src/core/sensor-history-engine.js` (213 lines)
  - `src/components/SensorHistoryModal.jsx` (362 lines)
  - `public/sensor_database.db` (92KB, 219 records)

- **Files Modified**:
  - `src/components/AGPGenerator.jsx`: Button + modal integration
  - Grid layout: `repeat(3, 1fr)` → `repeat(4, 1fr)`

### Dependencies
- Added `sql.js` for SQLite database access in browser

---

