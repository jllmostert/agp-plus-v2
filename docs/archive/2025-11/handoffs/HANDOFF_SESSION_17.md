# HANDOFF - SESSION 17: MULTI-FILE PROGRESS & CLEANUP ALL-IN

**Date**: 2025-11-08  
**Session Goal**: Phase D + E - Multi-file import improvements and cleanup ALL-IN feature  
**Estimated Time**: 3 hours  
**Status**: 🟡 READY TO START

---

## 📋 CONTEXT FROM SESSION 16

### Session 16 Complete ✅
**What was done**:
- ✅ Fixed Vite import path errors (DebugPanel.jsx)
- ✅ Verified all 5 panels complete and functional
- ✅ ImportPanel: Multi-file CSV/PDF + JSON import button
- ✅ ExportPanel: AGP+, Day Profiles, Database export
- ✅ SensorHistoryPanel: Full sensor history + stock management
- ✅ DayProfilesPanel: Day profiles view wrapper
- ✅ DevToolsPanel: 2-tab system (Sensor Debug, SQLite Import)
- ✅ All panels wired up in AGPGenerator
- ✅ Git commit: 0a2405f

### Current State
- All panels implemented and rendering correctly
- Multi-file CSV import exists but NO progress feedback
- Multi-file PDF import exists but NO progress feedback
- No cleanup ALL-IN feature yet
- Server running on port 3004
- Branch: develop

---

## 🎯 SESSION 17 GOALS

Build two feature enhancements:

### Phase D: Multi-File Import Progress (1.5 hours)
**Problem**: User uploads 5 CSVs, sees nothing until all complete  
**Solution**: Show real-time progress with file X of Y

**Features**:
1. Progress state in ImportPanel
2. Visual progress bar with percentage
3. File-by-file feedback ("Processing file 2 of 5...")
4. Success summary at end
5. Error handling with partial completion

### Phase E: Cleanup ALL-IN (1.5 hours)
**Problem**: Users want to reset ALL data (nuclear option)  
**Solution**: Add ALL-IN option to cleanup modal with safeguards

**Features**:
1. Add "ALL-IN" option to cleanup modal
2. Dry-run preview showing what will be deleted
3. Mandatory backup before cleanup
4. Confirmation modal with scary warnings
5. Execute cleanup (glucose + cartridges + sensors + stock)
6. Preserve ONLY patient info and ProTime data

---

## 🚀 IMPLEMENTATION PROMPT FOR CLAUDE

**Role**: You are a senior React developer working on AGP+. Session 16 completed all panels. Now add progress feedback and cleanup ALL-IN feature.

**Task**: Implement multi-file import progress tracking and cleanup ALL-IN option. Work in small chunks with frequent check-ins.

**Critical Requirements**:
1. **Work in chunks**: Build one feature at a time
2. **Update PROGRESS.md**: After each phase
3. **Test after each phase**: Ensure functionality works
4. **Git commit**: After each phase
5. **User check-in**: Verify before proceeding

---

## PHASE D: MULTI-FILE IMPORT PROGRESS (1.5 HOURS)

### D1: Add Progress State to ImportPanel (15 min)

**Task**: Add state management for multi-file progress

**In ImportPanel.jsx**:
```jsx
function ImportPanel({
  // ... existing props
}) {
  const [uploadProgress, setUploadProgress] = useState({
    isUploading: false,
    currentFile: 0,
    totalFiles: 0,
    fileName: '',
    percentage: 0
  });

  // ... rest of component
}
```

**Check-in**: Show state added, no errors

---

### D2: Update CSV Upload Handler (20 min)

**Task**: Modify CSV upload to report progress

**In ImportPanel.jsx CSV handler**:
```jsx
onChange={async (e) => {
  const files = Array.from(e.target.files || []);
  
  if (files.length === 0) return;
  
  // Start progress
  setUploadProgress({
    isUploading: true,
    currentFile: 0,
    totalFiles: files.length,
    fileName: '',
    percentage: 0
  });
  
  // Process files sequentially
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    
    // Update progress
    setUploadProgress(prev => ({
      ...prev,
      currentFile: i + 1,
      fileName: file.name,
      percentage: Math.round(((i + 1) / files.length) * 100)
    }));
    
    if (file.name.endsWith('.csv')) {
      console.log(`[ImportPanel] Processing CSV ${i + 1}/${files.length}:`, file.name);
      const text = await file.text();
      await onCSVLoad(text);
    }
  }
  
  // Complete
  setUploadProgress({
    isUploading: false,
    currentFile: files.length,
    totalFiles: files.length,
    fileName: '',
    percentage: 100
  });
  
  // Show completion message
  if (files.length > 1) {
    alert(`✅ Import Complete\n\n${files.length} CSV files processed`);
  }
  
  e.target.value = '';
}}
```

