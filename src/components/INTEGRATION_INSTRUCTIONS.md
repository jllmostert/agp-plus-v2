# SensorRegistration Component - Integration Guide

## Files Created

1. **SensorRegistration.jsx** (231 lines) - Main component
2. **SensorRegistration.css** (289 lines) - Brutalist styling

## Integration Steps

### Step 1: Add Component to Project

```bash
# Copy files to project
cp SensorRegistration.jsx src/components/
cp SensorRegistration.css src/components/
```

### Step 2: Update App.jsx (or Main Component)

Add state and import:

```jsx
import { useState } from 'react';
import SensorRegistration from './components/SensorRegistration';

function App() {
  const [sensorModalOpen, setSensorModalOpen] = useState(false);
  
  // ... your existing code
  
  return (
    <>
      {/* Your existing layout */}
      <header>
        <h1>AGP+ v3.0</h1>
        <button onClick={() => setSensorModalOpen(true)}>SENSORS</button>
        {/* ... other buttons */}
      </header>
      
      {/* Add sensor registration modal */}
      <SensorRegistration 
        isOpen={sensorModalOpen}
        onClose={() => setSensorModalOpen(false)}
      />
      
      {/* ... rest of your app */}
    </>
  );
}
```

### Step 3: Verify Dependencies

Component expects these modules to exist:

```javascript
// Core engines (should exist from Phases 1-3)
import { parseCareLinksections } from '../core/csvSectionParser';
import { detectGlucoseGaps } from '../core/glucoseGapAnalyzer';
import { matchClustersToGaps } from '../core/sensorDetectionEngine';
import { clusterSensorEvents } from '../core/sensorEventClustering';

// Storage (should exist from v3.0)
import { addSensor, getAllSensors } from '../storage/sensorStorage';
```

### Step 4: Test Flow

1. Click **SENSORS** button → Modal opens
2. Click "SELECT CSV FILE" → Choose test CSV
3. Click "LOAD & ANALYSE" → Should detect 2 candidates
4. Review candidates with HIGH confidence badges
5. Click "✓ CONFIRM" → Adds to IndexedDB
6. Check console for debug logs
7. Close modal → Sensors stored persistently

## Expected Behavior

**With test CSV** (`SAMPLE__Jo Mostert 30-10-2025_7d.csv`):
- ✅ 2 sensor changes detected
- ✅ Both HIGH confidence (80-90/100)
- ✅ Timestamps: Oct 25 08:11, Oct 30 13:41

**Debug log should show:**
```
[HH:MM:SS] File selected: SAMPLE__Jo Mostert 30-10-2025_7d.csv (123.4 KB)
[HH:MM:SS] Reading CSV file...
[HH:MM:SS] CSV loaded: 245678 characters, 2826 lines
[HH:MM:SS] Parsing CSV sections...
[HH:MM:SS] Parsed: 460 alerts, 2016 glucose readings
[HH:MM:SS] Clustering sensor events...
[HH:MM:SS] Found 8 event clusters
[HH:MM:SS] Detecting glucose gaps...
[HH:MM:SS] Found 2 gaps ≥120 min
[HH:MM:SS] Matching clusters to gaps...
[HH:MM:SS] Identified 2 sensor change candidates
[HH:MM:SS] ✅ Analysis complete: 2 candidates found
```

## Styling Notes

- **Brutalist theme**: 3px solid borders, high contrast
- **Monospace font**: Courier New throughout
- **Color coding**:
  - 🟢 HIGH confidence: Green (#4A9D4A)
  - 🟡 MEDIUM confidence: Gold (#D4A017)
  - 🔴 LOW confidence: Red (#B22222)
- **Debug log**: Terminal-style (black bg, green text)

## Known Limitations (Phase 4)

- ✂ **SPLIT** button shows alert (Phase 5 feature)
- No duplicate detection (re-uploading same CSV will duplicate sensors)
- No date range validation (can add overlapping sensors)
- Lock system not implemented yet

## Next Steps (Phase 5)

1. Implement **lock system** (protect old sensors)
2. Add **duplicate detection** (prevent re-adding same sensor)
3. Implement **split functionality** (manual date adjustment)
4. Add **date range warnings** (overlapping sensors)

## Troubleshooting

**Modal doesn't open:**
- Check `sensorModalOpen` state is toggled
- Verify `isOpen` prop is passed correctly

**"No sensor changes detected":**
- Check CSV format (3 sections with proper headers)
- Verify glucose readings exist in section 3
- Ensure alerts exist in section 1

**Console errors about missing modules:**
- Verify Phases 1-3 engines are in `src/core/`
- Check `sensorStorage.js` exists in `src/storage/`

**Candidates not showing:**
- Open DevTools console for debug logs
- Check `candidates` state array is populated
- Verify `matchClustersToGaps` returns array

## File Structure

```
src/
├── components/
│   ├── SensorRegistration.jsx    ← NEW
│   ├── SensorRegistration.css    ← NEW
│   └── SensorHistoryModal.jsx    (existing)
├── core/
│   ├── csvSectionParser.js       (Phase 1)
│   ├── glucoseGapAnalyzer.js     (Phase 2)
│   ├── sensorDetectionEngine.js  (Phase 3)
│   └── sensorEventClustering.js  (existing)
└── storage/
    └── sensorStorage.js          (existing)
```

---

**Phase 4 Status**: âœ… Component Complete
**Ready for**: Local testing + integration
**Next**: Phase 5 (Lock system + advanced features)
