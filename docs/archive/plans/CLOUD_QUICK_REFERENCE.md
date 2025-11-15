# AGP+ Database & Cloud Storage - Quick Reference

**Datum**: 15 november 2025  
**Voor**: Jo Mostert  
**Status**: Decision Support Document

---

## 🎯 TL;DR

**Huidige situatie**: AGP+ gebruikt browser-only storage (IndexedDB + localStorage). Werkt perfect, $0 cost, maximum privacy.

**Cloud vraag**: Wil je data syncen tussen devices (laptop, iPad, telefoon)?

**Antwoord**:
- **NEE** → Blijf bij huidige setup (niks doen) ✅
- **JA** → Overweeg Firebase (gratis, makkelijk, 2-3 weken werk)

---

## 📦 Wat je nu hebt

### Storage Stack (v4.2.2)

```
IndexedDB (primair)          localStorage (metadata)
├─ Glucose readings         ├─ Recent sensors (<30d)
├─ Sensor events            ├─ Stock batches
├─ Cartridge events         ├─ Sensor assignments
├─ Patient info             └─ Deleted sensors list
├─ ProTime workdays
└─ TDD data

Typische grootte: 50-200 MB (3-6 maanden data)
```

### Belangrijkste files

| File | Doel |
|------|------|
| `src/storage/db.js` | IndexedDB schema definitie |
| `src/storage/masterDatasetStorage.js` | Glucose data opslag (month-bucketing) |
| `src/storage/sensorStorage.js` | Sensor historie management |
| `src/storage/stockStorage.js` | Stock batch management |
| `src/storage/export.js` | JSON export functionaliteit |
| `src/storage/import.js` | JSON import functionaliteit |

---

## ☁️ Cloud Opties Samenvatting

### Option 1: Firebase (Google) ⭐ RECOMMENDED

**Best voor**: Multi-device sync, gemakkelijke setup, gratis tier

| Aspect | Details |
|--------|---------|
| **Cost** | $0/maand (gratis tier, 1 GB storage) |
| **Setup tijd** | 2-3 weken |
| **Moeilijkheid** | 🟢 Makkelijk |
| **Offline support** | ✅ Ja (built-in) |
| **Privacy** | ⚠️ Google servers (encryptie mogelijk) |

**Pros**: Real-time sync, beste developer experience, uitgebreid gedocumenteerd
**Cons**: Vendor lock-in, wordt duur bij schaal (>100 gebruikers)

---

### Option 2: Supabase (PostgreSQL)

**Best voor**: Als je SQL queries nodig hebt, analytics dashboard

| Aspect | Details |
|--------|---------|
| **Cost** | $0/maand (gratis tier, 500 MB) |
| **Setup tijd** | 3-4 weken |
| **Moeilijkheid** | 🟡 Medium |
| **Offline support** | ⚠️ Beperkt (custom implementatie) |
| **Privacy** | ⚠️ AWS servers (Row Level Security) |

**Pros**: PostgreSQL power, open source, self-host mogelijk
**Cons**: Steeper learning curve, kleinere community

---

### Option 3: PocketBase (Self-Hosted)

**Best voor**: Volledige controle, geen vendor lock-in

| Aspect | Details |
|--------|---------|
| **Cost** | $5-10/maand (VPS hosting) |
| **Setup tijd** | 4-5 weken (inclusief server setup) |
| **Moeilijkheid** | 🔴 Moeilijk |
| **Offline support** | ✅ Ja (built-in) |
| **Privacy** | ✅ Eigen server (volledige controle) |

**Pros**: Zero vendor lock-in, volledige controle, SQLite backend
**Cons**: Must manage server zelf, updates, backups, monitoring

---

### Option 4: Blijf bij IndexedDB (Current)

**Best voor**: Single-device gebruik, maximum privacy, $0 cost

| Aspect | Details |
|--------|---------|
| **Cost** | $0/maand (geen hosting nodig) |
| **Setup tijd** | 0 uur (already done!) |
| **Moeilijkheid** | ✅ None (keep using) |
| **Offline support** | ✅ Always offline (by design) |
| **Privacy** | ✅ Maximum (data never leaves browser) |

**Pros**: Zero complexity, zero cost, maximum privacy
**Cons**: No multi-device sync, manual JSON export voor backup

---

## 🤔 Decision Matrix

### Use Case 1: Alleen ik, één device
→ **STAY WITH CURRENT** (geen cloud nodig)

### Use Case 2: Ik + mijn arts (delen)
→ **Firebase** (met sharing feature) OF **JSON export via email**

