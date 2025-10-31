# 📦 AGP+ v3.15.0 - Stock Management Module

**Version**: v3.15.0  
**Date**: 2025-10-31  
**Status**: Design Complete - Ready for Implementation  
**Estimate**: ~8 hours total

---

## 🎯 EXECUTIVE SUMMARY

### Goal
Add sensor batch registration and assignment tracking to AGP+. Users can register sensor deliveries (lot number, expiry, source) and link individual sensors to batches for complete traceability.

### Why This Feature
- **Traceability**: Know which sensor came from which delivery
- **Quality Analysis**: Link lot numbers to actual usage patterns
- **Audit Trail**: Complete record of sensor provenance
- **NOT inventory management**: Pure registration, no stock alerts/predictions

### Key Design Decisions
1. ✅ **localStorage storage** - Consistent with recent sensors
2. ✅ **Separate modal** - Keeps sensor history clean
3. ✅ **Optional assignment** - Sensors work without batches
4. ✅ **Lot prefix matching** - Auto-suggest on lot number
5. ✅ **Manual linking** - No automatic assignment (user confirms)

### Deliverables
- Stock batch CRUD (add, edit, delete, list)
- Sensor-to-batch assignment system
- Stock management UI modal
- Assignment column in sensor history
- Auto-suggest on CSV upload (lot match)

---

## 📊 DATA MODEL

### Stock Batch Schema
```javascript
{
  batch_id: "BATCH-2025-001",           // Auto-generated UUID
  lot_number: "NG4A12345",              // From sensor box label
  received_date: "2025-10",             // YYYY-MM (day optional)
  received_date_exact: "2025-10-15",    // Full ISO date if known
  source: "hospital" | "medtronic" | "pharmacy" | "other",
  expiry_date: "2026-10-31",            // ISO date from box
  box_quantity: 10,                     // Sensors per box (typically 10)
  total_quantity: 30,                   // Total sensors (e.g., 3 boxes)
  assigned_count: 2,                    // AUTO-CALCULATED from assignments
  notes: "",                            // Free text field (optional)
  created_at: "2025-10-31T15:30:00Z",  // ISO timestamp
  updated_at: "2025-10-31T15:30:00Z"   // ISO timestamp
}
```

**Field Validations**:
- `lot_number`: Required, string, alphanumeric
- `received_date`: Required, YYYY-MM format
- `received_date_exact`: Optional, ISO date
- `source`: Required, enum (4 options)
- `expiry_date`: Required, ISO date
- `box_quantity`: Required, integer > 0
- `total_quantity`: Required, integer > 0, must be multiple of box_quantity
- `notes`: Optional, max 500 chars

**Business Rules**:
- `batch_id` generated on creation (UUID v4)
- `assigned_count` calculated from assignments table
- `total_quantity` must be ≥ `assigned_count` (warning if exceeded)
- Duplicate `lot_number` allowed (different deliveries)

### Sensor Assignment Schema
```javascript
{
  assignment_id: "ASSIGN-2025-001",     // Auto-generated UUID
  sensor_id: "NG4A12345-001",           // From sensor history
  batch_id: "BATCH-2025-001",           // Link to stock batch
  assigned_at: "2025-10-15T10:00:00Z", // ISO timestamp
  assigned_by: "manual" | "auto"        // How was it assigned
}
```

**Field Validations**:
- `sensor_id`: Required, must exist in sensor history
- `batch_id`: Required, must exist in batches
- `assigned_at`: Auto-generated on creation
- `assigned_by`: Auto-set based on creation method

**Business Rules**:
- `assignment_id` generated on creation (UUID v4)
- One sensor can only be assigned to ONE batch (1:1 relationship)
- One batch can have MANY sensors (1:N relationship)
- Deleting batch → cascade delete all assignments (with confirmation)
- Deleting sensor → auto-delete assignment (silent)
- Re-assigning sensor → delete old assignment, create new

### Storage Implementation

**localStorage Keys**:
```javascript
'agp-stock-batches'     // Array of batch objects
'agp-assignments'       // Array of assignment objects
```