**Check-in**: Test with 3 CSV files, verify progress updates

---

### D3: Build Progress UI (25 min)

**Task**: Add visual progress indicator

**In ImportPanel.jsx** (add below buttons, above error display):
```jsx
{/* Progress Indicator */}
{uploadProgress.isUploading && (
  <div style={{
    marginTop: '1rem',
    padding: '1.5rem',
    border: '3px solid var(--border-primary)',
    background: 'var(--bg-secondary)'
  }}>
    <div style={{
      fontFamily: 'Courier New, monospace',
      fontSize: '0.875rem',
      fontWeight: 'bold',
      textTransform: 'uppercase',
      letterSpacing: '0.1em',
      marginBottom: '0.75rem'
    }}>
      📤 Uploading Files ({uploadProgress.currentFile} of {uploadProgress.totalFiles})
    </div>
    
    {/* Progress Bar */}
    <div style={{
      width: '100%',
      height: '24px',
      background: 'var(--bg-primary)',
      border: '2px solid var(--border-primary)',
      overflow: 'hidden',
      marginBottom: '0.75rem'
    }}>
      <div style={{
        height: '100%',
        background: 'var(--color-green)',
        width: `${uploadProgress.percentage}%`,
        transition: 'width 0.3s ease'
      }} />
    </div>
    
    {/* Current File */}
    <div style={{
      fontFamily: 'Courier New, monospace',
      fontSize: '0.75rem',
      color: 'var(--text-secondary)'
    }}>
      Processing: {uploadProgress.fileName}
    </div>
  </div>
)}
```

**Check-in**: Show UI, test with multiple files

---

### D4: Add Same Progress to PDF Upload (15 min)

**Task**: Apply same progress pattern to ProTime PDF upload

**Copy the same progress logic** to the ProTime PDF onChange handler.

**Check-in**: Test with multiple PDFs

---

### D5: Test Phase D (15 min)

**Test Scenarios**:
1. Upload 1 CSV → No progress shown (instant)
2. Upload 3 CSVs → Progress bar appears, updates, disappears
3. Upload 5 PDFs → Progress bar appears, updates, disappears
4. Upload CSV + error in file 3 → Partial progress + error message
5. Cancel upload → Progress resets cleanly

**Check-in**: Report test results

---

### D6: Commit Phase D (10 min)

```bash
git add src/components/panels/ImportPanel.jsx
git add PROGRESS.md
git commit -m "[feat] Phase D: Multi-file import progress tracking

Features:
- Added progress state to ImportPanel (current/total/percentage)
- Progress bar with percentage indicator
- Real-time file-by-file feedback
- Works for both CSV and PDF multi-file uploads
- Brutalist styling maintained

Testing:
- Tested with 1-5 CSV files
- Tested with 1-3 PDF files
- Progress updates correctly
- Completion message shows

Phase D Complete: Multi-file progress tracking ✅
"
```

**Check-in**: Show commit, verify PROGRESS.md updated

---

## PHASE E: CLEANUP ALL-IN (1.5 HOURS)

### E1: Understand Current Cleanup Modal (10 min)

**Task**: Read DataCleanupModal.jsx to understand current structure

**Files to check**:
- `src/components/DataCleanupModal.jsx`
- Look for cleanup options (14 days, 30 days, custom)

**Check-in**: Explain current cleanup behavior

---

### E2: Add ALL-IN Option to Modal (20 min)

**Task**: Add new cleanup option alongside existing ones

**In DataCleanupModal.jsx**, add ALL-IN option:
```jsx
<button
  onClick={() => onCleanupConfirm({ type: 'all-in' })}
  style={{
    background: 'var(--color-red)',
    border: '3px solid var(--border-primary)',
    color: '#fff',
    padding: '1rem',
    fontFamily: 'Courier New, monospace',
    fontSize: '0.875rem',
    fontWeight: 'bold',
    textTransform: 'uppercase',
    cursor: 'pointer'
  }}
>
  âš ï¸ ALL-IN (Nuclear Reset)
</button>
```

