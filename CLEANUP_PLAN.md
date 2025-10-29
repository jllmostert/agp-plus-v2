# AGP+ v3.0 Code Cleanup Plan

**Date:** October 29, 2025  
**Status:** Pre-Production Cleanup

---

## 🎯 OBJECTIVES

1. Remove ALL direct console.log/warn/info statements
2. Replace with debug utility where needed
3. Keep console.error for critical errors
4. Clean up duplicate files
5. Remove backup files
6. Ensure language consistency (NL or EN, not both)
7. Improve code comments

---

## 📋 PHASE 1: FILE CLEANUP

### Duplicate Files to Remove
- [ ] `src/utils/debug 2.js` (use debug.js)
- [ ] `src/utils/constants 2.js` (use constants.js)
- [ ] `src/utils/eventClustering 2.js` (use eventClustering.js)
- [ ] `src/utils/formatters 2.js` (use formatters.js)
- [ ] `src/core/insulin-engine 2.js` (use insulin-engine.js)
- [ ] `src/core/sensorEventClustering 2.js` (use sensorEventClustering.js)
- [ ] `src/components/DebugPanel 2.jsx` (use DebugPanel.jsx)

### Backup Files to Remove
- [ ] `src/core/day-profile-engine.js.backup`
- [ ] `src/core/day-profile-engine.js.backup2`
- [ ] `src/core/day-profile-engine.js 2.backup2`
- [ ] `src/core/day-profile-engine_CHUNK1.js`

---

## 📋 PHASE 2: CONSOLE STATEMENT AUDIT

### Search Pattern
```regex
console\.(log|warn|info)
```

### Files with Console Statements (Found)
Based on initial search:
1. `src/storage/masterDatasetStorage.js` - 2 console.warn
2. `src/core/parsers.js` - 1 console.info
3. All debug utility files (intentional, keep)

### Action Plan
- [ ] Scan ALL files systematically
- [ ] Replace console.log → debug.log
- [ ] Replace console.warn → debug.warn
- [ ] Replace console.info → debug.info
- [ ] Keep console.error (or ensure proper error handling)

---

## 📋 PHASE 3: LANGUAGE CONSISTENCY

### Check Areas
- [ ] Comments in JSX components
- [ ] Comments in JS engines
- [ ] Variable names
- [ ] Function names
- [ ] Error messages
- [ ] User-facing strings

### Current Mix Examples
Need to audit for:
- Dutch: `werkdag`, `rustdag`, `invoer`
- English: `workday`, `restday`, `input`

**Decision:** Standardize to ENGLISH (codebase convention)
- Comments: English
- Variables: English
- User-facing: Keep Dutch (for Jo's clinical use)

---

## 📋 PHASE 4: COMMENT QUALITY

### Standards
1. **File-level JSDoc**
   ```javascript
   /**
    * Module Description
    * 
    * @module path/to/module
    * @version 3.0.0
    */
   ```

2. **Function JSDoc**
   ```javascript
   /**
    * Function description
    * 
    * @param {Type} paramName - Description
    * @returns {Type} Description
    */
   ```

3. **Inline Comments**
   - Explain WHY, not WHAT
   - Use for complex logic only
   - Keep concise

### Files Needing Comment Review
- [ ] All engine files in `src/core/`
- [ ] Storage layer in `src/storage/`
- [ ] React hooks in `src/hooks/`
- [ ] Main components

---

## 🔧 CLEANUP SCRIPT

### 1. Find All Console Statements
```bash
cd /Users/jomostert/Documents/Projects/agp-plus
grep -rn "console\.\(log\|warn\|info\)" src/ --include="*.js" --include="*.jsx" | grep -v "debug.js" > console-audit.txt
```

### 2. Remove Duplicate Files
```bash
cd /Users/jomostert/Documents/Projects/agp-plus/src
rm "utils/debug 2.js"
rm "utils/constants 2.js"
rm "utils/eventClustering 2.js"
rm "utils/formatters 2.js"
rm "core/insulin-engine 2.js"
rm "core/sensorEventClustering 2.js"
rm "components/DebugPanel 2.jsx"
```

### 3. Remove Backup Files
```bash
cd /Users/jomostert/Documents/Projects/agp-plus/src/core
rm day-profile-engine.js.backup
rm day-profile-engine.js.backup2
rm "day-profile-engine.js 2.backup2"
rm day-profile-engine_CHUNK1.js
```

---

## ✅ VERIFICATION CHECKLIST

After cleanup:
- [ ] No console.log statements (except in debug.js)
- [ ] No console.warn statements (except in debug.js)
- [ ] No console.info statements (except in debug.js)
- [ ] No duplicate files
- [ ] No backup files
- [ ] All imports using debug utility work
- [ ] Dev server starts without errors
- [ ] App loads and functions correctly
- [ ] No console errors in browser

---

## 📝 EXECUTION ORDER

1. **Create backup branch**
   ```bash
   git checkout -b cleanup-pre-v3-release
   ```

2. **Remove duplicate files** (Phase 1)

3. **Remove backup files** (Phase 1)

4. **Audit and fix console statements** (Phase 2)
   - Run grep search
   - Fix files one by one
   - Test after each major file

5. **Language consistency pass** (Phase 3)

6. **Comment quality pass** (Phase 4)

7. **Final verification**
   - Start dev server
   - Test all features
   - Check browser console (should be clean)

8. **Commit cleanup**
   ```bash
   git add -A
   git commit -m "chore: production cleanup - remove debug logs, duplicates, improve comments"
   ```

---

## 🎯 PRIORITY ORDER

**High Priority (must do before production):**
1. Remove console.log/warn/info statements
2. Remove duplicate files
3. Remove backup files

**Medium Priority (should do before production):**
4. Language consistency in comments
5. Improve critical comments (engines, storage)

**Low Priority (nice to have):**
6. Full JSDoc for all functions
7. Comprehensive inline comments

---

END OF CLEANUP PLAN
