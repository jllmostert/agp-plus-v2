# 🏗️ ARCHITECTURE - AGP+ v3.8.2

**Purpose:** Understand how the system is structured and how data flows  
**Read Time:** 8 minutes  
**Prerequisites:** Read `START_HERE.md` first

---

## 📐 THE THREE-LAYER MODEL

This is the **most important architectural pattern** in AGP+. It's non-negotiable.

```
┌─────────────────────────────────────────────┐
│  LAYER 1: COMPONENTS (Presentation)          │
│  - React components only                     │
│  - NO business logic                         │
│  - NO direct storage access                  │
│  - Render UI, handle user events            │
│  Example: AGPGenerator.jsx, DayProfileCard │
└─────────────────┬───────────────────────────┘
                  │ calls
┌─────────────────▼───────────────────────────┐
│  LAYER 2: HOOKS (Orchestration)             │
│  - State management with React hooks        │
│  - Coordinate between components & engines  │
│  - Handle async operations                  │
│  - NO calculations, NO rendering            │
│  Example: useMasterDataset, useMetrics     │
└─────────────────┬───────────────────────────┘
                  │ calls
┌─────────────────▼───────────────────────────┐
│  LAYER 3: ENGINES (Business Logic)          │
│  - Pure functions (no React, no side effects)│
│  - All calculations happen here             │
│  - Testable without UI                      │
│  - NO state, NO async (except storage calls)│
│  Example: agp-engine.js, metrics-engine.js │
└─────────────────┬───────────────────────────┘
                  │ uses
┌─────────────────▼───────────────────────────┐
│  LAYER 4: STORAGE (Persistence)             │
│  - IndexedDB operations                     │
│  - localStorage operations                  │
│  - No business logic                        │
│  - Simple CRUD + queries                    │
│  Example: masterDatasetStorage.js          │
└─────────────────────────────────────────────┘
```

### Why This Matters

**BAD - Business logic in component:**
```jsx
function MyComponent() {
  const [tir, setTir] = useState(0);
  
  useEffect(() => {
    // ❌ WRONG - calculation in component
    const inRange = data.filter(r => r.glucose >= 70 && r.glucose <= 180);
    setTir((inRange.length / data.length) * 100);
  }, [data]);
}
```

**GOOD - Business logic in engine:**
```jsx
// Component (Layer 1)
function MyComponent() {
  const metrics = useMetrics(data); // ✅ Hook provides data
  return <div>TIR: {metrics.tir}%</div>; // ✅ Just render
}

// Hook (Layer 2)
function useMetrics(data) {
  return useMemo(() => calculateMetrics(data), [data]); // ✅ Orchestrate
}

// Engine (Layer 3)
function calculateMetrics(data) {
  const inRange = data.filter(r => r.glucose >= 70 && r.glucose <= 180);
  return { tir: (inRange.length / data.length) * 100 }; // ✅ Pure logic
}
```

---

## 💾 DATA STORAGE ARCHITECTURE

### Two Storage Systems

**1. IndexedDB (Glucose Data + Events)**
- Large datasets (28k+ readings)
- Structured queries
- Month-bucketed organization
- Async operations

**2. localStorage (Sensor Database)**
- Small datasets (219 sensors, ~20KB)
- Simple key-value
- Synchronous access
- Fast reads

### Why Both?

IndexedDB is overkill for sensor data. localStorage is simpler and faster for small, frequently-accessed data that doesn't need complex queries.

---

## 🗄️ INDEXEDDB SCHEMA (v3.0 FUSION)

