# 🎯 HANDOFF SESSION 2: Extract usePanelNavigation Hook

**Datum**: 2025-11-15  
**Fase**: 1.2 - Quick Wins  
**Doel**: Extract panel navigation + keyboard shortcuts naar custom hook  
**Geschatte tijd**: 60-75 minuten  
**Status**: 🟢 READY TO START

---

## 📋 PRE-SESSION CHECKLIST

### Before you start:
- [ ] Read this entire document first (prevents context overflow)
- [ ] Navigate to project: `cd /Users/jomostert/Documents/Projects/agp-plus`
- [ ] Check current branch: `git branch` (should be `main`)
- [ ] Pull latest changes: `git pull origin main`
- [ ] Verify Session 1 completed: `ls src/hooks/useModalState.js` (should exist)
- [ ] Start dev server: `export PATH="/opt/homebrew/bin:$PATH" && npx vite --port 3001`
- [ ] Open app: http://localhost:3001
- [ ] Test panel switching works (click IMPORT/DAGPROFIELEN/SENSOREN/EXPORT)
- [ ] Test keyboard shortcuts work (Ctrl+1/2/3/4, Ctrl+Shift+D)
- [ ] Create PROGRESS.md: `touch PROGRESS_SESSION_2.md`

---

## 🎯 SESSION GOAL

**Single Focus**: Extract panel navigation and keyboard shortcuts logic from AGPGenerator.jsx into a new `usePanelNavigation` hook.

**What we're doing**:
1. Create new file: `src/hooks/usePanelNavigation.js`
2. Extract activePanel state
3. Extract showDevTools state + localStorage persistence
4. Extract showShortcuts state
5. Extract ALL keyboard shortcut logic (the big one!)
6. Update AGPGenerator.jsx to use the hook
7. Test everything still works (especially keyboard shortcuts!)
8. Commit + push

**What we're NOT doing** (save for next session):
- ❌ Don't touch useImportExport yet
- ❌ Don't refactor other state
- ❌ Don't change keyboard shortcut behavior
- ❌ Don't add new features

---

## 🚀 IMPLEMENTATION STEPS

### STEP 1: Create the hook file (15 min)

**Location**: `/Users/jomostert/Documents/Projects/agp-plus/src/hooks/usePanelNavigation.js`

**Action**: Create new file with this exact code:

```javascript
import { useState, useEffect } from 'react';

/**
 * Panel navigation + keyboard shortcuts
 * Manages active panel, DevTools visibility, and all keyboard shortcuts
 * 
 * Extracted from AGPGenerator.jsx to reduce component size
 * Part of Phase 1 refactoring (Quick Wins)
 */
export function usePanelNavigation() {
  // Active panel state
  const [activePanel, setActivePanel] = useState('import');
  
  // DevTools visibility (persisted in localStorage)
  const [showDevTools, setShowDevTools] = useState(() => {
    const saved = localStorage.getItem('agp-devtools-enabled');
    return saved === 'true';
  });
  
  // Keyboard shortcuts modal
  const [showShortcuts, setShowShortcuts] = useState(false);

  // Persist DevTools state to localStorage
  useEffect(() => {
    localStorage.setItem('agp-devtools-enabled', String(showDevTools));
  }, [showDevTools]);

  // Keyboard shortcuts handler
  useEffect(() => {
    const handleKeyPress = (e) => {
      // Ctrl+1/2/3/4: Switch panels
      if (e.ctrlKey && ['1', '2', '3', '4'].includes(e.key)) {
        e.preventDefault();
        const panels = ['import', 'dagprofielen', 'sensoren', 'export'];
        const panelIndex = parseInt(e.key) - 1;
        setActivePanel(panels[panelIndex]);
        console.log(`[Keyboard] Switched to panel: ${panels[panelIndex]}`);
      }
      
      // Ctrl+Shift+D: Toggle DevTools
      if (e.ctrlKey && e.shiftKey && e.key === 'D') {
        e.preventDefault();
        setShowDevTools(prev => {
          console.log(`[Keyboard] DevTools: ${!prev}`);
          return !prev;
        });
      }
      
      // Escape: Close DevTools (only if DevTools is open)
      if (e.key === 'Escape' && showDevTools) {
        setShowDevTools(false);
        console.log('[Keyboard] DevTools closed via Escape');
      }
      
      // Ctrl+K: Show/hide keyboard shortcuts modal
      if (e.ctrlKey && e.key === 'k') {
        e.preventDefault();
        setShowShortcuts(prev => {
          console.log(`[Keyboard] Shortcuts modal: ${!prev}`);
          return !prev;
        });
      }
    };

    // Add event listener
    window.addEventListener('keydown', handleKeyPress);
    
    // Cleanup on unmount
    return () => {
      window.removeEventListener('keydown', handleKeyPress);
    };
  }, [showDevTools]); // Re-run when showDevTools changes (for Escape handling)

  // Helper: Toggle DevTools programmatically
  const toggleDevTools = () => {
    setShowDevTools(prev => !prev);
  };

  return {
    // Panel navigation
    activePanel,
    setActivePanel,
    
    // DevTools
    showDevTools,
    setShowDevTools,
    toggleDevTools,
    
    // Keyboard shortcuts modal
    showShortcuts,
    setShowShortcuts
  };
}
```