**Why localStorage?**
- ✅ Consistent with recent sensors storage
- ✅ Synchronous API (simple code)
- ✅ Fast reads for UI
- ✅ Easy export/import integration
- ⚠️ Size limit: ~5-10MB (sufficient for hundreds of batches)

**Alternative Considered**: IndexedDB
- More scalable for large datasets
- Async API adds complexity
- Overkill for expected usage (< 100 batches)

---

## 🏗️ ARCHITECTURE

### File Structure
```
src/
├── storage/
│   ├── stockStorage.js          [NEW] CRUD + validation
│   └── sensorStorage.js          [MOD] Add getAssignment helper
├── components/
│   ├── StockManagementModal.jsx  [NEW] Main modal
│   ├── StockBatchCard.jsx        [NEW] Batch list item
│   ├── StockBatchForm.jsx        [NEW] Add/Edit form
│   ├── SensorHistoryModal.jsx    [MOD] Add batch column
│   └── App.jsx                   [MOD] Add stock button
└── core/
    └── stock-engine.js           [NEW] Business logic

**Total New LOC**: ~800-1000 lines
```

### Component Hierarchy

```
App.jsx
└── StockManagementModal
    ├── StockBatchCard (repeated)
    │   └── [Edit] [Delete] buttons
    └── StockBatchForm
        └── Form fields + validation

SensorHistoryModal
└── Table
    └── Row
        └── Batch dropdown (per sensor)
```

---

## 📡 API SPECIFICATION

### Stock Storage API (`src/storage/stockStorage.js`)

#### Batch Management
```javascript
/**
 * Add new stock batch
 * @param {Object} batchData - Batch fields (without batch_id)
 * @returns {Object} { success: boolean, batch_id?: string, error?: string }
 */
export function addStockBatch(batchData)

/**
 * Get all stock batches with calculated assigned_count
 * @returns {Array<Object>} Sorted by received_date desc
 */
export function getStockBatches()

/**
 * Get single batch by ID
 * @param {string} batchId
 * @returns {Object|null} Batch object or null if not found
 */
export function getStockBatch(batchId)

/**
 * Update existing batch
 * @param {string} batchId
 * @param {Object} updates - Fields to update
 * @returns {Object} { success: boolean, error?: string }
 */
export function updateStockBatch(batchId, updates)

/**
 * Delete batch (with cascade option)
 * @param {string} batchId
 * @param {boolean} cascade - If true, delete all assignments
 * @returns {Object} { success: boolean, assignmentsDeleted: number, error?: string }
 */
export function deleteStockBatch(batchId, cascade = true)
```

#### Assignment Management
```javascript
/**
 * Assign sensor to batch
 * @param {string} sensorId
 * @param {string} batchId
 * @param {string} assignedBy - 'manual' or 'auto'
 * @returns {Object} { success: boolean, assignment_id?: string, error?: string }
 */
export function assignSensorToBatch(sensorId, batchId, assignedBy = 'manual')

/**
 * Unassign sensor (remove assignment)
 * @param {string} sensorId
 * @returns {Object} { success: boolean, error?: string }
 */
export function unassignSensor(sensorId)

/**
 * Get assignment for sensor
 * @param {string} sensorId
 * @returns {Object|null} Assignment object or null
 */
export function getSensorAssignment(sensorId)

/**
 * Get all sensors assigned to batch
 * @param {string} batchId
 * @returns {Array<Object>} Array of assignment objects
 */
export function getBatchAssignments(batchId)

/**
 * Get batches with available quantity (not fully assigned)
 * @returns {Array<Object>} Batches with remaining capacity
 */
export function getAvailableBatches()
```

### Stock Engine API (`src/core/stock-engine.js`)
```javascript
/**
 * Calculate assigned count for batch
 * @param {string} batchId
 * @returns {number} Number of assigned sensors
 */
export function calculateAssignedCount(batchId)

/**
 * Find batches matching sensor lot number (prefix match)
 * @param {string} sensorId - e.g., "NG4A12345-001"
 * @returns {Array<Object>} Matching batches
 */
export function findMatchingBatches(sensorId)

/**
 * Validate batch data
 * @param {Object} batchData
 * @returns {Array<string>|null} Array of errors or null if valid
 */
export function validateBatchData(batchData)

/**
 * Format batch display name
 * @param {Object} batch
 * @returns {string} e.g., "NG4A12345 - OKT 2025 (28 beschikbaar)"
 */
export function formatBatchLabel(batch)

/**
 * Check if batch is expired
 * @param {Object} batch
 * @returns {boolean}
 */
export function isBatchExpired(batch)
```

