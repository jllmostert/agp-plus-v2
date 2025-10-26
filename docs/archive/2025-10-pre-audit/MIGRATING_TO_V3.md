# Migrating from AGP+ v2.x to v3.0

**Welcome to AGP+ v3.0!** This guide explains what's new and how migration works.

---

## 🎯 What's New in v3.0

### Incremental Master Dataset

**Before (v2.x):** Upload one CSV, analyze that period only  
**Now (v3.0):** Upload multiple CSVs, see everything merged automatically

**Benefits:**
- 📊 See 3+ years of glucose data in one view
- 🔄 Upload incrementally (add new months as they come)
- 📅 ProTime applies to correct dates (not per-upload)
- 🎯 Filter by any date range
- 💾 Persistent device event tracking

---

## 🔄 Migration Process

### Automatic Migration

When you first launch v3.0, AGP+ will automatically:

1. **Convert your data** (~30 seconds for 1 year of data)
2. **Merge all uploads** into master dataset
3. **Backfill device events** (sensor/cartridge changes)
4. **Show migration summary**

**You don't need to do anything!** Just wait for the migration to complete.

### What Gets Migrated

✅ All glucose readings from v2.x uploads  
✅ Patient information  
✅ ProTime workday settings  
✅ Device events (sensor/cartridge changes)  

❌ Nothing is deleted (v2.x data preserved for safety)

---

## 📊 New Features

### 1. Merged View

All your uploads appear as one continuous timeline:

```
Jan 2023 ──── Apr 2023 ──── Oct 2025
   Upload 1       Upload 2       Upload 10
         └─────────────┬─────────────┘
              Merged automatically
```

### 2. Date Range Filter

Select any date range to analyze:
- Last 7 days
- Last 30 days
- Last 90 days
- Custom range

### 3. Global ProTime

ProTime settings now date-based:
- Mark specific dates as workdays
- Works across all uploads automatically

### 4. Device Event Database

Track all sensor and cartridge changes:
- Persistent across re-uploads
- Review and confirm events
- Add notes for context

---

## 🔙 Can I Go Back to v2.x?

**Yes!** Your v2.x data remains intact.

**If you downgrade:**
- ✅ Individual uploads still work
- ❌ Merged master dataset not visible
- ✅ Can upgrade to v3.0 again anytime

---

## 💾 Data Storage

**v3.0 uses more storage than v2.x:**

| Data Amount | v2.x Size | v3.0 Size |
|-------------|-----------|-----------|
| 1 year | ~2 MB | ~3 MB |
| 3 years | ~6 MB | ~10 MB |

**Why?** v3.0 caches merged data for faster performance.

---

## 🚨 Troubleshooting

### Migration Fails

**Symptoms:** Error message during migration

**Solutions:**
1. Refresh the page and try again
2. Check browser console (F12) for errors
3. Clear site data and re-upload CSVs
4. Report issue on GitHub with console logs

### Slow Performance

**Symptoms:** App sluggish with 3+ years data

**Solutions:**
1. Use date range filter (analyze smaller periods)
2. Close other browser tabs
3. Check available RAM (v3.0 uses ~200 MB for 3 years)

### Missing Data

**Symptoms:** Some readings don't appear

**Solutions:**
1. Check date range filter (is it too narrow?)
2. Verify CSVs uploaded successfully
3. Look in Settings → Uploads for upload history

---

## 📋 System Requirements

**Browser:** Modern browser with IndexedDB support
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

**Storage:** ~10 MB for 3 years of data

**RAM:** 500 MB available recommended

---

## 🆘 Getting Help

**Found a bug?** Report on [GitHub Issues](https://github.com/jllmostert/agp-plus-v2/issues)

**Have questions?** Contact Jo Mostert

**Documentation:** See `docs/` folder in project

---

## 🎉 Enjoy AGP+ v3.0!

Your glucose data analysis just got a major upgrade. Upload your historical data and see the complete picture!

---

**Last Updated:** October 25, 2025  
**AGP+ Version:** 3.0.0
