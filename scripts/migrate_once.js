/**
 * ONE-TIME Migration Script
 * 
 * Migrates 219 SQLite sensors + 6 localStorage sensors to V4.
 * Run this ONCE, then delete this file.
 */

const SQLITE_JSON = '/sqlite_sensors_export.json';
const LOCAL_JSON = '/agp-sensors-2025-11-08.json';

// ============================================================================
// DATA LOADING
// ============================================================================

async function loadData() {
  console.log('📥 Loading data...');
  
  const [sqliteResp, localResp] = await Promise.all([
    fetch(SQLITE_JSON),
    fetch(LOCAL_JSON)
  ]);
  
  const sqliteSensors = await sqliteResp.json();
  const localData = await localResp.json();
  
  console.log(`  ✓ SQLite: ${sqliteSensors.length} sensors`);
  console.log(`  ✓ localStorage: ${localData.sensors.length} sensors`);
  
  return { sqliteSensors, localData };
}

// ============================================================================
// TRANSFORMATION
// ============================================================================

function toISO(timestamp) {
  if (!timestamp) return null;
  if (timestamp.includes('T') && timestamp.includes('Z')) return timestamp;
  return new Date(timestamp).toISOString();
}

function transformSQLiteSensor(s) {
  return {
    id: s.id,
    sequence: s.sequence,
    start_date: toISO(s.start_timestamp),
    end_date: toISO(s.end_timestamp),
    duration_hours: s.duration_hours,
    duration_days: s.duration_days,
    lot_number: s.lot_number,
    hw_version: s.hardware_version,
    notes: s.notes || '',
    is_locked: true,  // Lock all imported sensors by default
    batch_id: null,
    created_at: toISO(s.created_at) || new Date().toISOString(),
    updated_at: toISO(s.updated_at) || new Date().toISOString()
  };
}

function transformLocalSensor(s) {
  return {
    id: s.sensor_id,
    sequence: s.sequence || null,
    start_date: toISO(s.start_date),
    end_date: s.end_date ? toISO(s.end_date) : null,
    duration_hours: s.duration_hours || null,
    duration_days: s.duration_days || null,
    lot_number: s.lot_number,
    hw_version: s.hw_version,
    notes: s.notes || '',
    is_locked: s.is_manually_locked || false,
    batch_id: s.batch || null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
}

function transformBatch(b) {
  return {
    batch_id: b.batch_id,
    lot_number: b.lot_number,
    quantity: b.total_quantity || b.box_quantity || 0,
    received_date: b.received_date_exact || b.received_date,
    expiry_date: b.expiry_date,
    source: b.source || 'manual'
  };
}

// ============================================================================
// DEDUPLICATION
// ============================================================================

function deduplicate(sensors) {
  const map = new Map();
  sensors.forEach(s => map.set(s.id, s));
  return Array.from(map.values());
}

function deduplicateBatches(batches) {
  const map = new Map();
  batches.forEach(b => {
    if (!map.has(b.batch_id)) {
      map.set(b.batch_id, b);
    }
  });
  return Array.from(map.values());
}

// ============================================================================
// MIGRATION
// ============================================================================

export async function migrate() {
  console.log('🚀 Starting V4 migration...\n');
  
  try {
    // Load
    const { sqliteSensors, localData } = await loadData();
    
    // Transform
    console.log('🔄 Transforming...');
    const transformed = [
      ...sqliteSensors.map(transformSQLiteSensor),
      ...localData.sensors.map(transformLocalSensor)
    ];
    console.log(`  ✓ Transformed ${transformed.length} sensors`);
    
    // Deduplicate
    console.log('🔍 Deduplicating...');
    const uniqueSensors = deduplicate(transformed);
    console.log(`  ✓ ${uniqueSensors.length} unique sensors`);
    
    // Batches
    console.log('📦 Processing batches...');
    const transformedBatches = localData.batches.map(transformBatch);
    const uniqueBatches = deduplicateBatches(transformedBatches);
    console.log(`  ✓ ${uniqueBatches.length} batches`);
    
    // Deleted sensors
    console.log('🗑️  Processing deleted...');
    const deleted = (localData.deletedSensors || [])
      .filter(d => {
        // FIX: Remove sensor #222 if it's running
        const sensor = uniqueSensors.find(s => s.id === d.sensorId);
        if (sensor && !sensor.end_date) {
          console.log(`  ⚠️  Removing ${d.sensorId} from deleted (it's active!)`);
          return false;
        }
        return true;
      })
      .map(d => ({
        sensor_id: d.sensorId,
        deleted_at: new Date(d.deletedAt).toISOString()
      }));
    console.log(`  ✓ ${deleted.length} deleted sensors`);
    
    // Batch assignments
    console.log('🔗 Mapping batch assignments...');
    const assignments = localData.assignments || [];
    assignments.forEach(a => {
      const sensor = uniqueSensors.find(s => s.id == a.sensor_id);
      if (sensor) sensor.batch_id = a.batch_id;
    });
    console.log(`  ✓ ${assignments.length} assignments mapped`);
    
    // Assign sequences
    console.log('🔢 Assigning sequences...');
    let nextSeq = Math.max(...uniqueSensors.map(s => s.sequence || 0)) + 1;
    uniqueSensors.forEach(s => {
      if (!s.sequence) s.sequence = nextSeq++;
    });
    console.log(`  ✓ Highest sequence: ${nextSeq - 1}`);
    
    // Create V4 storage
    const v4 = {
      version: '4.0.0',
      last_updated: new Date().toISOString(),
      sensors: uniqueSensors,
      batches: uniqueBatches,
      deleted
    };
    
    // Validate
    console.log('\n✓ Validation:');
    console.log(`  - Total sensors: ${v4.sensors.length}`);
    console.log(`  - Active: ${v4.sensors.filter(s => !s.end_date).length}`);
    console.log(`  - Ended: ${v4.sensors.filter(s => s.end_date).length}`);
    console.log(`  - Locked: ${v4.sensors.filter(s => s.is_locked).length}`);
    console.log(`  - Batches: ${v4.batches.length}`);
    console.log(`  - Deleted: ${v4.deleted.length}`);
    
    // Write
    console.log('\n💾 Writing to localStorage...');
    localStorage.setItem('agp-sensors-v4', JSON.stringify(v4));
    console.log('✅ Migration complete!\n');
    
    // Check sensor #222
    const s222 = v4.sensors.find(s => s.id === 'sensor_1762231226000');
    if (s222) {
      console.log('🎯 Sensor #222 check:');
      console.log(`  - ID: ${s222.id}`);
      console.log(`  - Sequence: ${s222.sequence}`);
      console.log(`  - Start: ${s222.start_date}`);
      console.log(`  - End: ${s222.end_date || 'null (running)'}`);
      console.log(`  - In deleted: ${v4.deleted.some(d => d.sensor_id === s222.id) ? 'YES ❌' : 'NO ✅'}`);
    }
    
    return v4;
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
}

export default { migrate };
