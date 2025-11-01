# INSTRUCTIONS FOR NEXT CHAT

## Quick Start Commands

### 1. Start Server (Terminal):
cd /Users/jomostert/Documents/Projects/agp-plus
./restart-server.sh

### 2. Open Chrome:
- Navigate to: http://localhost:3001
- Or reload existing tab

### 3. Tell Claude:
"Read START_HERE.md and begin Phase 5 testing"

---

## What You Will Test

1. Open Sensor History modal (button in top right)
2. Look for lock icons: 🔒 (old) and 🔓 (new)
3. Try deleting an old sensor (>30 days)
   - Should show lock warning with age
   - Option to force override
4. Try deleting a new sensor (<30 days)
   - Should show normal confirmation
   - Should delete immediately

---

## What to Report

For each test:
- ✅ or ❌ Result
- Exact error messages (if any)
- Screenshots (if helpful)
- Console errors (if any)

---

## If Server Issues

Run in terminal:
lsof -ti:3001 | xargs kill -9
cd /Users/jomostert/Documents/Projects/agp-plus
export PATH="/opt/homebrew/bin:\$PATH"
npx vite --port 3001

---

Latest commit: 8915252
All changes pushed to main
Ready to test!