**Update PROGRESS.md**:
```
## Session 2 Progress
- [x] Created src/hooks/usePanelNavigation.js
- [ ] Updated AGPGenerator.jsx imports
- [ ] Replaced useState calls
- [ ] Replaced keyboard shortcut useEffect
- [ ] Tested panel switching
- [ ] Tested keyboard shortcuts
- [ ] Committed changes
```

**Checkpoint**: File created, no errors. ✅

---

### STEP 2: Update AGPGenerator imports (3 min)

**Location**: `src/components/AGPGenerator.jsx`

**Find this line** (should be there from Session 1):
```javascript
import { useModalState } from '../hooks/useModalState';
```

**Add after it**:
```javascript
import { usePanelNavigation } from '../hooks/usePanelNavigation';
```

**Update PROGRESS.md**:
```
- [x] Updated AGPGenerator.jsx imports
```

**Checkpoint**: No import errors. ✅

---

### STEP 3: Replace state declarations (10 min)

**Location**: `src/components/AGPGenerator.jsx`

**Find and REMOVE these lines** (around line 50-80):

```javascript
const [activePanel, setActivePanel] = useState('import');
```

```javascript
const [showDevTools, setShowDevTools] = useState(() => {
  const saved = localStorage.getItem('agp-devtools-enabled');
  return saved === 'true';
});
```

```javascript
const [showShortcuts, setShowShortcuts] = useState(false);
```

**Replace with** (add after `const modals = useModalState();`):
```javascript
// Panel navigation + keyboard shortcuts (extracted to custom hook)
const navigation = usePanelNavigation();
```

**Update PROGRESS.md**:
```
- [x] Replaced useState calls with usePanelNavigation hook
```

**Checkpoint**: Component compiles. ✅

---

### STEP 4: Remove DevTools localStorage useEffect (5 min)

**Location**: `src/components/AGPGenerator.jsx`

**Find and DELETE this entire useEffect** (around line 100-110):

```javascript
// Persist DevTools setting in localStorage
useEffect(() => {
  localStorage.setItem('agp-devtools-enabled', String(showDevTools));
}, [showDevTools]);
```

**Why?** This logic is now in `usePanelNavigation` hook!

**Update PROGRESS.md**:
```
- [x] Removed DevTools localStorage useEffect (moved to hook)
```

**Checkpoint**: App still compiles. ✅

---

### STEP 5: Remove keyboard shortcuts useEffect (10 min)

**Location**: `src/components/AGPGenerator.jsx`

