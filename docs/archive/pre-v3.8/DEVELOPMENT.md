# 🔧 DEVELOPMENT GUIDE - AGP+ v3.8.2

**Purpose:** How to code, test, debug, and ship features  
**Read Time:** 10 minutes  
**Prerequisites:** Read `START_HERE.md` and `ARCHITECTURE.md`

---

## 🛠️ DEVELOPMENT ENVIRONMENT

### Essential Tools

**Desktop Commander** (MANDATORY)
```javascript
// ✅ CORRECT - Use Desktop Commander
Desktop Commander:read_file({ path: "/Users/jomostert/Documents/Projects/agp-plus/src/..." })

// ❌ WRONG - Don't use container tools
bash_tool({ command: "cat src/..." })  // Won't work - not in container!
```

**Why Desktop Commander?**
- Project lives on macOS laptop, NOT in container
- Standard file tools don't have access
- Must use absolute paths always

### Server Startup

```bash
# ALWAYS use this exact sequence
cd /Users/jomostert/Documents/Projects/agp-plus
export PATH="/opt/homebrew/bin:$PATH"  # Required for npm via Homebrew
npx vite --port 3001
```

**Port Management:**
```bash
# If port 3001 is busy
lsof -ti:3001 | xargs kill -9

# Then restart server
npx vite --port 3001
```

### Browser Setup
- Use Chrome with connector
- Open `localhost:3001`
- Open DevTools (Console + Network tabs)
- Safari has better Promise inspection (use for complex async debugging)

---

## 📋 CODING PATTERNS

### Pattern 1: Adding a New Feature

**Question Framework:**
1. **Where does the logic belong?** (Component/Hook/Engine/Storage)
2. **Does it touch data?** (Use storage layer)
3. **Does it calculate?** (Use engine)
4. **Does it coordinate?** (Use hook)
5. **Does it render?** (Use component)

**Example: Add "Weekly Summary" Feature**

```javascript
// ❌ WRONG - All in one component
function WeeklySummary({ data }) {
  const [summary, setSummary] = useState(null);
  
  useEffect(() => {
    // Business logic in component = bad
    const weekData = data.filter(/* ... */);
    const avgGlucose = weekData.reduce((sum, r) => sum + r.glucose, 0) / weekData.length;
    const tir = weekData.filter(r => r.glucose >= 70 && r.glucose <= 180).length / weekData.length * 100;
    setSummary({ avgGlucose, tir });
  }, [data]);
  
  return <div>{summary?.avgGlucose}</div>;
}

// ✅ CORRECT - Layered approach

// LAYER 3: Engine (business logic)
// File: src/core/weekly-summary-engine.js
export function calculateWeeklySummary(data) {
  const avgGlucose = data.reduce((sum, r) => sum + r.glucose, 0) / data.length;
  const inRange = data.filter(r => r.glucose >= 70 && r.glucose <= 180);
  const tir = (inRange.length / data.length) * 100;
  
  return { avgGlucose, tir };
}

// LAYER 2: Hook (orchestration)
// File: src/hooks/useWeeklySummary.js
import { useMemo } from 'react';
import { calculateWeeklySummary } from '../core/weekly-summary-engine.js';

export function useWeeklySummary(data) {
  return useMemo(() => {
    if (!data || data.length === 0) return null;
    return calculateWeeklySummary(data);
  }, [data]);
}

// LAYER 1: Component (presentation)
// File: src/components/WeeklySummary.jsx
import { useWeeklySummary } from '../hooks/useWeeklySummary';

export function WeeklySummary({ data }) {
  const summary = useWeeklySummary(data);
  
  if (!summary) return null;
  
  return (
    <div className="weekly-summary">
      <h3>WEEKLY SUMMARY</h3>
      <p>Average: {summary.avgGlucose.toFixed(1)} mg/dL</p>
      <p>TIR: {summary.tir.toFixed(1)}%</p>
    </div>
  );
}
```

### Pattern 2: Adding Storage Operations

**Always create wrapper functions in storage layer:**

```javascript
// File: src/storage/masterDatasetStorage.js

/**
 * Get readings for specific week
 * @param {Date} weekStart - Start of week
 * @returns {Promise<Array>} Readings for that week
 */
export async function getWeekReadings(weekStart) {
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 7);
  
  // Reuse existing function
  return getMasterDataset(weekStart, weekEnd);
}
```