---

## 🎨 UI DESIGN

### Stock Management Modal

**Trigger**: Button in App.jsx header
```
┌────────────────────────────────────────┐
│ [× SLUIT]  📦 VOORRAAD  [+ NIEUWE BATCH]│
└────────────────────────────────────────┘
```

**Modal Layout** (Brutalist style - 3px borders):
```
┌──────────────────────────────────────────────────────┐
│ SENSOR VOORRAAD REGISTRATIE                          │
├──────────────────────────────────────────────────────┤
│                                                       │
│ [+ NIEUWE BATCH]                       [🗑️ OPRUIMEN] │
│                                                       │
│ ┌────────────────────────────────────────────────┐  │
│ │ LOT: NG4A12345                    TOEGEWEZEN   │  │
│ │ Ontvangen: OKT 2025              2 / 30        │  │
│ │ Vervalt: 31 OKT 2026             ━━━━━━━━━░░  │  │
│ │ Bron: Ziekenhuis                     (6.7%)    │  │
│ │ Notities: Vervangen door apotheek              │  │
│ │                                    [EDIT] [×]  │  │
│ └────────────────────────────────────────────────┘  │
│                                                       │
│ ┌────────────────────────────────────────────────┐  │
│ │ LOT: NG4A67890                    TOEGEWEZEN   │  │
│ │ Ontvangen: SEP 2025              5 / 20        │  │
│ │ Vervalt: 30 SEP 2026             ━━━━━━░░░░░░  │  │
│ │ Bron: Medtronic Direct               (25%)     │  │
│ │                                    [EDIT] [×]  │  │
│ └────────────────────────────────────────────────┘  │
│                                                       │
│ [Totaal: 3 batches, 50 sensors, 7 toegewezen]       │
└──────────────────────────────────────────────────────┘
```

**Progress Bar Logic**:
- `assigned_count / total_quantity * 100`
- Full bar (█): assigned
- Empty bar (░): available
- Red background if > 100% (over-assigned)

### Add/Edit Batch Form
```
┌──────────────────────────────────────────────────────┐
│ NIEUWE BATCH TOEVOEGEN                               │
├──────────────────────────────────────────────────────┤
│                                                       │
│ Lotnummer *                                          │
│ ┌─────────────────────────────────────────────────┐ │
│ │ NG4A_____                                       │ │
│ └─────────────────────────────────────────────────┘ │
│                                                       │
│ Ontvangen *                                          │
│ ┌──────────────┐ ┌──────┐                           │
│ │ OKT 2025   ▾ │ │ 15 ▾ │ (dag optioneel)          │
│ └──────────────┘ └──────┘                           │
│                                                       │
│ Vervaldatum *                                        │
│ ┌────┐ ┌──────────────┐ ┌──────┐                   │
│ │ 31▾│ │ OKT       ▾  │ │2026▾ │                   │
│ └────┘ └──────────────┘ └──────┘                   │
│                                                       │
│ Bron *                                               │
│ ┌─────────────────────────────────────────────────┐ │
│ │ Ziekenhuis                                    ▾ │ │
│ └─────────────────────────────────────────────────┘ │
│                                                       │
│ Aantal per doos *    Totaal aantal *                │
│ ┌─────────────────┐  ┌─────────────────┐           │
│ │ 10              │  │ 30              │           │
│ └─────────────────┘  └─────────────────┘           │
│                                                       │
│ Notities (optioneel)                                │
│ ┌─────────────────────────────────────────────────┐ │
│ │                                                 │ │
│ └─────────────────────────────────────────────────┘ │
│                                                       │
│                   [ANNULEER]  [✓ OPSLAAN]           │
└──────────────────────────────────────────────────────┘
```