**Find and DELETE this entire useEffect** (around line 150-250, it's HUGE):

```javascript
// Keyboard shortcuts
useEffect(() => {
  const handleKeyPress = (e) => {
    // Ctrl+1/2/3/4: Switch between panels
    if (e.ctrlKey && ['1', '2', '3', '4'].includes(e.key)) {
      e.preventDefault();
      const panels = ['import', 'dagprofielen', 'sensoren', 'export'];
      const panelIndex = parseInt(e.key) - 1;
      setActivePanel(panels[panelIndex]);
    }
    
    // ... rest of keyboard shortcuts ...
  };

  window.addEventListener('keydown', handleKeyPress);
  return () => window.removeEventListener('keydown', handleKeyPress);
}, [showDevTools, /* other dependencies */]);
```

**Pro tip**: 
1. Find the line `// Keyboard shortcuts` (or search for `handleKeyPress`)
2. Select from `useEffect(() => {` to the matching closing `}, [dependencies]);`
3. Delete the entire block
4. This should be ~80-100 lines!

**Update PROGRESS.md**:
```
- [x] Removed keyboard shortcuts useEffect (~90 lines deleted!)
```

**Checkpoint**: App compiles, no errors. ✅

---

### STEP 6: Update state references (20 min)

**Strategy**: Replace all references to navigation state variables.

**Use find-replace** (Cmd+Shift+H in VS Code):

#### 6a. activePanel references

**Find**: `activePanel` (whole word)  
**Review each match**:
- If reading: `activePanel === 'import'` → `navigation.activePanel === 'import'`
- If setting: `setActivePanel('import')` → `navigation.setActivePanel('import')`

**Manual replacements needed** (find these patterns):

```javascript
// BEFORE:
activePanel === 'import'

// AFTER:
navigation.activePanel === 'import'
```

```javascript
// BEFORE:
onClick={() => setActivePanel('dagprofielen')}

// AFTER:
onClick={() => navigation.setActivePanel('dagprofielen')}
```

```javascript
// BEFORE:
{activePanel === 'import' && <ImportPanel />}

// AFTER:
{navigation.activePanel === 'import' && <ImportPanel />}
```

**Pro tip**: Do NOT use auto-replace-all! Review each match individually.

#### 6b. showDevTools references

**Find**: `showDevTools` (whole word)  
**Replace patterns**:

```javascript
// BEFORE:
showDevTools && <DevToolsPanel />

// AFTER:
navigation.showDevTools && <DevToolsPanel />
```

```javascript
// BEFORE:
onClick={() => setShowDevTools(!showDevTools)}

// AFTER:
onClick={() => navigation.toggleDevTools()}
```

```javascript
// BEFORE:
setShowDevTools(true)

// AFTER:
navigation.setShowDevTools(true)
```

#### 6c. showShortcuts references

**Find**: `showShortcuts` (whole word)  
**Replace patterns**:

```javascript
// BEFORE:
showShortcuts && <ShortcutsModal />

// AFTER:
navigation.showShortcuts && <ShortcutsModal />
```

```javascript
// BEFORE:
onClose={() => setShowShortcuts(false)}

// AFTER:
onClose={() => navigation.setShowShortcuts(false)}
```

**Update PROGRESS.md after each type**:
```
- [x] Updated activePanel references
- [x] Updated showDevTools references
- [x] Updated showShortcuts references
```

**Checkpoint**: No TypeScript/lint errors. App compiles. ✅

---

### STEP 7: Test functionality (15 min)

**Open http://localhost:3001**

**Test panel switching (UI)**:
1. ✅ Click "IMPORT" tab → panel changes
2. ✅ Click "DAGPROFIELEN" tab → panel changes
3. ✅ Click "SENSOREN" tab → panel changes
4. ✅ Click "EXPORT" tab → panel changes
5. ✅ Active tab highlighted correctly

**Test keyboard shortcuts**:
1. ✅ Press Ctrl+1 → switches to IMPORT panel
2. ✅ Press Ctrl+2 → switches to DAGPROFIELEN panel
3. ✅ Press Ctrl+3 → switches to SENSOREN panel
4. ✅ Press Ctrl+4 → switches to EXPORT panel
5. ✅ Press Ctrl+Shift+D → DevTools toggles open
6. ✅ Press Escape → DevTools closes (when open)
7. ✅ Press Ctrl+Shift+D again → DevTools toggles
8. ✅ Press Ctrl+K → Shortcuts modal opens
9. ✅ Press Ctrl+K again → Shortcuts modal closes

**Test DevTools persistence**:
1. ✅ Open DevTools (Ctrl+Shift+D)
2. ✅ Refresh page (Cmd+R)
3. ✅ DevTools should still be open (localStorage works!)
4. ✅ Close DevTools
5. ✅ Refresh page
6. ✅ DevTools should be closed

**Check console**:
- ✅ Should see `[Keyboard] ...` logs when using shortcuts
- ✅ No errors

**Update PROGRESS.md**:
```
- [x] Tested panel switching (UI) - WORKING ✅
- [x] Tested keyboard shortcuts - WORKING ✅
- [x] Tested DevTools persistence - WORKING ✅
- [x] No console errors ✅
```

**If bugs found**:
- Read error message carefully
- Check you replaced ALL references to old state
- Check for typos: `navigation.activePanel` not `navigation.activepanel`
- If stuck: revert with `git checkout src/components/AGPGenerator.jsx`

---

### STEP 8: Commit & push (5 min)

**Check what changed**:
```bash
git status
git diff src/components/AGPGenerator.jsx
git diff src/hooks/usePanelNavigation.js
```

**Stage changes**:
```bash
git add src/hooks/usePanelNavigation.js
git add src/components/AGPGenerator.jsx
```

**Commit**:
```bash
git commit -m "refactor(phase1): extract navigation to usePanelNavigation hook

- Created src/hooks/usePanelNavigation.js
- Extracted activePanel, showDevTools, showShortcuts states
- Moved keyboard shortcuts logic to hook (~90 lines)
- Moved DevTools localStorage persistence to hook
- AGPGenerator.jsx: -3 useState, -2 useEffect (~110 lines removed)
- All keyboard shortcuts tested and working

Part of Phase 1 (Quick Wins) refactoring.
See REFACTOR_PLAN_AGPGenerator.md for full plan."
```

**Push**:
```bash
git push origin main
```

**Update PROGRESS.md**:
```
- [x] Committed and pushed to GitHub ✅

SESSION 2 COMPLETE! 🎉
Time taken: [YOUR TIME HERE]
Lines removed: ~110 lines
Next: Session 3 (useImportExport hook - the big one!)
```

---

## 🚨 TROUBLESHOOTING

### Problem: "Cannot find module '../hooks/usePanelNavigation'"

**Cause**: File not in correct location  
**Fix**: 
```bash
ls -la src/hooks/usePanelNavigation.js
# Should exist. If not, recreate it from STEP 1.
```

---

### Problem: "navigation.activePanel is undefined"

**Cause**: Didn't call the hook correctly  
**Fix**: Check you have:
```javascript
const navigation = usePanelNavigation();
```
NOT:
```javascript
const navigation = usePanelNavigation; // Missing ()!
```

---

### Problem: Keyboard shortcuts don't work

**Cause**: useEffect still in AGPGenerator OR not removed properly  
**Fix**:
1. Search AGPGenerator.jsx for `handleKeyPress`
2. Should find ZERO matches
3. If found, you didn't delete the old useEffect
4. Delete it and test again

---

### Problem: Ctrl+1 switches panels but Escape doesn't close DevTools

**Cause**: Dependency array in useEffect might be wrong  
**Fix**: Check `usePanelNavigation.js` line ~67:
```javascript
}, [showDevTools]); // Must include showDevTools!
```

---

### Problem: DevTools doesn't persist after refresh

**Cause**: localStorage not working  
**Fix**:
1. Open DevTools Console
2. Run: `localStorage.getItem('agp-devtools-enabled')`
3. Should return `'true'` or `'false'`
4. If `null`, useEffect not running
5. Check hook is called correctly

---

### Problem: App is slow after changes

**Cause**: Too many re-renders (unlikely but check)  
**Fix**:
1. Open React DevTools Profiler
2. Record interaction
3. Check re-render counts
4. usePanelNavigation should NOT cause extra renders
5. If it does, check dependencies in useEffect

---

## 📊 SUCCESS CRITERIA

**Before committing, verify**:
- ✅ All 4 panels switch correctly (UI + keyboard)
- ✅ All keyboard shortcuts work (Ctrl+1/2/3/4, Ctrl+Shift+D, Escape, Ctrl+K)
- ✅ DevTools persists across refresh
- ✅ No console errors
- ✅ Console shows `[Keyboard]` logs when using shortcuts
- ✅ AGPGenerator.jsx is ~110 lines shorter
- ✅ Code is cleaner (no keyboard handler in component)

---

## 💾 CONTEXT PRESERVATION

**If session crashes/times out**:

1. **Save PROGRESS.md immediately**
2. **Check what was completed**: `git status`
3. **Commit partial work**:
   ```bash
   git add src/hooks/usePanelNavigation.js
   git commit -m "WIP: partial usePanelNavigation extraction"
   git push origin main
   ```
4. **Next session**: Start from last checkpoint in PROGRESS.md

**Recovery commands**:
```bash
# See what changed
git diff

# Discard if broken
git checkout src/components/AGPGenerator.jsx

# Start over
git reset --hard origin/main
```

---

## 📈 METRICS

**Starting state** (after Session 1):
- AGPGenerator.jsx: ~1980 lines
- State variables: 25

**After Session 2**:
- AGPGenerator.jsx: ~1870 lines (-110)
- State variables: 22 (-3)
- New files: +1 (usePanelNavigation.js)
- useEffects removed: 2 (keyboard + localStorage)

**Cumulative progress**: 
- Total lines removed: 130 (20 + 110)
- 32% of Phase 1 complete! 💪

---

## 🎯 NEXT SESSION PREP

**Session 3 will extract**: `useImportExport` hook (THE BIG ONE!)

**This will be the hardest session**:
- Most complex state logic
- Import validation
- Export functionality
- Progress tracking
- Merge strategies

**Estimated impact**: -200+ lines from AGPGenerator.jsx

**Recommended**: Take a break before Session 3! You earned it. ☕

---

## ⏰ TIME MANAGEMENT

**Target timeline**:
- STEP 1 (Create hook): 15 min
- STEP 2 (Import): 3 min
- STEP 3 (Replace useState): 10 min
- STEP 4 (Remove DevTools useEffect): 5 min
- STEP 5 (Remove keyboard useEffect): 10 min
- STEP 6 (Update refs): 20 min
- STEP 7 (Test): 15 min
- STEP 8 (Commit): 5 min

**Total: 83 minutes**

**If hitting 60 min mark**:
- Pause at end of completed step
- Commit working changes
- Mark incomplete in PROGRESS.md
- Continue next session

**Remember**: Quality > speed!

---

## 🔥 EMERGENCY PROCEDURES

### If keyboard shortcuts completely broken:

1. **Don't panic!**
2. **Revert hook only**: 
   ```bash
   git checkout src/hooks/usePanelNavigation.js
   ```
3. **Keep AGPGenerator changes**: They might be fine
4. **Re-read STEP 1** and recreate hook carefully
5. **Test incrementally**: One shortcut at a time

### If panels won't switch:

1. **Check activePanel reads**: `navigation.activePanel`
2. **Check activePanel writes**: `navigation.setActivePanel('import')`
3. **Add debug log**:
   ```javascript
   console.log('Current panel:', navigation.activePanel);
   ```
4. **Verify hook returns activePanel**: Check return statement

### If app won't compile:

1. **Read error message** (don't guess!)
2. **Check typos**: `navigation.activePanel` not `navigation.activepanel`
3. **Check hook is imported**: `import { usePanelNavigation } from '...'`
4. **Check hook is called**: `const navigation = usePanelNavigation();`

---

## ✅ PRE-COMMIT CHECKLIST

Before running `git commit`:

- [ ] All panels tested (4 panels)
- [ ] All keyboard shortcuts tested (7 shortcuts)
- [ ] DevTools persistence tested
- [ ] No console errors
- [ ] Console shows `[Keyboard]` logs
- [ ] App compiles without warnings
- [ ] PROGRESS.md updated
- [ ] Changes reviewed with `git diff`
- [ ] Commit message detailed

---

## 🎓 LEARNING NOTES

**What you'll learn**:
- ✅ How to extract complex useEffect logic
- ✅ How to handle localStorage in hooks
- ✅ How to manage keyboard events properly
- ✅ How to test keyboard shortcuts thoroughly
- ✅ How dependency arrays work in useEffect

**Key insight**: Keyboard shortcuts belong in a hook, not component!  
**Why?** They're cross-cutting concerns, not UI logic.

---

## 🎉 CELEBRATION CHECKPOINT

**If you complete this session**: You've removed 110 lines of complex logic!

**That's**:
- All keyboard shortcuts extracted ✅
- All localStorage logic extracted ✅
- Cleaner, more maintainable code ✅
- One step closer to 600-line AGPGenerator ✅

**You're doing great! Keep going! 🚀**

---

**End of Session 2 Handoff**

**Status**: 📋 READY TO EXECUTE  
**Next**: Session 3 (useImportExport - the final hook!)  
**Estimated time**: 90-120 minutes (it's a big one!)  

**Remember**: Small commits, frequent tests, read errors carefully!

**Good luck! 💪**
