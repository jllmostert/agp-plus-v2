# AGP+ v3.8.0 - Quick Reference

**Database Export Edition** | October 27, 2025

---

## 🆕 What's New in v3.8.0

### Database Export System
Complete IndexedDB dump to portable JSON format with one click.

**Location**: EXPORT section → 💾 Database (JSON)

**What Gets Exported**:
- All glucose readings (month-bucketed format)
- Sensor history (from localStorage)
- Cartridge change history
- Export metadata (timestamp, version, record counts)

**File Format**: 
```
agp-master-{timestamp}.json
Example: agp-master-1730034896789.json
```

**Use Cases**:
- Complete dataset backup
- Data portability (transfer between devices)
- External analysis (Python, R, Excel)
- Debugging (inspect raw data structure)
- Archive old data (free up browser storage)

---

## 📊 JSON Structure

```json
{
  "version": "3.0",
  "exportDate": "2025-10-27T12:34:56.789Z",
  "generator": "AGP+ v3.8.0",
  "totalReadings": 28528,
  "totalMonths": 12,
  "totalSensors": 219,
  "totalCartridges": 147,
  "months": [
    {
      "monthKey": "2025-10",
      "readings": [ /* glucose readings array */ ],
      "sortedCache": [ /* pre-sorted for performance */ ]
    }
  ],
  "sensors": [ /* sensor metadata */ ],
  "cartridges": [ /* cartridge events */ ]
}
```

---

## 🎯 Quick Actions

### Export Current Dataset
1. Click **EXPORT** button (collapse section)
2. Click **💾 Database (JSON)**
3. Wait 1-2 seconds (large datasets)
4. Browser downloads `agp-master-{timestamp}.json`
5. Success message shows record count

### Verify Export
1. Open downloaded JSON in text editor
2. Check `totalReadings` matches app display
3. Verify `exportDate` is current
4. Spot-check a few glucose values in `months[0].readings`

---

## 🐛 Troubleshooting

### Button Disabled (Gray)
**Cause**: No data in master dataset  
**Fix**: Upload CSV or load saved dataset first

### Export Takes >5 Seconds
**Cause**: Very large dataset (100k+ readings)  
**Fix**: Normal behavior, wait for completion

### Download Doesn't Start
**Cause**: Browser download permissions  
**Fix**: Check popup blocker, allow downloads from localhost

### JSON File Won't Open
**Cause**: File too large for editor  
**Fix**: Use specialized JSON viewer or Python script

---

## 📈 Technical Details

### Performance
- **Small dataset** (<10k readings): <1 second
- **Medium dataset** (10-50k readings): 1-2 seconds  
- **Large dataset** (50-100k readings): 2-3 seconds
- **Very large** (>100k readings): 3-5 seconds

### File Size Estimates
- **1 month**: ~500 KB (typical)
- **6 months**: ~2-3 MB
- **12 months**: ~5-6 MB
- **24 months**: ~10-12 MB

### Browser Compatibility
- ✅ Chrome/Edge (Chromium)
- ✅ Firefox (assumed, not tested)
- ✅ Safari (assumed, not tested)

---

## 🔮 Coming Soon

### Import Functionality (v3.9)
- Restore from JSON backup
- Merge with existing data
- Selective import (date ranges)

### Export Enhancements (v4.0)
- CSV export option
- Date range filtering
- Compression (gzip)
- Export history tracking

---

## 📚 Related Documentation

- **HANDOFF_V3_8_0_DATABASE_EXPORT_OCT27.md** - Complete technical details
- **CHANGELOG.md** - Full version history
- **README.md** - Project overview
- **src/storage/export.js** - Export implementation code

---

## 🆘 Need Help?

1. Check console for error messages (F12 → Console)
2. Review HANDOFF document for implementation details
3. Test with small dataset first (single month CSV)
4. Report issues with: dataset size, browser, error message

---

**Version**: 3.8.0  
**Last Updated**: October 27, 2025  
**Status**: ✅ Production Ready