**Validation Rules**:
- All fields marked * are required
- Lot number: alphanumeric only
- Received date: month required, day optional
- Expiry date: must be future date
- Total quantity: must be multiple of box quantity
- Notes: max 500 characters

### Sensor History Integration
**Add BATCH column to sensor history table**:

```
# │ SENSOR ID     │ DUUR │ STATUS │ BATCH           │ LOT  │
──┼───────────────┼──────┼────────┼─────────────────┼──────┤
218│ NG4A12345-001 │ 10d  │ SUCCES │ [Select...    ▾]│ 12345│
217│ NG4A67890-002 │ 11d  │ SUCCES │ OKT 2025     📦 │ 67890│
216│ NG4A12345-003 │  9d  │ FAIL   │ -               │ 12345│
```

**Dropdown Content**:
```
┌─────────────────────────────────────────────┐
│ Geen batch                                  │
│ ─────────────────────────────────────────── │
│ NG4A12345 - OKT 2025 (28 beschikbaar)     │
│ NG4A67890 - SEP 2025 (15 beschikbaar)     │
│ NG4A11111 - AUG 2025 (0 beschikbaar)  ⚠️  │
└─────────────────────────────────────────────┘
```

**Visual Indicators**:
- 📦 icon: Sensor is assigned to batch
- ⚠️ icon: Batch is fully assigned (over capacity)
- `-`: No batch assigned
- Hover tooltip: Show batch details (expiry, source)

**Assignment Flow**:
1. User selects batch from dropdown
2. Confirmation: "Assign NG4A12345-001 to batch OKT 2025?"
3. On confirm: Create assignment, update UI
4. If already assigned: "Re-assign from batch X to batch Y?"

### Auto-Suggest on CSV Upload

**When**: After sensor detection completes

**Logic**:
1. Extract lot prefix from sensor ID (e.g., "NG4A12345-001" → "NG4A12345")
2. Search batches for matching lot_number
3. If 1 match found → Show suggestion dialog
4. If multiple matches → Show all in suggestion dialog
5. If no match → Silent (no dialog)

**Suggestion Dialog**:
```
┌──────────────────────────────────────────────────────┐
│ BATCH MATCH GEVONDEN                                 │
├──────────────────────────────────────────────────────┤
│                                                       │
│ Sensor NG4A12345-001 matcht met:                    │
│                                                       │
│ ○ Batch: OKT 2025                                   │
│   Lot: NG4A12345                                    │
│   Vervalt: 31 OKT 2026                              │
│   Beschikbaar: 28 / 30                              │
│                                                       │
│ ○ Batch: SEP 2025                                   │
│   Lot: NG4A12345                                    │
│   Vervalt: 30 SEP 2026                              │
│   Beschikbaar: 15 / 20                              │
│                                                       │
│         [HANDMATIG]  [✓ TOEWIJZEN AAN GESELECTEERD] │
└──────────────────────────────────────────────────────┘
```

**User Options**:
- Select radio button → Click "TOEWIJZEN" → Auto-assign
- Click "HANDMATIG" → Skip auto-assign, can do later

---

## 🔧 IMPLEMENTATION PHASES

### Phase 1: Data Layer (1-2 hours)

**Files to create**:
- `src/storage/stockStorage.js`
  - localStorage operations
  - CRUD functions
  - Assignment management
  - Validation helpers

- `src/core/stock-engine.js`
  - Business logic
  - Calculations (assigned count, remaining)
  - Matching algorithms
  - Format helpers

**Tasks**:
1. Define localStorage structure
2. Implement batch CRUD
3. Implement assignment CRUD
4. Add validation functions
5. Write unit tests (manual console testing)
6. Test with mock data

**Test Data**:
```javascript
// Add 2-3 batches
addStockBatch({
  lot_number: "NG4A12345",
  received_date: "2025-10",
  source: "hospital",
  expiry_date: "2026-10-31",
  box_quantity: 10,
  total_quantity: 30
});

// Assign to existing sensors
assignSensorToBatch("NG4A12345-001", batch_id, "manual");
```