**Never write IndexedDB code outside storage layer:**
```javascript
// ❌ WRONG - IndexedDB in hook
export function useWeeklySummary(date) {
  const [data, setData] = useState([]);
  
  useEffect(() => {
    const db = await openDB('agp-plus-db', 3);  // NO!
    const readings = await db.getAll('months');  // NO!
    setData(readings);
  }, [date]);
}

// ✅ CORRECT - Use storage function
export function useWeeklySummary(date) {
  const [data, setData] = useState([]);
  
  useEffect(() => {
    getWeekReadings(date).then(setData);  // YES!
  }, [date]);
}
```

### Pattern 3: Event Detection

**Use the established detection pattern:**

```javascript
// File: src/core/day-profile-engine.js

/**
 * Detect new event type
 * @param {Array} dayData - Readings for single day
 * @returns {Array} Event markers
 */
function detectNewEvent(dayData) {
  const events = [];
  
  // Scan readings for event criteria
  for (const row of dayData) {
    if (row.someCondition) {
      const timestamp = utils.parseDate(row.date, row.time);
      events.push({
        timestamp,
        minuteOfDay: timestamp.getHours() * 60 + timestamp.getMinutes(),
        type: 'new_event',
        confidence: 'high',  // or 'medium', 'low'
        source: 'csv',       // or 'gap', 'database'
        metadata: {
          // Additional context
        }
      });
    }
  }
  
  return events;
}
```

### Pattern 4: Component Styling (Brutalist)

**Follow the brutalist design system:**

```jsx
// ✅ CORRECT - Brutalist component
function MyComponent() {
  return (
    <div style={{
      border: '3px solid #000',      // Always 3px black border
      backgroundColor: '#fff',        // White background
      padding: '16px 24px',          // Consistent padding
      fontFamily: 'Courier New, monospace',  // Only monospace
      fontSize: '14px',              // Standard body text
      color: '#000'                  // Black text
    }}>
      <h3 style={{
        fontSize: '18px',
        fontWeight: 'bold',
        textTransform: 'uppercase',  // Headers always uppercase
        letterSpacing: '2px',        // Wide tracking
        marginBottom: '12px'
      }}>
        SECTION HEADER
      </h3>
      <p>Content goes here.</p>
    </div>
  );
}

// ❌ WRONG - Don't do this
function MyComponent() {
  return (
    <div className="rounded-lg shadow-lg bg-gradient-to-r from-blue-400 to-purple-500">
      <h3 className="text-2xl font-sans">Pretty Title</h3>  // NO rounded corners, NO gradients, NO sans-serif!
    </div>
  );
}
```

---

## 🧪 TESTING STRATEGY

### Manual Testing Checklist

**After ANY code change:**

1. **Server Running?**
   ```bash
   # Check if server is up
   curl localhost:3001  # Should return HTML
   ```

2. **Console Clean?**
   - Open browser console
   - Look for errors (red text)
   - Check for warnings (yellow text)
   - Verify no infinite loops (repeated logs)

3. **Core Features Work?**
   - [ ] Upload CSV → Data appears
   - [ ] Change date range → Metrics update
   - [ ] Open day profiles → All 7 days render
   - [ ] Comparison → Shows prev period
   - [ ] Export → Downloads file

4. **New Feature Works?**
   - [ ] Feature renders correctly
   - [ ] Data flows through layers
   - [ ] No console errors
   - [ ] Brutalist styling correct

### Debugging Console Logs

**Use structured logging:**

```javascript
// ✅ GOOD - Structured log
console.log('[useWeeklySummary] Data loaded:', {
  weekStart: weekStart.toISOString(),
  readingCount: data.length,
  avgGlucose: summary.avgGlucose
});

// ❌ BAD - Unstructured log
console.log('data loaded', data);  // Hard to scan, no context
```

**Remove logs before commit:**
```bash
# Search for console.log before committing
grep -r "console.log" src/

# Keep only error logging:
console.error('[Component] Failed to load:', err);  // Keep this
```

### Performance Testing

**Check query times:**
```javascript
console.time('Query 14 days');
const data = await getMasterDataset(start, end);
console.timeEnd('Query 14 days');  // Should be <50ms
```

**Check render times:**
```javascript
// In component
useEffect(() => {
  console.time('Render day profiles');
}, []);

useEffect(() => {
  console.timeEnd('Render day profiles');  // Should be <100ms
}, [profiles]);
```

---

## 🐛 DEBUGGING GUIDE

### Problem: "No data showing after upload"

**Debug Steps:**

1. **Check CSV parse:**
   ```javascript
   // In v2parser.js, add temporarily:
   console.log('[parseCSV] Parsed rows:', parsedData.length);
   console.log('[parseCSV] Sample row:', parsedData[0]);
   ```

