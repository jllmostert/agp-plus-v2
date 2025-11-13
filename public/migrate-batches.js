/**
 * Migrate Batch Data: OLD → NEW System
 * Moves batches from sensorStorage to stockStorage
 * 
 * OLD: agp-sensor-storage → storage.batches
 * NEW: agp-stock-batches (separate key)
 */

const SENSOR_STORAGE_KEY = 'agp-sensor-storage';
const BATCHES_KEY = 'agp-stock-batches';
const ASSIGNMENTS_KEY = 'agp-stock-assignments';

console.log('=== BATCH MIGRATION: OLD → NEW ===\n');

// Step 1: Load old system data
console.log('Step 1: Loading OLD system data...');
const oldDataRaw = localStorage.getItem(SENSOR_STORAGE_KEY);
const oldData = oldDataRaw ? JSON.parse(oldDataRaw) : { sensors: [], batches: [] };

console.log(`  Sensors: ${oldData.sensors?.length || 0}`);
console.log(`  Batches: ${oldData.batches?.length || 0}`);

// Step 2: Load new system data
console.log('\nStep 2: Loading NEW system data...');
const newBatchesRaw = localStorage.getItem(BATCHES_KEY);
const newBatches = newBatchesRaw ? JSON.parse(newBatchesRaw) : [];
console.log(`  Existing batches in NEW system: ${newBatches.length}`);

// Step 3: Migrate batches
console.log('\nStep 3: Migrating batches...');
let migrated = 0;
let skipped = 0;

if (oldData.batches && oldData.batches.length > 0) {
  for (const oldBatch of oldData.batches) {
    // Check if batch already exists in new system (by lot_number)
    const exists = newBatches.find(b => b.lot_number === oldBatch.lot_number);
    
    if (exists) {
      console.log(`  ⏭️  SKIP: ${oldBatch.lot_number} (already in NEW system)`);
      skipped++;
      continue;
    }
    
    // Migrate batch to new format
    const newBatch = {
      batch_id: oldBatch.batch_id || `BATCH-${Date.now()}-${migrated}`,
      lot_number: oldBatch.lot_number,
      total_quantity: oldBatch.quantity || 0,
      received_date: oldBatch.received_date,
      expiry_date: oldBatch.expiry_date,
      source: oldBatch.source || 'migrated',
      assigned_count: 0, // Will be calculated from sensors
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      notes: 'Migrated from old batch system'
    };
    
    newBatches.push(newBatch);
    console.log(`  ✅ MIGRATED: ${oldBatch.lot_number} → ${newBatch.batch_id}`);
    migrated++;
  }
  
  // Save new batches
  localStorage.setItem(BATCHES_KEY, JSON.stringify(newBatches));
  console.log(`\n  💾 Saved ${newBatches.length} batches to NEW system`);
} else {
  console.log('  ℹ️  No batches to migrate');
}

// Step 4: Create assignments from sensor.batch_id
console.log('\nStep 4: Creating assignments from sensors...');
const assignmentsRaw = localStorage.getItem(ASSIGNMENTS_KEY);
const assignments = assignmentsRaw ? JSON.parse(assignmentsRaw) : [];
let assignmentsCreated = 0;

if (oldData.sensors && oldData.sensors.length > 0) {
  for (const sensor of oldData.sensors) {
    if (sensor.batch_id) {
      // Check if assignment already exists
      const exists = assignments.find(a => a.sensor_id === sensor.id);
      
      if (!exists) {
        const assignment = {
          assignment_id: `ASSIGN-${Date.now()}-${assignmentsCreated}`,
          sensor_id: sensor.id,
          batch_id: sensor.batch_id,
          assigned_at: sensor.updated_at || new Date().toISOString(),
          assigned_by: 'migration'
        };
        
        assignments.push(assignment);
        assignmentsCreated++;
      }
    }
  }
  
  if (assignmentsCreated > 0) {
    localStorage.setItem(ASSIGNMENTS_KEY, JSON.stringify(assignments));
    console.log(`  ✅ Created ${assignmentsCreated} assignments`);
  } else {
    console.log('  ℹ️  No new assignments needed');
  }
}

// Step 5: Update assigned_count in batches
console.log('\nStep 5: Updating assigned_count...');
for (const batch of newBatches) {
  const count = assignments.filter(a => a.batch_id === batch.batch_id).length;
  batch.assigned_count = count;
}
localStorage.setItem(BATCHES_KEY, JSON.stringify(newBatches));
console.log('  ✅ Updated assigned counts');

// Step 6: Summary
console.log('\n=== MIGRATION SUMMARY ===');
console.log(`Batches migrated: ${migrated}`);
console.log(`Batches skipped: ${skipped}`);
console.log(`Assignments created: ${assignmentsCreated}`);
console.log(`Total batches in NEW system: ${newBatches.length}`);
console.log(`Total assignments: ${assignments.length}`);

console.log('\n✅ MIGRATION COMPLETE!');
console.log('\nNext steps:');
console.log('  1. Update SensorHistoryPanel to use stockStorage');
console.log('  2. Remove batch functions from sensorStorage');
console.log('  3. Test UI');
