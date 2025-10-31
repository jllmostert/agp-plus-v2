// ============================================================================
// PHASE 5: LOCK UI ADDITIONS FOR SensorHistoryModal.jsx
// ============================================================================

// ADD TO IMPORTS AT TOP OF FILE:
import { 
  isSensorLocked, 
  getSensorLockStatus, 
  deleteSensorWithLockCheck,
  getLockStatistics 
} from '../storage/sensorStorage.js';

// ADD TO STATE HOOKS (after existing useState declarations):
const [deleteConfirm, setDeleteConfirm] = useState(null); // {sensorId, sensor, lockStatus}
const [forceOverride, setForceOverride] = useState(false);

// ADD THIS HELPER FUNCTION (before renderSensorRow):
/**
 * Handle delete button click with lock protection
 * Shows confirmation dialog for locked sensors, direct confirm for unlocked
 */
const handleDeleteClick = (sensor) => {
  const lockStatus = getSensorLockStatus(sensor.start_date);
  
  if (lockStatus.isLocked) {
    // Show brutalist confirmation dialog for locked sensor
    setDeleteConfirm({ 
      sensorId: sensor.sensor_id, 
      sensor, 
      lockStatus 
    });
  } else {
    // Direct browser confirm for unlocked sensor
