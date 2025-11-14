/**
 * Test Stock/Sensor Export/Import
 * Verifies that stock batches and sensor assignments are correctly exported and imported
 */

// Mock localStorage
const mockStorage = {};
global.localStorage = {
  getItem: (key) => mockStorage[key] || null,
  setItem: (key, value) => { mockStorage[key] = value; },
  removeItem: (key) => { delete mockStorage[key]; },
  clear: () => { Object.keys(mockStorage).forEach(key => delete mockStorage[key]); }
};

// Import functions (we'll inline simplified versions)
const BATCHES_KEY = 'agp-stock-batches';
const ASSIGNMENTS_KEY = 'agp-stock-assignments';

function getAllBatches() {
  const data = localStorage.getItem(BATCHES_KEY);
  return data ? JSON.parse(data) : [];
}

function getAllAssignments() {
  const data = localStorage.getItem(ASSIGNMENTS_KEY);
  return data ? JSON.parse(data) : [];
}

function addBatch(batch) {
  const batches = getAllBatches();
  const now = new Date().toISOString();
  
  const newBatch = {
    batch_id: batch.batch_id || `BATCH-${Date.now()}`,
    ...batch,
    assigned_count: batch.assigned_count || 0,
    created_at: batch.created_at || now,
    updated_at: batch.updated_at || now
  };
  
  batches.push(newBatch);
  localStorage.setItem(BATCHES_KEY, JSON.stringify(batches));
  return newBatch;
}

function assignSensorToBatch(sensorId, batchId, assignedBy = 'manual') {
  const assignments = getAllAssignments();
  
  // Remove existing assignment for this sensor
  const filtered = assignments.filter(a => a.sensor_id !== sensorId);
  
  const newAssignment = {
    assignment_id: `ASSIGN-${Date.now()}`,
    sensor_id: sensorId,
    batch_id: batchId,
    assigned_at: new Date().toISOString(),
    assigned_by: assignedBy
  };
  
  filtered.push(newAssignment);
  localStorage.setItem(ASSIGNMENTS_KEY, JSON.stringify(filtered));
  
  return newAssignment;
}

// Simulate export
function exportStockData() {
  return {
    stockBatches: getAllBatches(),
    stockAssignments: getAllAssignments()
  };
}

// Simulate import
function importStockData(data) {
  const stats = {
    stockBatchesImported: 0,
    stockAssignmentsImported: 0
  };
  const errors = [];
  
  // Import batches
  if (data.stockBatches && Array.isArray(data.stockBatches)) {
    for (const batch of data.stockBatches) {
      try {
        addBatch(batch);
        stats.stockBatchesImported++;
      } catch (err) {
        errors.push(`Failed to import batch ${batch.batch_id}: ${err.message}`);
      }
    }
  }
  
  // Import assignments
  if (data.stockAssignments && Array.isArray(data.stockAssignments)) {
    for (const assignment of data.stockAssignments) {
      try {
        assignSensorToBatch(assignment.sensor_id, assignment.batch_id);
        stats.stockAssignmentsImported++;
      } catch (err) {
        errors.push(`Failed to import assignment for sensor ${assignment.sensor_id}: ${err.message}`);
      }
    }
  }
  
  return { stats, errors };
}

console.log('=== STOCK/SENSOR EXPORT/IMPORT TEST ===\n');

// Step 1: Create test data
console.log('Step 1: Creating test data...');
const batch1 = addBatch({
  lot_number: 'NG4A12345',
  received_date: '2025-01-15',
  source: 'Mediq',
  total_quantity: 10
});

const batch2 = addBatch({
  lot_number: 'NG4A67890',
  received_date: '2025-02-20',
  source: 'Apotheek',
  total_quantity: 5
});

assignSensorToBatch('NG4123456H', batch1.batch_id, 'auto');
assignSensorToBatch('NG4789012H', batch1.batch_id, 'manual');
assignSensorToBatch('NG4345678H', batch2.batch_id, 'auto');

console.log(`✅ Created 2 batches`);
console.log(`✅ Created 3 assignments`);

// Step 2: Export
console.log('\nStep 2: Exporting data...');
const exported = exportStockData();
console.log(`✅ Exported ${exported.stockBatches.length} batches`);
console.log(`✅ Exported ${exported.stockAssignments.length} assignments`);

// Verify export structure
console.log('\nExport structure check:');
console.log('Batches:', JSON.stringify(exported.stockBatches[0], null, 2).substring(0, 200) + '...');
console.log('Assignments:', JSON.stringify(exported.stockAssignments[0], null, 2));

// Step 3: Clear storage (simulate fresh import)
console.log('\nStep 3: Clearing storage...');
localStorage.clear();
console.log(`✅ Storage cleared`);

// Step 4: Import
console.log('\nStep 4: Importing data...');
const importResult = importStockData(exported);
console.log(`✅ Imported ${importResult.stats.stockBatchesImported} batches`);
console.log(`✅ Imported ${importResult.stats.stockAssignmentsImported} assignments`);

if (importResult.errors.length > 0) {
  console.log('⚠️ Import errors:', importResult.errors);
}

// Step 5: Verify
console.log('\nStep 5: Verifying imported data...');
const importedBatches = getAllBatches();
const importedAssignments = getAllAssignments();

console.log(`Batches: ${importedBatches.length} (expected 2)`);
console.log(`Assignments: ${importedAssignments.length} (expected 3)`);

// Check batch details
let batchesMatch = true;
exported.stockBatches.forEach((originalBatch, index) => {
  const importedBatch = importedBatches[index];
  if (importedBatch.lot_number !== originalBatch.lot_number) {
    console.log(`❌ Batch ${index} lot_number mismatch`);
    batchesMatch = false;
  }
  if (importedBatch.total_quantity !== originalBatch.total_quantity) {
    console.log(`❌ Batch ${index} total_quantity mismatch`);
    batchesMatch = false;
  }
});

// Check assignment details
let assignmentsMatch = true;
exported.stockAssignments.forEach((originalAssignment) => {
  const importedAssignment = importedAssignments.find(
    a => a.sensor_id === originalAssignment.sensor_id
  );
  if (!importedAssignment) {
    console.log(`❌ Assignment for sensor ${originalAssignment.sensor_id} not found`);
    assignmentsMatch = false;
  } else if (importedAssignment.batch_id !== originalAssignment.batch_id) {
    console.log(`❌ Assignment batch_id mismatch for sensor ${originalAssignment.sensor_id}`);
    assignmentsMatch = false;
  }
});

console.log('\n=== FINAL RESULT ===');
if (importedBatches.length === 2 && importedAssignments.length === 3 && batchesMatch && assignmentsMatch) {
  console.log('✅ ALL TESTS PASSED!');
  console.log('Export/Import works correctly for stock and sensor assignments.');
} else {
  console.log('❌ TESTS FAILED!');
  if (importedBatches.length !== 2) console.log('  - Wrong batch count');
  if (importedAssignments.length !== 3) console.log('  - Wrong assignment count');
  if (!batchesMatch) console.log('  - Batch data mismatch');
  if (!assignmentsMatch) console.log('  - Assignment data mismatch');
}
