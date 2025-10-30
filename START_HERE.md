---
tier: 0
status: active
phase: v3.1 Sensor Registration
last_updated: 2025-10-30
---

# 🚀 START_HERE — AGP+ v3.1 Sensor Registration

## 🎯 Current Objective

**Build CSV-based sensor registration system**  
Problem: 219 sensors imported from SQLite, but no way to add new sensors from CareLink CSV exports.

## 📂 Key Documents

| Tier | Document | Purpose |
|------|----------|---------|
| **1** | [HANDOFF.md](./HANDOFF.md) | Setup + implementation tasks |
| **2** | [STATUS.md](./docs/STATUS.md) | Progress tracking |
| **3** | [minimed_780g_ref.md](./docs/minimed_780g_ref.md) | CSV structure + sensor lifecycle |
| **3** | [metric_definitions.md](./docs/metric_definitions.md) | Gap detection algorithms |

## 🖥️ Quick Start

```bash
cd /Users/jomostert/Documents/Projects/agp-plus
lsof -ti:3001 | xargs kill -9 2>/dev/null || true
export PATH="/opt/homebrew/bin:$PATH"
npx vite --port 3001
```

→ http://localhost:3001

## 🧩 Architecture Status

**Existing (v3.0)**:
- ✅ IndexedDB sensor storage (219 sensors)
- ✅ Alert clustering logic (`sensorEventClustering.js`)
- ✅ Sensor stats engine (`sensor-history-engine.js`)
- ✅ SQLite import UI (`SensorImport.jsx`)

**Missing (v3.1)**:
- ❌ CSV section parser (3-section format)
- ❌ Gap analyzer (≥120 min detection)
- ❌ Cluster+gap matching engine
- ❌ Sensor registration UI (confirm/ignore)
- ❌ Lock-based CRUD (protect old records)

## 📊 Testdata

**Primary**: `/Users/jomostert/Documents/Projects/agp-plus/test-data/SAMPLE__Jo Mostert 30-10-2025_7d.csv`
- 7 days (Oct 24-30, 2025)
- 2 confirmed sensor changes (Oct 19 ~01:00, Oct 25 ~08:00)
- 2826 lines, 3 sections

**Sensor Database**: `/Users/jomostert/Documents/Projects/agp-plus/public/sensor_database.db`
- 219 sensors (2022-present)
- Must remain locked (only new sensors editable)

## 🛠️ Implementation Phases

1. **CSV Parser** - Auto-detect sections, split by `Index;Date;Time;` headers
2. **Gap Analyzer** - Find glucose gaps ≥120 min (transmitter charge + warmup)
3. **Matcher** - Correlate alert clusters with nearby gaps (±6h window)
4. **UI** - Review candidates, confirm/ignore, add to IndexedDB
5. **CRUD** - Lock old sensors, safe delete/update for recent only

See HANDOFF.md for detailed tasks.

---

**Version**: v3.0 → v3.1  
**Focus**: Sensor registration from CSV  
**Server**: Vite on port 3001
