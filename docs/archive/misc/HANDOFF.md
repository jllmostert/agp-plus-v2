# AGP+ SESSION HANDOFF - 2025-11-14 16:00

**From**: Session 28 (Stock Import/Export + IndexedDB Fix)  
**To**: Next Session  
**Version**: v4.2.2  
**Status**: ✅ PRODUCTION READY

---

## 🎯 CURRENT STATE

### Application Status
- **Version**: v4.2.2 (centralized in src/version.js)
- **Server**: Running on http://localhost:3001/
- **Deployment**: agp.jenana.eu (auto-deploys from main branch)
- **Branch**: main (all changes committed and pushed)
- **Database**: IndexedDB v5 (keyPath fix applied)

### Recent Completions (Session 28)

#### 1. Stock Import/Export ✅
- Added EXPORT/IMPORT buttons to StockPanel
- Replace mode (clear existing) vs Merge mode (skip duplicates)
- User prompted via confirm dialog to choose mode
- Files: `StockPanel.jsx`, `stockStorage.js`, `stockImportExport.js`

#### 2. IndexedDB Schema Fix ✅
- **Bug Fixed**: SENSOR_DATA store had no keyPath
- **Impact**: Sensor imports now work properly
- DB_VERSION: 4 → 5 (auto-migration on page load)
- File: `src/storage/db.js`

#### 3. Version Management ✅
- Created `src/version.js` as single source of truth
- Updated package.json, index.html, all storage modules
- Version: 4.2.2 everywhere

### Git Status
```
Latest commits:
- 16b0254: Update version to 4.2.2 across all files
- d936d69: Update PROGRESS.md with SESSION 28
- 81a01b4: Stock import/export + IndexedDB keyPath fix
- 59224d2: Clean up unused date fields

All pushed to origin/main ✅
```

---

## 📂 PROJECT STRUCTURE

### Critical Files
- **src/version.js** - Single source of truth for version (NEW)
- **src/storage/sensorStorage.js** - Async IndexedDB sensor operations
- **src/storage/stockStorage.js** - Stock batch management (localStorage)
- **src/storage/stockImportExport.js** - Stock import/export with replace mode
- **src/storage/db.js** - IndexedDB schema (v5, with SENSOR_DATA keyPath)

### Active Panels
- **SensorHistoryPanel** - Sensor list with import/export
- **StockPanel** - Stock management with import/export (NEW buttons)
- **ImportPanel** - Full database import

---

## 🔧 IMPORTANT COMMANDS

### Always start with:
```bash
cd /Users/jomostert/Documents/Projects/agp-plus
```

### Development Server
```bash
export PATH="/opt/homebrew/bin:$PATH" && npx vite --port 3001
```

### Git Operations
```bash
git status
git add -A
git commit -m "message"
git push origin main
```

### Update Progress
Always update PROGRESS.md with new sessions using this format:
```markdown
## ✅ SESSION XX - Title (YYYY-MM-DD HH:MM-HH:MM)
**Status**: ✅ COMPLETE
**Commits**: commit_hash
### Summary
...
### Features
...
```

---

## 🧪 TESTING CHECKLIST

Before considering work complete, verify:

### Stock Management
- [ ] Export stock → downloads JSON file
- [ ] Import (merge) → skips duplicates, adds new
- [ ] Import (replace) → clears existing, imports fresh
- [ ] Batch stats update after import

### Sensor Import
- [ ] Import JSON sensors → no IndexedDB errors
- [ ] Import SQLite → works properly
- [ ] Duplicate detection works
- [ ] Success alert shows correct counts

### Version Display
- [ ] Browser tab shows "AGP+ v4.2.2"
- [ ] package.json shows 4.2.2
- [ ] Console logs show correct version (if logged)

---

## 🚀 DEPLOYMENT

### Auto-Deployment
- Push to main → GitHub Actions → agp.jenana.eu
- Usually takes 2-3 minutes
- Check Actions tab on GitHub for status

### Manual Check
```bash
# After push, visit:
https://agp.jenana.eu
# Hard refresh: CMD+SHIFT+R (Mac) / CTRL+SHIFT+R (Windows)
```

---

## 📝 KNOWN ISSUES & NEXT STEPS

### Known Issues
None currently! ✅

### Potential Improvements
1. **Export Preview**: Show what will be exported before download
2. **Import Preview**: Show import summary before confirming
3. **Version Display**: Add version number in UI footer
4. **Stock Filters**: Add date range filter for stock batches
5. **Sensor Search**: Add search functionality in sensor history

### Technical Debt
- Some components are large (SensorHistoryPanel ~564 lines)
- Consider refactoring into smaller sub-components
- Add TypeScript for better type safety (long-term)

---

## 💡 DEVELOPMENT TIPS

### Working with Claude
1. **Always mention**: "Desktop Commander /Users/jomostert/Documents/Projects/agp-plus"
2. **Update Progress**: After each significant change
3. **Token Conservation**: Keep responses focused and concise
4. **Test First**: Verify changes work before committing

### File Operations
- Use `Desktop Commander:read_file` to check code
- Use `Desktop Commander:edit_block` for surgical edits
- Use `Desktop Commander:start_process` for git/npm commands

### Common Patterns
```javascript
// Async storage access
const sensors = await getAllSensors();
await addSensor(sensorData);

// Version import
import { VERSION } from '../version.js';

// IndexedDB operations
const storage = await getStorage();
await saveStorage(data);
```

---

## 🔍 DEBUGGING

### IndexedDB Issues
1. Open DevTools (F12)
2. Application tab → IndexedDB → agp-plus-db
3. Check SENSOR_DATA store → should have keyPath: "id"
4. If broken: Delete database, refresh page (auto-recreates)

### Version Mismatch
- Check `src/version.js` - should be 4.2.2
- Check `package.json` - should be 4.2.2
- Check `index.html` - should say v4.2.2
- If mismatch: All should use VERSION from version.js

### Git Issues
```bash
# Check status
git status

# Discard changes
git restore <file>

# Revert commit (if needed)
git revert HEAD
```

---

## 📚 DOCUMENTATION

### Key Documents
- `PROGRESS.md` - Session-by-session progress log
- `CHANGELOG.md` - Version history with features
- `minimed_780g_ref.md` - Device settings reference
- `metric_definitions.md` - Glucose metrics formulas
- `DUAL_STORAGE_ANALYSIS.md` - SQLite/localStorage architecture notes

### Update After Each Session
1. **PROGRESS.md** - Add new session entry at top
2. **CHANGELOG.md** - Update if version changed or major features added
3. **HANDOFF.md** (this file) - Update current state and status

---

## 🎯 SESSION START CHECKLIST

When starting a new session:
1. [ ] Read this handoff document
2. [ ] Check PROGRESS.md for latest status
3. [ ] Verify server is running (or start it)
4. [ ] Run `git status` to see any uncommitted changes
5. [ ] Read any relevant documentation for the task
6. [ ] Always use Desktop Commander path: `/Users/jomostert/Documents/Projects/agp-plus`

---

**Last Updated**: 2025-11-14 16:00  
**Next Session**: Ready to start fresh!  
**Notes**: All features working, ready for production use ✅
