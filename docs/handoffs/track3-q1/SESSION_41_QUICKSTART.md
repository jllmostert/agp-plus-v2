# Session 41 Quick Start: UIContext Creation

**Date**: TBD  
**Duration**: 2 hours  
**Goal**: Create UIContext.jsx + useUI.js hook

---

## 🎯 SESSION GOAL

Create UIContext with 6-8 state variables extracted from AGPGenerator.

---

## ⚡ QUICK START (5 min read)

### Step 0: Server + Context Load
```bash
cd agp-plus && export PATH="/opt/homebrew/bin:$PATH" && npx vite --port 3001
```

### Step 1: Analyze Existing Contexts (30 min)

**Read these files**:
1. `src/contexts/DataContext.jsx` - Check if has patientInfo/workdays
2. `src/contexts/PeriodContext.jsx` - Check selectedPeriod vs selectedDateRange
3. `src/components/AGPGenerator.jsx` - Confirm 8 state variables

**Questions to answer**:
- Does DataContext have patientInfo? workdays?
- Does PeriodContext have selectedDateRange?
- Are these duplicates or different state?

**Decision**: Option A (all 8 in UIContext) or Option B (distribute by semantics)

### Step 2: Create UIContext.jsx (1 hour)

**File**: `src/contexts/UIContext.jsx`

**Template** (follow DataContext pattern):
```javascript
import React, { createContext, useContext, useState, useMemo, useCallback } from 'react';

const UIContext = createContext(null);

export function UIProvider({ children }) {
  // State variables (6-8)
  const [dayNightEnabled, setDayNightEnabled] = useState(false);
  const [loadToast, setLoadToast] = useState(null);
  const [batchAssignmentDialog, setBatchAssignmentDialog] = useState({ open: false, suggestions: [] });
  const [pendingUpload, setPendingUpload] = useState(null);
  const [numDaysProfile, setNumDaysProfile] = useState(7);
  // ... + others based on distribution decision
  
  // Helper methods
  const showToast = useCallback((message) => {
    setLoadToast(message);
    setTimeout(() => setLoadToast(null), 3000);
  }, []);
  
  // ... more helpers
  
  // Context value
  const value = useMemo(() => ({
    // State
    dayNightEnabled,
    loadToast,
    // ... etc
    
    // Setters
    setDayNightEnabled,
    showToast,
    // ... etc
  }), [/* dependencies */]);
  
  return <UIContext.Provider value={value}>{children}</UIContext.Provider>;
}

export function useUI() {
  const context = useContext(UIContext);
  if (!context) throw new Error('useUI must be used within UIProvider');
  return context;
}
```

**Checklist**:
- [ ] All state variables declared
- [ ] Helper methods created
- [ ] useMemo with correct dependencies
- [ ] useUI hook with error check
- [ ] Export UIProvider + useUI

### Step 3: Create useUI.js Hook (30 min)

**File**: `src/hooks/useUI.js`

**Simple wrapper**:
```javascript
import { useUI as useUIContext } from '../contexts/UIContext';

export default function useUI() {
  return useUIContext();
}
```

**OR** if need destructured version:
```javascript
import { useUI as useUIContext } from '../contexts/UIContext';

export default function useUI() {
  const context = useUIContext();
  return {
    // Destructure what's commonly used
    dayNightEnabled: context.dayNightEnabled,
    setDayNightEnabled: context.setDayNightEnabled,
    // ... etc
  };
}
```

### Step 4: Verify (10 min)

**Check**:
- [ ] No syntax errors
- [ ] Context exports correctly
- [ ] Hook imports context
- [ ] Ready for Session 42 integration

---

## 📊 8 STATE VARIABLES TO EXTRACT

From `AGPGenerator.jsx` (lines ~106-1451):

1. **selectedDateRange** (line 106)
   ```javascript
   const [selectedDateRange, setSelectedDateRange] = useState({
     start: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
     end: new Date()
   });
   ```

2. **dayNightEnabled** (line 116)
   ```javascript
   const [dayNightEnabled, setDayNightEnabled] = useState(false);
   ```

3. **patientInfo** (line 128)
   ```javascript
   const [patientInfo, setPatientInfo] = useState(null);
   ```

4. **loadToast** (line 129)
   ```javascript
   const [loadToast, setLoadToast] = useState(null);
   ```

5. **batchAssignmentDialog** (line 130)
   ```javascript
   const [batchAssignmentDialog, setBatchAssignmentDialog] = useState({ 
     open: false, 
     suggestions: [] 
   });
   ```

6. **pendingUpload** (line 131)
   ```javascript
   const [pendingUpload, setPendingUpload] = useState(null);
   ```

7. **workdays** (line 1450)
   ```javascript
   const [workdays, setWorkdays] = useState(null);
   ```

8. **numDaysProfile** (line 1451)
   ```javascript
   const [numDaysProfile, setNumDaysProfile] = useState(7);
   ```

---

## 🎯 END OF SESSION 41

**Deliverables**:
- [ ] UIContext.jsx created (150-200 lines)
- [ ] useUI.js hook created (10-30 lines)
- [ ] No integration yet (Session 42)
- [ ] Git commit: "Create UIContext + useUI hook (not integrated)"

**Next**: Session 42 - Integration in AGPGenerator

---

## 📚 REFERENCE FILES

**Read before starting**:
- `/Users/jomostert/Documents/Projects/agp-plus/src/contexts/DataContext.jsx`
- `/Users/jomostert/Documents/Projects/agp-plus/src/contexts/PeriodContext.jsx`
- `/Users/jomostert/Documents/Projects/agp-plus/src/components/AGPGenerator.jsx` (lines 106-131, 1450-1451)

**Pattern examples**:
- `src/hooks/useData.js` (simple wrapper)
- `src/hooks/useModalState.js` (helper methods)

---

**Ready to start Session 41? Read PHASE4_PLAN.md first!**