2. **Check storage:**
   ```javascript
   // In browser console:
   const db = await indexedDB.open('agp-plus-db', 3);
   console.log('DB opened:', db);
   
   // Check months store
   const tx = db.transaction('months', 'readonly');
   const months = await tx.objectStore('months').getAllKeys();
   console.log('Month keys:', months);
   ```

3. **Check metadata:**
   ```javascript
   // In browser console:
   const metadata = await db.transaction('metadata').objectStore('metadata').get('master');
   console.log('Metadata:', metadata);
   console.log('Reading count:', metadata.count);
   console.log('Date range:', metadata.dateRange);
   ```

4. **Check component state:**
   ```javascript
   // In AGPGenerator.jsx, add temporarily:
   console.log('[AGPGenerator] Readings:', {
     count: readings?.length,
     sample: readings?.[0],
     dateRange: { startDate, endDate }
   });
   ```

### Problem: "Sensor lines not appearing"

**Debug Steps:**

1. **Check sensor database:**
   ```javascript
   // In browser console:
   const sensorDb = JSON.parse(localStorage.getItem('agp-sensor-database'));
   console.log('Sensors:', sensorDb.sensors.length);
   console.log('Recent sensors:', sensorDb.sensors.slice(-3));
   ```

2. **Check detection:**
   ```javascript
   // In day-profile-engine.js detectSensorChanges(), add temporarily:
   console.log('[detectSensorChanges] Target date:', targetDate);
   console.log('[detectSensorChanges] Sensors found:', allChanges.length);
   console.log('[detectSensorChanges] Changes:', allChanges);
   ```

3. **Check day profile props:**
   ```javascript
   // In DayProfileCard.jsx, add temporarily:
   console.log('[DayProfileCard] Sensor changes:', sensorChanges);
   console.log('[DayProfileCard] Rendering for date:', date);
   ```

4. **Check SVG rendering:**
   - Open browser inspector
   - Find day profile SVG element
   - Look for `<line>` elements with `stroke="#dc2626"`
   - Check if they have correct x/y coordinates

### Problem: "Performance is slow"

**Debug Steps:**

1. **Check cache hit rate:**
   ```javascript
   // In masterDatasetStorage.js getMasterDataset(), add temporarily:
   console.log('[getMasterDataset] Cache hit?', metadata.sorted ? 'YES' : 'NO');
   console.time('Query');
   // ... query code ...
   console.timeEnd('Query');
   ```

2. **Check month bucket size:**
   ```javascript
   // In browser console:
   const db = await indexedDB.open('agp-plus-db', 3);
   const tx = db.transaction('months', 'readonly');
   const allMonths = await tx.objectStore('months').getAll();
   
   allMonths.forEach(month => {
     console.log(month.month, 'readings:', month.count);
   });
   ```

3. **Profile React renders:**
   ```javascript
   // In component, add temporarily:
   console.log('[Component] Render count:', ++renderCount);
   console.log('[Component] Props changed:', { ...props });
   ```

### Problem: "Git conflicts"

**See:** `GIT_WORKFLOW.md` for complete recovery guide

**Quick fix:**
```bash
# Save your work
git stash

# Get latest
git pull origin v3.0-dev

# Apply your work
git stash pop

# Resolve conflicts in editor
# Then:
git add .
git commit -m "fix: resolve merge conflicts"
```

---

## 📦 ADDING DEPENDENCIES

### When to Add a Package

**✅ Add package when:**
- Solves complex problem (e.g., sql.js for SQLite parsing)
- Well-maintained (recent commits)
- Small bundle size (<100KB)
- No good native alternative

**❌ Don't add package when:**
- Can write in <50 lines of code yourself
- Only need one function
- Huge bundle size (>500KB)
- Unmaintained (no commits in 6+ months)

### How to Add

```bash
# Install
cd /Users/jomostert/Documents/Projects/agp-plus
npm install package-name

# Test import
# In your file:
import { something } from 'package-name';

# Restart server
# Kill and restart vite
```

**Update package.json:**
- Always commit package.json + package-lock.json together
- Document WHY in commit message

---

## 📝 COMMIT GUIDELINES

### Commit Message Format

```
<type>: <short description>

<longer description if needed>
<list of changes>

<references to issues/docs>
```

**Types:**
- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation only
- `chore:` Maintenance (cleanup, deps)
- `refactor:` Code restructure (no behavior change)
- `test:` Add/modify tests
- `perf:` Performance improvement

### Good Commit Messages