```javascript
Database: "agp-plus-db" (version 3)

Store: "uploads" (v2 compatibility)
├── key: upload ID (string)
└── value: {
      id, filename, uploadDate, 
      patientInfo, csvData (raw string),
      dateRange: { min, max }
    }

Store: "months" (🆕 v3.0 core storage)
├── key: "YYYY-MM" (e.g., "2025-10")
└── value: {
      month: "2025-10",
      readings: [
        {
          date: "2025/10/12",      // YYYY/MM/DD format
          time: "07:15:21",         // HH:MM:SS format
          sg: 153,                  // Sensor glucose (mg/dL)
          glucose: 153,             // Same as sg
          bolus: 0,                 // Insulin bolus (units)
          basal: 0.9,              // Basal rate (units/hr)
          carbs: 0,                // Carbohydrate intake (g)
          insulin: 0,              // Total insulin
          rewind: false,           // Cartridge change flag
          alert: null              // Pump alerts/alarms
        },
        // ... more readings
      ],
      count: 2847,                 // Total readings in month
      dateRange: { min, max }      // Date objects
    }

Store: "events" (🆕 v3.0 device events)
├── key: "cartridge" (event type)
└── value: {
      type: "cartridge",
      changes: [
        {
          timestamp: Date object,
          date: "2025/10/12",
          minuteOfDay: 425,       // For chart positioning
          confidence: "high",      // detection confidence
          source: "csv"           // "csv" or "gap"
        },
        // ... more changes
      ]
    }

Store: "metadata" (🆕 v3.0 cache + stats)
├── key: "master"
└── value: {
      dateRange: { 
        min: Date object,        // Earliest reading
        max: Date object         // Latest reading
      },
      count: 28528,              // Total readings
      sorted: [                  // 🚀 CACHED sorted array
        { date, time, glucose, ... },
        // ... all readings in chronological order
      ],
      workdays: [                // ProTime workdays
        "2025/10/12",
        "2025/10/13",
        // ... 346 workdays
      ],
      lastUpdated: "2025-10-27T10:30:00Z"
    }
```

### Month Bucketing Strategy

**Why months?**
- Natural CSV boundary (CareLink exports by month)
- Balances bucket size vs query speed
- Typical analysis: 1-3 months (fast query)
- Full history: 30+ months (still manageable)

**Query Pattern:**
```javascript
// Get 14 days of data
const startMonth = "2025-10";
const endMonth = "2025-10";  // Same month

// Only fetches October bucket
const octoberData = await db.get('months', '2025-10');

// Filter to exact date range
const filtered = octoberData.readings.filter(
  r => r.date >= '2025/10/12' && r.date <= '2025/10/26'
);
```

**Performance:**
- Single month query: ~10ms
- Cross-month query (2-3 months): ~30ms
- Full year query (12 months): ~150ms
- Sorted cache hit: <1ms ⚡

---

## 🗂️ LOCALSTORAGE SCHEMA (Sensors)

```javascript
Key: "agp-sensor-database"

Value: {
  sensors: [
    {
      id: 1,
      start_timestamp: "2025-10-19 01:01:07",  // ISO-ish format
      end_timestamp: "2025-10-26 05:30:00",
      duration_hours: 172.5,
      duration_days: 7.2,
      reason_stop: "expired",       // "expired" | "failed" | "pulled_early"
      status: "success",            // "success" | "failure" | "unknown"
      confidence: "high",           // "high" | "medium" | "low"
      lot_number: "B0425",          // Batch identifier
      hardware_version: "Guardian 4", // Sensor model
      notes: "Normal wear"          // Free text
    },
    // ... 219 sensors total
  ],
  inventory: [],                    // Unused sensors
  dateRange: {                      // Calculated on import
    min: "2022-03-15",
    max: "2025-10-19"
  },
  lastUpdated: "2025-10-27T08:45:00Z"
}
```

**Why localStorage?**
- Size: 219 sensors = ~20KB (well under 5MB limit)
- Speed: Synchronous access (no async complexity)
- Simplicity: Single key-value pair
- Future: Can migrate to IndexedDB if dataset grows

---

## 🌊 DATA FLOW DIAGRAMS

### Flow 1: CSV Upload → Master Dataset