**Completion Criteria**:
- ✅ All CRUD operations work
- ✅ Validation catches bad data
- ✅ Assignments link correctly
- ✅ Cascade delete works

### Phase 2: Stock Modal UI (2-3 hours)

**Files to create**:
- `src/components/StockManagementModal.jsx`
  - Main modal wrapper
  - List view
  - Add button handler
  - State management

- `src/components/StockBatchCard.jsx`
  - Individual batch display
  - Progress bar
  - Edit/Delete buttons

- `src/components/StockBatchForm.jsx`
  - Form fields
  - Validation
  - Submit handler

**Files to modify**:
- `src/components/App.jsx`
  - Add 📦 VOORRAAD button in header
  - Modal state management

**Tasks**:
1. Create modal shell with brutalist styling
2. Build batch card component
3. Build form component
4. Wire up state management
5. Add keyboard shortcuts (N, E, Delete)
6. Style with 3px borders, monospace, etc.

**Styling Checklist**:
- ✅ 3px solid black borders
- ✅ Monospace font (SF Mono)
- ✅ Uppercase labels
- ✅ Black & white base + clinical colors
- ✅ No gradients/shadows
- ✅ CSS Grid layouts

**Completion Criteria**:
- ✅ Modal opens/closes correctly
- ✅ Batches display in list
- ✅ Form validation works
- ✅ Add/Edit/Delete operations work
- ✅ UI matches design mockups

### Phase 3: Assignment Integration (2-3 hours)

**Files to modify**:
- `src/components/SensorHistoryModal.jsx`
  - Add BATCH column to table
  - Add dropdown per row
  - Handle assignment changes
  - Add visual indicators

- `src/storage/sensorStorage.js`
  - Add `getSensorBatchInfo()` helper

**Tasks**:
1. Add BATCH column to table header
2. Render dropdown for each sensor
3. Populate dropdown with available batches
4. Handle selection change (assign/unassign)
5. Add 📦 icon for assigned sensors
6. Add tooltip on hover

**Dropdown Logic**:
```javascript
const batches = getAvailableBatches();
const currentAssignment = getSensorAssignment(sensor.sensor_id);

<select value={currentAssignment?.batch_id || ''}>
  <option value="">Geen batch</option>
  {batches.map(batch => (
    <option value={batch.batch_id}>
      {formatBatchLabel(batch)}
    </option>
  ))}
</select>
```

**Completion Criteria**:
- ✅ BATCH column visible in table
- ✅ Dropdown shows all batches
- ✅ Assignment creates/updates correctly
- ✅ Visual indicators work
- ✅ Tooltip shows batch details

### Phase 4: Auto-Assignment (1 hour)

**Files to modify**:
- Sensor detection flow (wherever CSV upload triggers detection)

**Tasks**:
1. After detection, check for lot matches
2. Show suggestion dialog if matches found
3. Apply assignments if user confirms
4. Handle multiple matches (radio select)
5. Graceful fallback if no batches exist

**Completion Criteria**:
- ✅ Dialog appears on lot match
- ✅ User can select batch
- ✅ Assignment applies correctly
- ✅ Works with 0, 1, or N matches
- ✅ No errors if stock system unused

### Phase 5: Polish (1 hour)

**Tasks**:
1. **Keyboard shortcuts**
   - N: New batch
   - E: Edit selected batch
   - Delete: Delete selected batch
   - Escape: Close modal

2. **Sort/Filter batches**
   - Sort by: received_date, expiry_date, assigned_count
   - Filter by: source, expired/active
   - Search by: lot_number

3. **Export integration**
   - Include batch_id in sensor export JSON
   - Import assignments from JSON (optional checkbox)

4. **Performance**
   - Lazy load batch dropdown (only when expanded)
   - Memoize batch calculations
   - Debounce search input

**Completion Criteria**:
- ✅ Shortcuts work
- ✅ Sort/filter functional
- ✅ Export includes batch data
- ✅ Performance is smooth (no lag)

---

## 🧪 TESTING CHECKLIST