```
✅ GOOD:
feat: add weekly summary calculation

- Add calculateWeeklySummary engine function
- Create useWeeklySummary hook
- Add WeeklySummary component with brutalist styling
- Tested with 28k readings (query <50ms)

❌ BAD:
fix stuff
```

```
✅ GOOD:
fix: sensor lines not rendering in day profiles

- Updated DayProfileCard SVG logic to filter type='start'
- Added console logging for debugging
- Tested with 219 imported sensors
- Closes Phase 2B visualization

❌ BAD:
update component
```

### When to Commit

**Commit frequently:**
- After completing one logical change
- Before switching tasks
- After fixing a bug
- Before experimenting (so you can revert)

**Don't commit:**
- Broken code (unless marked WIP)
- console.log statements (debug only)
- Commented-out code (delete it)
- Half-finished features (finish or stash)

---

## 🚢 DEPLOYMENT CHECKLIST

### Pre-Commit Checklist

- [ ] Remove all console.log (keep console.error for user-facing errors)
- [ ] Remove all commented-out code
- [ ] Test all core features (CSV upload, day profiles, comparison, export)
- [ ] Check browser console for errors
- [ ] Verify brutalist styling (no gradients, rounded corners, or shadows)
- [ ] Update CHANGELOG.md with changes
- [ ] Update relevant handoff docs if architecture changed

### Commit & Push

```bash
# Stage changes
git add src/path/to/file.js

# Commit with good message
git commit -m "feat: add weekly summary feature

- Add engine, hook, component (proper layering)
- Tested with 28k readings
- Brutalist styling applied"

# Push to v3.0-dev
git push origin v3.0-dev
```

### Post-Push Checklist

- [ ] Verify push succeeded (check GitHub)
- [ ] Update START_HERE.md if needed
- [ ] Update documentation index
- [ ] Create handoff doc for next session (if major change)

---

## 🎓 COMMON MISTAKES (AND FIXES)

### Mistake 1: Business Logic in Component

**Bad:**
```jsx
function MyComponent({ data }) {
  const tir = useMemo(() => {
    const inRange = data.filter(r => r.glucose >= 70 && r.glucose <= 180);
    return (inRange.length / data.length) * 100;  // Logic in component!
  }, [data]);
}
```

**Fix:** Move to engine
```javascript
// src/core/metrics-engine.js
export function calculateTIR(data) {
  const inRange = data.filter(r => r.glucose >= 70 && r.glucose <= 180);
  return (inRange.length / data.length) * 100;
}

// src/components/MyComponent.jsx
import { calculateTIR } from '../core/metrics-engine';
const tir = useMemo(() => calculateTIR(data), [data]);
```

### Mistake 2: Direct IndexedDB in Hook

**Bad:**
```javascript
export function useData() {
  const [data, setData] = useState([]);
  useEffect(() => {
    const db = await openDB('agp-plus-db', 3);  // NO!
    const readings = await db.getAll('months');
    setData(readings);
  }, []);
}
```

**Fix:** Use storage function
```javascript
// src/storage/masterDatasetStorage.js
export async function getAllReadings() {
  const db = await openDB('agp-plus-db', 3);
  return db.getAll('months');
}

// src/hooks/useData.js
import { getAllReadings } from '../storage/masterDatasetStorage';
useEffect(() => {
  getAllReadings().then(setData);
}, []);
```

### Mistake 3: Forgetting Desktop Commander

**Bad:**
```javascript
bash_tool({ command: "cat src/file.js" })  // Won't work!
```

**Fix:**
```javascript
Desktop Commander:read_file({ 
  path: "/Users/jomostert/Documents/Projects/agp-plus/src/file.js"
})
```

### Mistake 4: Not Removing Debug Logs

**Bad:**
```javascript
console.log('debug data', data);  // Left in production code
```

**Fix:** Remove before commit, or use conditional logging:
```javascript
const DEBUG = false;  // Set to true locally, false before commit
if (DEBUG) console.log('[Debug] Data:', data);
```

---

## 🔗 RELATED DOCUMENTATION

**Architecture details:**
→ `ARCHITECTURE.md` (data flow, storage schema)

**Git workflow:**
→ `GIT_WORKFLOW.md` (branching, merging, recovery)

**Sensor system:**
→ `SENSOR_SYSTEM.md` (Phase 2 implementation)

**Full technical spec:**
→ `PROJECT_BRIEFING_V3_8.md` (528 lines)

**Version history:**
→ `CHANGELOG.md` (what changed when)

---

**Ready to code?**  
Pick a task → Follow the patterns → Test thoroughly → Commit with good message! 🚀