```
┌─────────────────┐
│ User uploads    │
│ CareLink.csv    │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────────┐
│ AGPGenerator.jsx (Component)    │
│ - handleUpload()                │
│ - Shows file picker             │
└────────┬────────────────────────┘
         │ calls
         ▼
┌─────────────────────────────────┐
│ useMasterDataset (Hook)         │
│ - importNewCSV()                │
│ - Orchestrates import           │
└────────┬────────────────────────┘
         │ calls
         ▼
┌─────────────────────────────────┐
│ v2parser.js (Engine)            │
│ - parseCSV()                    │
│ - Normalize format              │
└────────┬────────────────────────┘
         │ returns normalized data
         ▼
┌─────────────────────────────────┐
│ migrateToV3.js (Migration)      │
│ - Transform v2 → v3 format      │
│ - Detect events                 │
└────────┬────────────────────────┘
         │ calls
         ▼
┌─────────────────────────────────┐
│ masterDatasetStorage.js         │
│ - addReadingsToMasterDataset()  │
│ - Bucket by month               │
│ - Update sorted cache           │
└────────┬────────────────────────┘
         │ writes to
         ▼
┌─────────────────────────────────┐
│ IndexedDB: months store         │
│ - Store readings by month       │
└─────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────┐
│ IndexedDB: metadata store       │
│ - Update sorted array           │
│ - Update dateRange              │
│ - Increment count               │
└────────┬────────────────────────┘
         │ triggers
         ▼
┌─────────────────────────────────┐
│ UI auto-refreshes               │
│ - New data range available      │
│ - Metrics recalculate           │
└─────────────────────────────────┘
```

### Flow 2: Sensor Import → Visualization

```
┌─────────────────┐
│ User uploads    │
│ sensors.db      │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────────┐
│ SensorImport.jsx (Component)    │
│ - handleFileSelect()            │
└────────┬────────────────────────┘
         │ calls
         ▼
┌─────────────────────────────────┐
│ sensorImport.js (Storage)       │
│ - importSensorsFromFile()       │
│ - Parse SQLite via sql.js       │
└────────┬────────────────────────┘
         │ writes to
         ▼
┌─────────────────────────────────┐
│ localStorage                     │
│ key: "agp-sensor-database"      │
└────────┬────────────────────────┘
         │ read by
         ▼
┌─────────────────────────────────┐
│ day-profile-engine.js           │
│ - detectSensorChanges()         │
│ - Priority 1: Check database    │
│ - Fallback: Gap detection       │
└────────┬────────────────────────┘
         │ returns
         ▼
┌─────────────────────────────────┐
│ Day profile object              │
│ sensorChanges: [                │
│   {                             │
│     timestamp, minuteOfDay,     │
│     confidence: "high",         │
│     source: "database",         │
│     metadata: { lot, duration } │
│   }                             │
│ ]                               │
└────────┬────────────────────────┘
         │ rendered by
         ▼
┌─────────────────────────────────┐
│ DayProfileCard.jsx (Component)  │
│ - Maps sensorChanges to SVG    │
│ - Red dashed lines              │
│ - "SENSOR VERVANGEN" label      │
└─────────────────────────────────┘
```

### Flow 3: Date Range Query

```
┌─────────────────────────────────┐
│ User selects dates in UI        │
│ Start: 2025/10/12               │
│ End:   2025/10/26               │
└────────┬────────────────────────┘
         │
         ▼
┌─────────────────────────────────┐
│ AGPGenerator.jsx                │
│ - handleDateChange()            │
└────────┬────────────────────────┘
         │ triggers
         ▼
┌─────────────────────────────────┐
│ useMasterDataset (Hook)         │
│ - loadDateRange(start, end)     │
└────────┬────────────────────────┘
         │ calls
         ▼
┌─────────────────────────────────┐
│ masterDatasetStorage.js         │
│ - getMasterDataset(start, end)  │
└────────┬────────────────────────┘
         │
         ▼
┌─────────────────────────────────┐
│ Check cached sorted array       │
│ (in metadata store)             │
└────────┬────────────────────────┘
         │ CACHE HIT? ─┐
         │             │
         │ YES         │ NO
         ▼             ▼
  ┌──────────┐   ┌──────────────┐
  │ Return   │   │ Query month  │
  │ filtered │   │ buckets      │
  │ array    │   │ Build sorted │
  │ <1ms ⚡  │   │ Update cache │
  └────┬─────┘   └──────┬───────┘
       │                │
       └────────┬───────┘
                ▼
┌─────────────────────────────────┐
│ Return readings array           │
│ [{ date, time, glucose, ... }]  │
└────────┬────────────────────────┘
         │
         ▼
┌─────────────────────────────────┐
│ useMetrics (Hook)               │
│ - calculateMetrics()            │
└────────┬────────────────────────┘
         │ calls
         ▼
┌─────────────────────────────────┐
│ agp-engine.js                   │
│ - Calculate TIR, TAR, TBR       │
│ - Generate AGP percentiles      │
└────────┬────────────────────────┘
         │ returns
         ▼
┌─────────────────────────────────┐
│ Metrics object                  │
│ { tir, tar, tbr, mean, sd, ... }│
└────────┬────────────────────────┘
         │
         ▼
┌─────────────────────────────────┐
│ UI renders updated metrics      │
└─────────────────────────────────┘
```

