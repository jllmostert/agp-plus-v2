---
tier: 0
status: active
phase: v3.1 Sensor Registration
last_updated: 2025-10-30
purpose: Central index; defines current handoff, active status, and key Tier 2 files
---

# 🚀 START_HERE — AGP+ Active Index

## 🎯 Current Objective

**Build CSV-based sensor registration system**  
Problem: 219 sensors imported from SQLite, but no way to add new sensors from CareLink CSV exports.

---

## 📂 Document Structure

### Tier 1 — Operational (Root)
| Document | Purpose |
|----------|---------|
| [HANDOFF.md](./HANDOFF.md) | Current session tasks + implementation plan |
| [START_HERE.md](./START_HERE.md) | This file — navigation hub |

### Tier 2 — Project (/project/)
| Document | Purpose |
|----------|---------|
| [STATUS.md](./project/STATUS.md) | Phase tracking + completion criteria |
| [TEST_PLAN.md](./project/TEST_PLAN.md) | Test scenarios + validation |
| [V3_ARCHITECTURE.md](./project/V3_ARCHITECTURE.md) | Master dataset architecture |
| [V3_IMPLEMENTATION_GUIDE.md](./project/V3_IMPLEMENTATION_GUIDE.md) | Module interfaces + naming |

### Tier 3 — Reference (/reference/)
| Document | Purpose |
|----------|---------|
| [metric_definitions.md](./reference/metric_definitions.md) | TIR, MAGE, MODD, gap detection |
| [minimed_780g_ref.md](./reference/minimed_780g_ref.md) | CSV structure + sensor lifecycle |
| [GIT_WORKFLOW.md](./reference/GIT_WORKFLOW.md) | Commit conventions + branching |
| [V3_ARCHITECTURE_DECISIONS.md](./reference/V3_ARCHITECTURE_DECISIONS.md) | Design rationale |

---

## 🖥️ Quick Start

```bash
cd /Users/jomostert/Documents/Projects/agp-plus
lsof -ti:3001 | xargs kill -9 2>/dev/null || true
export PATH="/opt/homebrew/bin:$PATH"
npx vite --port 3001
```

→ http://localhost:3001

---

## 🧩 Architecture Status

**Existing (v3.0)**:
- ✅ IndexedDB sensor storage (219 sensors)
- ✅ Alert clustering (`sensorEventClustering.js`)
- ✅ Sensor stats engine (`sensor-history-engine.js`)
- ✅ SQLite import UI (`SensorImport.jsx`)

**Missing (v3.1)**:
- ❌ CSV section parser (3-section format)
- ❌ Gap analyzer (≥120 min detection)
- ❌ Cluster+gap matcher
- ❌ Registration UI (confirm/ignore)
- ❌ Lock-based CRUD

---

## 📊 Testdata

**Primary**: `test-data/SAMPLE__Jo Mostert 30-10-2025_7d.csv`
- 7 days (Oct 24-30, 2025)
- 2 confirmed sensor changes (Oct 19, Oct 25)
- 2826 lines, 3 sections

**Sensor DB**: `public/sensor_database.db` (219 sensors, locked)

---

## 🛠️ Implementation Phases

1. **CSV Parser** - Auto-detect sections
2. **Gap Analyzer** - Find glucose gaps ≥120 min
3. **Matcher** - Correlate clusters + gaps
4. **UI** - Review candidates
5. **CRUD** - Lock old sensors

See [HANDOFF.md](./HANDOFF.md) for detailed tasks.

---

**Version**: v3.0 → v3.1  
**Focus**: Sensor registration from CSV  
**Server**: Vite on port 3001
