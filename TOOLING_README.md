# AGP+ Tooling

## A. Upload Storage System

### Concept
Store multiple CSV uploads in browser LocalStorage with lock/unlock mechanism.

### Features
- ✅ **Persist uploads**: Keep data between sessions
- ✅ **Lock mechanism**: Locked = read-only, prevents accidental delete
- ✅ **Multiple uploads**: Switch between datasets
- ✅ **Auto-naming**: "Oktober 2025" from date range
- ✅ **Storage limit**: ~5-10MB (browser dependent)

### Usage

```javascript
import { uploadStorage } from './utils/uploadStorage';

// Save new upload (auto-locked)
const id = uploadStorage.save({
  csvData: parsedData,
  dateRange: {min: Date, max: Date},
  proTimeData: Set(['2025/10/01', ...]),
  name: 'Oktober 2025'  // optional, auto-generated if omitted
});

// Get all uploads
const uploads = uploadStorage.getAll();
// Returns: [{id, timestamp, name, locked, csvData, dateRange, proTimeData}, ...]

// Load specific upload
const upload = uploadStorage.get(id);

// Switch active upload
uploadStorage.setActive(id);
const activeId = uploadStorage.getActiveId();

// Lock/unlock
uploadStorage.lock(id);    // 🔒 Make read-only
uploadStorage.unlock(id);  // 🔓 Allow delete

// Delete (only if unlocked)
uploadStorage.delete(id);  // Throws error if locked

// Rename (only if unlocked)
uploadStorage.rename(id, 'New Name');

// Storage info
const info = uploadStorage.getStorageInfo();
// Returns: {used, total, percentage, usedMB, totalMB}
```

### UI Integration Example

```javascript
// In AGPGenerator.jsx

const [savedUploads, setSavedUploads] = useState([]);
const [activeUploadId, setActiveUploadId] = useState(null);

// Load saved uploads on mount
useEffect(() => {
  const uploads = uploadStorage.getAll();
  setSavedUploads(uploads);
  setActiveUploadId(uploadStorage.getActiveId());
}, []);

// Save current upload
const handleSaveUpload = () => {
  const id = uploadStorage.save({
    csvData,
    dateRange,
    proTimeData: workdays
  });
  
  // Refresh list
  setSavedUploads(uploadStorage.getAll());
  setActiveUploadId(id);
};

// Load saved upload
const handleLoadUpload = (id) => {
  const upload = uploadStorage.get(id);
  loadCSV(upload.csvData);  // Your existing function
  setWorkdays(upload.proTimeData);
  setActiveUploadId(id);
};

// Toggle lock
const handleToggleLock = (id) => {
  const upload = savedUploads.find(u => u.id === id);
  if (upload.locked) {
    uploadStorage.unlock(id);
  } else {
    uploadStorage.lock(id);
  }
  setSavedUploads(uploadStorage.getAll());
};

// Delete (if unlocked)
const handleDeleteUpload = (id) => {
  try {
    uploadStorage.delete(id);
    setSavedUploads(uploadStorage.getAll());
    if (activeUploadId === id) {
      setActiveUploadId(null);
    }
  } catch (err) {
    alert(err.message);  // "Cannot delete locked upload"
  }
};
```

### UI Component Suggestion

```jsx
<div className="saved-uploads">
  <h3>SAVED UPLOADS</h3>
  
  {savedUploads.map(upload => (
    <div key={upload.id} className="upload-item">
      <button onClick={() => handleLoadUpload(upload.id)}>
        {upload.locked ? '🔒' : '🔓'} {upload.name}
      </button>
      
      <span className="upload-date">
        {new Date(upload.timestamp).toLocaleDateString('nl-NL')}
      </span>
      
      <button onClick={() => handleToggleLock(upload.id)}>
        {upload.locked ? 'Unlock' : 'Lock'}
      </button>
      
      {!upload.locked && (
        <button onClick={() => handleDeleteUpload(upload.id)}>
          Delete
        </button>
      )}
    </div>
  ))}
  
  <div className="storage-info">
    {storageInfo.usedMB} / {storageInfo.totalMB} MB ({storageInfo.percentage}%)
  </div>
</div>
```

### Limitations
- **~5-10MB limit**: Browser dependent (Chrome ~10MB, Firefox ~5MB)
- **No sync**: Data stays local to this browser
- **Clear on cache clear**: If user clears browser data, uploads are lost
- **Max 20 uploads**: Automatic cleanup removes oldest unlocked

### Alternatives Considered

**IndexedDB** (more storage, more complex):
```javascript
// Pro: 100MB+ storage
// Con: Async API, more complex, overkill for n=1
```

**Export/Import JSON** (manual backup):
```javascript
// Pro: User controls backups
// Con: Not automatic, extra steps
```

---

## B. Code Bundler Script

### Usage

```bash
cd ~/Documents/Projects/agp-plus
./bundle-code.sh
```

### Output
Creates `agp-plus-complete-code.txt` with all source code in one file.

### What's Included
- ✅ Core modules (metrics-engine, parsers, html-exporter)
- ✅ Custom hooks (useCSVData, useMetrics, useComparison)
- ✅ All components (AGPGenerator, FileUpload, etc.)
- ✅ Utilities (pdfParser, uploadStorage)
- ✅ Styles (globals.css)
- ✅ Config (package.json, vite.config.js)

### File Structure
```
════════════════════════════════════════════════════════
AGP+ v2.1 - Complete Source Code Bundle
Generated: 2025-10-22 16:45:00
════════════════════════════════════════════════════════

┌────────────────────────────────────────────────────────┐
│ FILE: src/core/metrics-engine.js
└────────────────────────────────────────────────────────┘

[file contents]

┌────────────────────────────────────────────────────────┐
│ FILE: src/components/AGPGenerator.jsx
└────────────────────────────────────────────────────────┘

[file contents]

...

════════════════════════════════════════════════════════
End of Bundle - 12,543 lines total
════════════════════════════════════════════════════════
```

### Use Cases
- 📤 Share with external reviewers
- 💾 Code backup / archive
- 📝 Documentation / analysis
- 🔍 External code review tools

---

## Next Steps

### For Upload Storage (A):
1. Test the storage module in isolation
2. Integrate into AGPGenerator component
3. Design UI for saved uploads list
4. Add storage usage indicator
5. Test with real data

### For Code Bundler (B):
- Ready to use! Just run `./bundle-code.sh`
- Share the .txt file however you want

---

## Questions?

Storage approach seems good for n=1? Of wil je iets anders (IndexedDB, cloud sync)?