---

## 🔄 V2 ↔ V3 COMPATIBILITY LAYER

AGP+ maintains **backwards compatibility** with v2.x through a transformation layer.

### V2 Format (Legacy)
```javascript
{
  csvData: "Date,Time,Sensor Glucose...\n2025/10/12,07:15:21,153...",
  patientInfo: { name, mrn, dob },
  dateRange: { min: Date, max: Date }
}
```

### V3 Format (Current)
```javascript
{
  readings: [
    { date: "2025/10/12", time: "07:15:21", glucose: 153, ... }
  ],
  dateRange: { min: Date, max: Date }
}
```

### Transformation (Automatic)
```javascript
// In migrateToV3.js
function transformV2ToV3(v2Upload) {
  // Parse CSV string → array of objects
  const parsed = parseCSV(v2Upload.csvData);
  
  // Normalize field names
  const normalized = normalizeFields(parsed);
  
  // Return v3 format
  return {
    readings: normalized,
    dateRange: v2Upload.dateRange
  };
}
```

**Key Point:** All v2 data can be read in v3. All v3 calculations work on v2 data. Seamless transition.

---

## 🎯 KEY ARCHITECTURAL DECISIONS

### Decision 1: Month Bucketing
**Problem:** 28k+ readings in single store = slow queries  
**Solution:** Split by month = faster range queries  
**Trade-off:** Cross-month queries need 2-3 fetches (still fast)

### Decision 2: Sorted Array Cache
**Problem:** Every query requires sort (expensive for 28k items)  
**Solution:** Cache sorted array in metadata store  
**Trade-off:** Requires update on insert (acceptable, inserts are rare)

### Decision 3: Sensors in localStorage
**Problem:** IndexedDB async complexity for simple data  
**Solution:** Small dataset fits in localStorage (sync access)  
**Trade-off:** Can't query complex relationships (not needed for sensors)

### Decision 4: Three-Layer Architecture
**Problem:** Business logic mixed with UI = untestable, unmaintainable  
**Solution:** Strict layer separation (components/hooks/engines)  
**Trade-off:** More files, more indirection (worth it for clarity)

### Decision 5: Brutalist Design
**Problem:** Clinical data needs maximum clarity and print compatibility  
**Solution:** High contrast, thick borders, monospace, patterns over color  
**Trade-off:** Not "pretty" by consumer standards (that's the point)

---

## 📚 DEEP DIVE REFERENCES

**For complete technical specs:**
→ `PROJECT_BRIEFING_V3_8.md` (528 lines)

**For storage implementation details:**
→ `src/storage/masterDatasetStorage.js` (600+ lines with comments)

**For engine implementations:**
→ `src/core/agp-engine.js` (AGP calculations)  
→ `src/core/day-profile-engine.js` (Daily analysis)  
→ `src/core/metrics-engine.js` (TIR/TAR/TBR)

**For hook orchestration:**
→ `src/hooks/useMasterDataset.js` (Data loading)  
→ `src/hooks/useMetrics.js` (Metrics calculation)

---

**Next Step:**  
Need to code or debug? → Read `DEVELOPMENT.md`  
Working on sensors? → Read `SENSOR_SYSTEM.md`
