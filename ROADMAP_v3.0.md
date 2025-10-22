# AGP+ v3.0 ROADMAP - Incremental Master Dataset

**Target:** v3.0.0  
**Status:** Design Phase  
**Priority:** High  
**Effort:** 2-3 hours (breaking changes)

---

## 🎯 GOAL

Transform from **upload-based** to **date-based** data management.

**User wants:**
1. Upload 3+ years CSV + ProTime (bulk or incremental)
2. Auto-lock old data (previous months = read-only)
3. Add new data incrementally (current month = unlocked)
4. See everything merged by date automatically
5. ProTime applies only to correct dates

---

## 🏗️ SOLUTION

### 1. Global ProTime (Date-Based)

**CURRENT:** ProTime linked to upload  
**FUTURE:** Global Map<date, isWorkday>

```javascript
GlobalProTime.workdays.set("2023-01-15", true);
GlobalProTime.get("2023-01-15"); // → true
```

### 2. Auto-Merge Display

**CURRENT:** Show one upload at a time  
**FUTURE:** Merge ALL uploads by timestamp

```javascript
allReadings = [
  ...upload1.readings,  // Jan-Mar 2023
  ...upload2.readings,  // Apr-Jun 2023  
  ...upload10.readings  // Oct 2025
].sort(by timestamp);
```

### 3. Smart Upload Logic

**Rules:**
- Previous months → AUTO-LOCK (read-only)
- Current month → UNLOCKED (can extend)
- New CSV → Replace/extend unlocked, or create new locked

**Example:**
```
Nov 1-15 uploaded → Creates unlocked upload
Nov 16-30 uploaded → Extends to Nov 1-30 (still unlocked)
Dec 1-7 uploaded → Locks Nov, creates Dec unlocked
```

---

## 📐 IMPLEMENTATION PHASES

### Phase 1: Global ProTime (45 min)
- Create `globalProTime.js`
- Update IndexedDB schema
- Update ProTime parser
- Update metrics engine

### Phase 2: Auto-Merge Display (1 hour)
- Create `useMergedData()` hook
- Update AGPGenerator
- Test merged view

### Phase 3: Smart Upload Logic (45 min)
- Overlap detection
- Extension logic
- Auto-lock previous months
- Update upload handler

### Phase 4: UI Polish (30 min)
- Merged data indicator
- Upload history panel
- ProTime status
- Smart feedback

---

## 🚧 SAFETY

**Feature branch:** `feature/v3-incremental-master`  
**Main branch:** Stays on v2.1.1 (stable)  
**Migration:** Auto-migrate v2.1.1 → v3.0  
**Rollback:** Easy (just switch branches)

---

## ✅ SUCCESS CRITERIA

- [ ] Upload 3+ years of data works
- [ ] All data merged automatically by date
- [ ] ProTime applies to correct dates only
- [ ] Old data auto-locked
- [ ] Current month unlocked
- [ ] Incremental updates seamless
- [ ] UI shows merged status clearly

---

## 🚀 NEXT STEPS

**For now:** v2.1.1 is ready to use  
**For later:** Create feature branch when ready to implement

---

**See full roadmap:** [View complete implementation details in outputs]