### Stock Management
- [ ] Add batch with all fields filled
- [ ] Add batch with minimal fields (month only, no day)
- [ ] Add batch with invalid data (catches errors)
- [ ] Edit batch (all fields)
- [ ] Delete empty batch (no assignments)
- [ ] Delete batch with assignments (cascade warning)
- [ ] Create duplicate lot numbers (different dates)
- [ ] Expiry date validation (must be future)
- [ ] Total quantity validation (multiple of box_quantity)

### Assignments
- [ ] Assign sensor to batch
- [ ] Unassign sensor (set to "Geen batch")
- [ ] Re-assign sensor to different batch
- [ ] Assign multiple sensors to same batch
- [ ] Try to assign already-assigned sensor (confirm dialog)
- [ ] Auto-suggest on CSV upload (1 match)
- [ ] Auto-suggest with multiple matches
- [ ] Auto-suggest with no matches (silent)
- [ ] Assignment persists after page reload

### UI/UX
- [ ] Modal opens/closes correctly
- [ ] Form validation shows errors
- [ ] Keyboard shortcuts work (N, E, Delete)
- [ ] Sort batches by date/expiry/count
- [ ] Filter by source
- [ ] Search by lot number
- [ ] Batch dropdown populates correctly
- [ ] Visual indicators (📦, ⚠️) display correctly
- [ ] Progress bar accurate
- [ ] Hover tooltips work

### Edge Cases
- [ ] Sensor without batch (display "-")
- [ ] Batch without sensors (display "0 / X")
- [ ] Batch over-assigned (>100%, red warning)
- [ ] Expired batch (visual indicator)
- [ ] Invalid dates (validation catches)
- [ ] localStorage quota exceeded (error handling)
- [ ] Lot number prefix matching (NG4A12345-001 → NG4A12345)
- [ ] Empty stock system (no batches) - graceful degradation
- [ ] Delete batch cascades to assignments
- [ ] Delete sensor auto-removes assignment

### Integration
- [ ] Works with existing sensor history
- [ ] Export includes batch data
- [ ] Import preserves assignments (if enabled)
- [ ] No breaking changes to existing features
- [ ] Performance remains fast (no lag)

---

## ⚠️ EDGE CASES & HANDLING

### Over-Assignment (assigned > total)
**Scenario**: User assigns 35 sensors to batch with total_quantity 30