**Add warning text**:
```jsx
<div style={{
  padding: '1rem',
  background: '#fee',
  border: '2px solid var(--color-red)',
  marginTop: '1rem',
  fontFamily: 'Courier New, monospace',
  fontSize: '0.75rem'
}}>
  âš ï¸ <strong>WARNING</strong>: ALL-IN deletes:
  • All glucose readings
  • All cartridge changes
  • All sensor history
  • All stock batches
  <br/><br/>
  ✅ Preserves: Patient info, ProTime workdays
  <br/><br/>
  📦 Automatic backup will be created before cleanup
</div>
```

**Check-in**: Show UI, test button renders

---

### E3: Add Backup Before Cleanup (25 min)

**Task**: Automatically create backup before ALL-IN cleanup

**In AGPGenerator.jsx**, modify cleanup handler:
```javascript
const handleCleanupConfirm = async (options) => {
  try {
    // For ALL-IN, create backup first
    if (options.type === 'all-in') {
      console.log('[Cleanup] Creating backup before ALL-IN...');
      
      const { exportAndDownload } = await import('./storage/masterDatasetStorage');
      const backupResult = await exportAndDownload();
      
      if (!backupResult.success) {
        alert(`❌ Backup failed: ${backupResult.error}\n\nCleanup cancelled for safety.`);
        return;
      }
      
      console.log('[Cleanup] Backup created:', backupResult.filename);
      
      // Show confirmation with backup info
      const confirmed = confirm(
        `⚠️ ALL-IN CLEANUP\n\n` +
        `This will delete:\n` +
        `• All glucose readings\n` +
        `• All cartridge changes\n` +
        `• All sensor history\n` +
        `• All stock batches\n\n` +
        `✅ Backup created: ${backupResult.filename}\n\n` +
        `🔒 Preserves: Patient info, ProTime\n\n` +
        `Are you ABSOLUTELY SURE?`
      );
      
      if (!confirmed) {
        console.log('[Cleanup] User cancelled ALL-IN');
        return;
      }
    }
    
    // Execute cleanup
    const { cleanupRecords } = await import('./storage/masterDatasetStorage');
    const result = await cleanupRecords(options);
    
    if (result.success) {
      alert(`✅ Cleanup Complete\n\n${result.deletedCount} records removed`);
      masterDataset.refresh();
    } else {
      alert(`❌ Cleanup failed: ${result.error}`);
    }
    
  } catch (err) {
    console.error('[Cleanup] Error:', err);
    alert(`❌ Cleanup failed: ${err.message}`);
  } finally {
    setCleanupModalOpen(false);
  }
};
```

**Check-in**: Test backup creation works

---

### E4: Implement ALL-IN Cleanup Logic (30 min)

**Task**: Add ALL-IN cleanup to masterDatasetStorage.js

**In `src/storage/masterDatasetStorage.js`**:
```javascript
export async function cleanupRecords(options) {
  try {
    const db = await getDB();
    
    if (options.type === 'all-in') {
      // Delete everything except patient + protime
      const tx = db.transaction(['readings', 'cartridges', 'sensors', 'stock'], 'readwrite');
      
      await Promise.all([
        tx.objectStore('readings').clear(),
        tx.objectStore('cartridges').clear(),
        tx.objectStore('sensors').clear(),
        tx.objectStore('stock').clear()
      ]);
      
      await tx.done;
      
      // Clear localStorage sensors too
      localStorage.removeItem('agp-sensors');
      localStorage.removeItem('agp-stock-batches');
      
      return {
        success: true,
        deletedCount: 'ALL',
        message: 'All records deleted (kept patient + ProTime)'
      };
    }
    
    // ... existing cleanup logic for date-based cleanup
    
  } catch (err) {
    console.error('[Cleanup] Error:', err);
    return {
      success: false,
      error: err.message
    };
  }
}
```

**Check-in**: Test ALL-IN cleanup works

---

### E5: Test Phase E (20 min)

**Test Scenarios**:
1. Open cleanup modal → ALL-IN button visible
2. Click ALL-IN → Backup created automatically
3. Confirm ALL-IN → All data deleted
4. Check patient info still exists
5. Check ProTime still exists
6. Import backup → Data restored

**Check-in**: Report test results

---

### E6: Commit Phase E (10 min)