### Use Case 3: Laptop + iPad (persoonlijk)
→ **Firebase** (real-time sync, gratis)

### Use Case 4: Toekomst SaaS (meerdere gebruikers)
→ **Supabase** (PostgreSQL, schaalbaarheid)

---

## ⚠️ Top 3 Dingen om te Weten

### 1. Huidige Setup is Excellent
Je month-bucketing strategie (YYYY-MM) is **brilliant**:
```javascript
readingBuckets: {
  "2025-10": { readings: [...], count: 4320 },
  "2025-11": { readings: [...], count: 2160 }
}
```
- Fast range queries
- Efficient deduplication
- Schaalt perfect naar cloud

**Bewaar deze structuur bij cloud migratie!**

---

### 2. Dual Storage Issue
localStorage + IndexedDB voor sensors = complexity

**Probleem**: Sensors in BEIDE storages
- localStorage: recent (<30 dagen)
- IndexedDB: historical (via sensorData store)
- SQLite: legacy (static file)

**Impact**: Sync race conditions, lock inconsistencies

**Fix**: 
- Short term: Implement fixes (7 uur, zie DUAL_STORAGE_ANALYSIS.md)
- Long term: Consolidate naar IndexedDB only
- Cloud: Eliminates problem automatically!

---

### 3. Privacy Trade-off
**Current**: Data blijft 100% lokaal → maximum privacy
**Cloud**: Data op 3rd party servers → potential surveillance

**Mitigatie**:
- End-to-end encryption (advanced)
- GDPR compliance (EU data residency)
- Strong authentication (2FA)
- Row Level Security / Firestore Rules

**Beslissing**: Weeg privacy vs convenience

---

## 💰 Cost Breakdown (5 Years)

| Option | Year 1 | Year 5 | Total |
|--------|--------|--------|-------|
| **Current (no cloud)** | $0 | $0 | $0 |
| **Firebase (free tier)** | $0 | $0 | $0 |
| **Supabase (free tier)** | $0 | $0 | $0 |
| **PocketBase (VPS)** | $60 | $60 | $300 |

**Breakeven**: Firebase/Supabase gratis tot ~100 gebruikers

---

## 🚀 Next Steps

### If NO CLOUD (recommended voor nu):
1. ✅ Close this document
2. ✅ Keep using current setup
3. ✅ Export JSON monthly (backup)
4. ✅ Reconsider when iPad arrives

### If YES CLOUD (Firebase):

**Week 1-2** (Proof of Concept):
- [ ] Create Firebase project
- [ ] Add authentication
- [ ] Upload 1 CSV to cloud
- [ ] Test sync on 2 devices
- [ ] Decide if worth continuing

**Week 3-4** (Parallel Storage):
- [ ] Implement dual-write (IndexedDB + Firebase)
- [ ] Add sync indicator UI
- [ ] Handle offline gracefully

**Week 5-6** (Cloud Primary):
- [ ] Flip priority (Cloud = source of truth)
- [ ] IndexedDB = cache
- [ ] Deploy to production

**Week 7-8** (Migration):
- [ ] Migrate historical data
- [ ] Verify integrity
- [ ] Update docs

---

## 📚 Resources

**Firebase**:
- Setup: https://firebase.google.com/docs/web/setup
- React: https://firebase.google.com/docs/web/react

**Supabase**:
- Quickstart: https://supabase.com/docs/guides/getting-started/quickstarts/reactjs
- Security: https://supabase.com/docs/guides/auth/row-level-security

**Current Architecture**:
- Full analysis: `docs/DATABASE_ARCHITECTURE_CLOUD_ANALYSIS.md`
- Dual storage issues: `docs/DUAL_STORAGE_ANALYSIS.md`

---

## ✅ My Recommendation

**VOOR JO MOSTERT (NOVEMBER 2025)**:

**DON'T MIGRATE TO CLOUD YET**

**Reden**:
1. Huidige setup werkt perfect
2. Geen multi-device need (nog geen iPad)
3. Privacy = goed (data lokaal)
4. Cost = $0
5. Cloud = extra complexity zonder benefit

**Reconsider when**:
- Je krijgt een iPad en wil seamless sync
- Je wil data delen met arts (real-time)
- Je JSON export onhandig vindt
- Je bang bent voor data loss

**Tot dan**: Enjoy simplicity! 🎉

---

**Vragen?** Lees volledige analyse in `DATABASE_ARCHITECTURE_CLOUD_ANALYSIS.md`

