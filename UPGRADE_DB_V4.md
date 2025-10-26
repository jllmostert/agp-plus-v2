# DATABASE UPGRADE TO V4 (SENSOR DATA SUPPORT)

## Problem

AGP+ v3.6 adds a new `sensorData` store to IndexedDB (version 3 → 4).
However, if the database is already open in the browser, the upgrade won't trigger automatically.

## Solution: Force Database Upgrade

### Option 1: Manual (DevTools) ⭐ RECOMMENDED

1. Open browser DevTools: **F12** or **Cmd+Option+I**
2. Go to **Application** tab
3. Expand **IndexedDB** in left sidebar
4. Right-click **agp-plus-db** → **Delete database**
5. **Refresh page** (Cmd+R or F5)

The database will be recreated at version 4 with the new `sensorData` store.

### Option 2: Programmatic (Console)

Paste this in the browser console (F12 → Console tab):

```javascript
// Close all connections and delete database
indexedDB.deleteDatabase('agp-plus-db');

// Wait 2 seconds, then refresh
setTimeout(() => location.reload(), 2000);
```

### Option 3: Hard Refresh

Sometimes a hard refresh triggers the upgrade:
- **Mac**: Cmd + Shift + R
- **Windows/Linux**: Ctrl + Shift + R

## Verification

After upgrade, you should see in console:
```
[DB] Upgrading from v3 to v4
[DB] Created sensorData store (v3.6)
```

And the sensor import button should work without errors!

## Why This Happens

IndexedDB versioning requires all connections to close before upgrading.
AGP+ keeps connections open for performance, so manual intervention is needed.

Future: We'll add automatic migration detection in v3.7.
