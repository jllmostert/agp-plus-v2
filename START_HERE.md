# START HERE - Phase 5 Lock System Testing

Date: 2025-10-31 04:00 CET
Status: Bug Fixed - Ready for Testing
Latest Commit: 79baa9b
Server: http://localhost:3001

---

## QUICK START

1. Start Server:
   cd /Users/jomostert/Documents/Projects/agp-plus
   export PATH="/opt/homebrew/bin:$PATH"
   npx vite --port 3001

2. Open Chrome: http://localhost:3001

3. Test delete functionality in Sensor History modal

---

## WHAT WAS FIXED

Bug: Delete operations failing with "Sensor niet gevonden"
Root Cause: Using sensor.start_date instead of sensor.sensor_id
Fix: Changed deleteSensorWithLockCheck(sensor.start_date) to deleteSensorWithLockCheck(sensor.sensor_id)
Commit: 79baa9b

---

## TESTING CHECKLIST

Must Test:
- Lock icons display (locked/unlocked for old sensors)
- Delete old sensor (>30 days) shows lock warning
- Force override works for locked sensors
- Delete new sensor (<30 days) works normally
- Lock status shows correct age in days

Expected Behavior:
- Locked sensor: Shows override dialog with age
- Unlocked sensor: Normal delete confirmation
- All error messages display correctly

---

## CODE LOCATIONS

Backend: src/storage/sensorStorage.js
- isSensorLocked() - Line 318
- getSensorLockStatus() - Line 341
- deleteSensorWithLockCheck() - Line 376

Frontend: src/components/SensorHistoryModal.jsx
- Lock icon column - Line 495
- Delete handlers - Line 757

---

## IF ISSUES FOUND

Server restart:
  lsof -ti:3001 | xargs kill -9
  cd /Users/jomostert/Documents/Projects/agp-plus
  export PATH="/opt/homebrew/bin:$PATH"
  npx vite --port 3001

Check:
- Browser console for errors
- sensor_id field exists on sensors
- Hard refresh (Cmd+Shift+R)

---

Ready to test!