**Handling**:
- ⚠️ Allow assignment (don't block)
- Show warning: "Batch over-assigned! 35 / 30 (117%)"
- Progress bar: Red background, overflow indicator
- Suggest: "Edit batch to increase total_quantity"

**Why not block?** User may have received extra sensors, or data may be inaccurate. Soft warning is better than hard error.

### Cascade Delete

**Scenario**: Delete batch with 5 assigned sensors

**Dialog**:
```
⚠️ BATCH VERWIJDEREN

Deze batch heeft 5 toegewezen sensors.

Als je de batch verwijdert:
• Batch wordt verwijderd
• Alle 5 assignments worden verwijderd
• Sensors blijven bestaan (alleen link verdwijnt)

Doorgaan?

[ANNULEER]  [✓ VERWIJDER BATCH]
```

**Handling**: User confirms → delete batch + cascade delete all assignments

### Duplicate Lot Numbers

**Scenario**: Two batches with same lot_number but different dates

**Display**:
```
NG4A12345 - OKT 2025 (28 beschikbaar)
NG4A12345 - SEP 2025 (15 beschikbaar)
```

**Handling**:
- ✅ Allowed (different deliveries)
- Disambiguate with received_date
- Auto-suggest shows both options

### Sensor Without Batch
**Scenario**: Sensor has no assignment

**Display**: "-" in BATCH column

**Handling**:
- ✅ Perfectly valid (default state)
- No error, no warning
- Dropdown shows "Geen batch" selected
- All features work normally

### Batch Without Sensors

**Scenario**: Newly added batch, no assignments yet

**Display**: "0 / 30" in batch card

**Handling**:
- ✅ Valid (just registered, not yet used)
- Progress bar empty (░░░░░░░░░░)
- Can be deleted without confirmation

### Expired Batch

**Scenario**: Batch with expiry_date in the past

**Handling**:
- ⚠️ Visual indicator: "⏰ VERLOPEN" badge
- Red text for expiry date
- Still assignable (user may use expired sensors)
- Sort to bottom of list by default

### localStorage Quota Exceeded

**Scenario**: localStorage hits browser limit (~5-10MB)

**Handling**:
```javascript
try {
  localStorage.setItem(BATCHES_KEY, JSON.stringify(batches));
} catch (err) {
  if (err.name === 'QuotaExceededError') {
    alert(
      'localStorage vol!\n\n' +
      'Te veel batches opgeslagen. Overweeg oude batches te verwijderen.'
    );
  }
}
```

**Prevention**: Cleanup button to delete old/expired batches

### Lot Number Format Variations

**Scenarios**:
- Sensor: "NG4A12345-001" → Batch: "NG4A12345" ✅ Match
- Sensor: "NG4A12345" → Batch: "NG4A12345" ✅ Match
- Sensor: "ng4a12345-001" → Batch: "NG4A12345" ✅ Match (case-insensitive)
- Sensor: "NG4A12345-XYZ" → Batch: "NG4A12345" ✅ Match (prefix)

**Matching Algorithm**:
```javascript
function extractLotPrefix(sensorId) {
  // Remove suffix after dash
  const prefix = sensorId.split('-')[0];
  // Uppercase for case-insensitive match
  return prefix.toUpperCase();
}

function findMatchingBatches(sensorId) {
  const prefix = extractLotPrefix(sensorId);
  const batches = getStockBatches();
  
  return batches.filter(batch => {
    return batch.lot_number.toUpperCase() === prefix;
  });
}
```

---

## 📈 SUCCESS METRICS

### Adoption
- [ ] >50% of sensors assigned to batches (after 1 month)
- [ ] >5 batches registered (shows feature is used)

### Quality
- [ ] No crashes or data loss
- [ ] No performance degradation
- [ ] User can complete all workflows without errors

### User Feedback
- [ ] "This helps me track my sensors" ✅
- [ ] "Easy to register new deliveries" ✅
- [ ] "Auto-suggest saves time" ✅

---

## 🚀 DEPLOYMENT PLAN

### Pre-Release
1. Complete all 5 implementation phases
2. Test all scenarios from checklist
3. Fix any bugs found
4. Update CHANGELOG.md
5. Update version to v3.15.0

### Release
1. Commit: `git commit -m "v3.15.0: Stock management module"`
2. Tag: `git tag v3.15.0`
3. Push: `git push origin main --tags`

### Post-Release
1. Monitor for user feedback
2. Fix critical bugs immediately (v3.15.1)
3. Plan enhancements for v3.16.0

---

## 📚 REFERENCES

### Similar Features
- Sensor history tracking (v3.0+)
- Export/import system (v3.14.0)
- Lock management (v3.11.0)

### Design Patterns
- localStorage CRUD (sensorStorage.js)
- Brutalist UI (DayProfilesModal.jsx)
- Modal architecture (SensorHistoryModal.jsx)

---

## ✅ COMPLETION CRITERIA

**v3.15.0 is complete when**:
1. ✅ All 5 phases implemented
2. ✅ All tests pass
3. ✅ Stock modal works (add/edit/delete)
4. ✅ Assignment integration works (dropdown in sensor history)
5. ✅ Auto-suggest works (on CSV upload)
6. ✅ UI matches design mockups
7. ✅ No breaking changes to existing features
8. ✅ Performance is acceptable (no lag)
9. ✅ Documentation updated (HANDOFF, START_HERE, CHANGELOG)
10. ✅ Code committed and pushed to GitHub

**Then**: v3.15.0 ships! 📦

---

## 🎬 NEXT STEPS FOR NEW CHAT

1. Read this document completely
2. Read `HANDOFF.md` for task breakdown
3. Start with Phase 1 (data layer)
4. Work in small chunks (≤30 lines per edit)
5. STOP after each chunk and ask for permission
6. Test thoroughly after each phase
7. Commit logical changes

**Remember**: This is not a race. Quality > speed.

**Good luck! 🚀**

---

**END OF PROJECT BRIEFING v3.15.0**