```bash
git add src/components/DataCleanupModal.jsx
git add src/components/AGPGenerator.jsx
git add src/storage/masterDatasetStorage.js
git add PROGRESS.md
git commit -m "[feat] Phase E: Cleanup ALL-IN nuclear option

Features:
- Added ALL-IN option to cleanup modal
- Automatic backup before ALL-IN cleanup
- Deletes all glucose, cartridges, sensors, stock
- Preserves patient info and ProTime data
- Scary warning messages and double confirmation
- Backup can be used to restore data

Safety:
- Mandatory backup before cleanup
- Double confirmation required
- Clear warning about what gets deleted
- Preserves essential data (patient + ProTime)

Testing:
- Tested ALL-IN cleanup flow
- Verified backup creation
- Verified data deletion
- Verified patient + ProTime preserved
- Tested restore from backup

Phase E Complete: Cleanup ALL-IN ✅
"
```

**Check-in**: Show commit, verify PROGRESS.md updated

---

## FINAL PHASE E TASKS

### E.Final.1: Update PROGRESS.md (10 min)

**Add to PROGRESS.md**:
```markdown
### Session 17: Multi-File Progress + Cleanup ALL-IN (3h)

**Phase D**: Multi-file import progress
- ✅ Progress state management in ImportPanel
- ✅ Visual progress bar with percentage
- ✅ File-by-file feedback (X of Y)
- ✅ Works for CSV and PDF uploads
- ✅ Success summary at completion

**Phase E**: Cleanup ALL-IN
- ✅ ALL-IN option in cleanup modal
- ✅ Automatic backup before cleanup
- ✅ Deletes all glucose, cartridges, sensors, stock
- ✅ Preserves patient info and ProTime
- ✅ Double confirmation with warnings
- ✅ Backup can restore data

**Testing**:
- ✅ Multi-file CSV upload (1-5 files)
- ✅ Multi-file PDF upload (1-3 files)
- ✅ Progress bar updates correctly
- ✅ ALL-IN cleanup flow complete
- ✅ Backup creation works
- ✅ Data deletion verified
- ✅ Patient + ProTime preserved
- ✅ Backup restore works

**Commits**: 2 commits (Phase D, Phase E)
**Session 17 Complete**: All features implemented ✅
```

**Check-in**: Show PROGRESS.md update

---

### E.Final.2: Final Integration Test (15 min)

**Complete Workflow Test**:
1. Upload 3 CSV files → See progress bar → Success
2. Upload 2 PDFs → See progress bar → Success
3. View data in panels → All data present
4. Open cleanup modal → See ALL-IN option
5. Click ALL-IN → Backup created → Warning shown
6. Confirm ALL-IN → Data deleted → Patient info still there
7. Check ProTime → Still present
8. Import backup → Data restored

**Check-in**: Report complete test results

---

## ✅ SESSION 17 ACCEPTANCE CRITERIA

### Phase D Must Have
- [ ] Progress state in ImportPanel
- [ ] Visual progress bar with percentage
- [ ] File-by-file feedback (X of Y)
- [ ] Works for CSV uploads
- [ ] Works for PDF uploads
- [ ] Success message after completion

### Phase E Must Have
- [ ] ALL-IN option in cleanup modal
- [ ] Warning text about what gets deleted
- [ ] Automatic backup before cleanup
- [ ] Double confirmation dialog
- [ ] Deletes glucose + cartridges + sensors + stock
- [ ] Preserves patient info + ProTime
- [ ] Backup can be used to restore

### Quality Requirements
- [ ] No console errors
- [ ] Brutalist styling maintained
- [ ] All tests pass
- [ ] PROGRESS.md updated
- [ ] 2 git commits (Phase D, Phase E)

---

## 🧪 TESTING PROTOCOL

**After Phase D**:
1. Test 1-file upload (no progress)
2. Test 3-file upload (progress shown)
3. Test 5-file upload (progress updates)
4. Verify percentage calculations
5. Check completion message

**After Phase E**:
1. Test ALL-IN backup creation
2. Verify warning messages
3. Test cleanup execution
4. Verify data deletion
5. Verify patient + ProTime preserved
6. Test backup restore

---

## 🚨 IF SOMETHING BREAKS

1. **STOP immediately**
2. **Check console** for error messages
3. **Report to user** with details
4. **Git status** to see changes
5. **Rollback if needed**: `git checkout -- <file>`
6. **Ask for guidance**

---

## 🎯 END OF SESSION 17

**Deliverables**:
- Multi-file import with progress tracking
- Cleanup ALL-IN with mandatory backup
- 2 git commits (Phase D, Phase E)
- Updated PROGRESS.md
- Comprehensive testing

**Next Session**: Session 18 - Phase F (Polish + Final Testing)

**Handoff to Session 18**: `HANDOFF_SESSION_18.md` (already exists)
