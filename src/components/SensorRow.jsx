/**
 * SensorRow.jsx
 * Memoized table row for sensor history
 * 
 * Performance optimization: prevents re-render unless sensor data changes
 * Sprint C1 - Table Virtualization (Simple Memoization approach)
 */

import React from 'react';

const SensorRow = React.memo(function SensorRow({
  sensor,
  batches,
  getAssignmentForSensor,
  toggleSensorLock,
  handleBatchAssignment,
  handleDeleteSensor,
  setRefreshKey
}) {
  const assignment = getAssignmentForSensor(sensor.sensor_id);
  const batch = assignment ? batches.find(b => b.batch_id === assignment.batch_id) : null;

  // Calculate duration from timestamps
  const getDuration = () => {
    if (!sensor.start_date || !sensor.end_date) return { days: 0, color: 'var(--paper)' };
    const startMs = new Date(sensor.start_date).getTime();
    const endMs = new Date(sensor.end_date).getTime();
    const days = (endMs - startMs) / (1000 * 60 * 60 * 24);
    
    const color = days >= 6.75 ? 'var(--color-green)' :
                  days >= 6 ? 'var(--color-orange)' :
                  'var(--color-red)';
    
    return { days, color };
  };

  const duration = getDuration();

  const handleLockClick = () => {
    const result = toggleSensorLock(sensor.sensor_id);
    if (result.success) {
      setRefreshKey(prev => prev + 1);
    } else {
      const message = result.detail 
        ? `❌ ${result.message}\n\n${result.detail}`
        : `❌ Fout: ${result.message}`;
      alert(message);
    }
  };

  return (
    <tr style={{ borderBottom: '1px solid var(--grid-line)' }}>
      {/* ID + Badges */}
      <td style={{
        padding: '10px 12px',
        borderRight: '1px solid var(--grid-line)',
        color: 'var(--paper)',
        fontWeight: 'bold'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span>#{sensor.chronological_index}</span>
          
          {assignment && (
            <span 
              title={batch ? `Batch: ${batch.lot_number}` : 'Assigned to batch'}
              style={{
                fontSize: '9px',
                padding: '2px 6px',
                borderRadius: '2px',
                fontWeight: 'bold',
                letterSpacing: '0.05em',
                backgroundColor: '#2563eb',
                color: '#FFFFFF',
                border: '1px solid #1d4ed8'
              }}
            >
              BATCH
            </span>
          )}
        </div>
      </td>

      {/* Lock */}
      <td style={{
        padding: '10px 12px',
        borderRight: '1px solid var(--grid-line)',
        textAlign: 'center',
        fontSize: '18px',
        cursor: 'pointer',
        backgroundColor: sensor.is_manually_locked 
          ? 'rgba(255, 0, 0, 0.1)' 
          : 'rgba(0, 255, 0, 0.05)'
      }}
      onClick={handleLockClick}
      title={sensor.is_manually_locked
        ? 'Locked - Click to unlock (allows deletion)'
        : 'Unlocked - Click to lock (prevents deletion)'}
      >
        {sensor.is_manually_locked ? '🔒' : '🔓'}
      </td>

      {/* Start Date */}
      <td style={{
        padding: '10px 12px',
        borderRight: '1px solid var(--grid-line)',
        color: 'var(--paper)'
      }}>
        {sensor.start_date ? new Date(sensor.start_date).toLocaleString('nl-NL', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        }) : '-'}
      </td>

      {/* End Date */}
      <td style={{
        padding: '10px 12px',
        borderRight: '1px solid var(--grid-line)',
        color: 'var(--paper)'
      }}>
        {sensor.end_date ? new Date(sensor.end_date).toLocaleString('nl-NL', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        }) : '-'}
      </td>

      {/* Duration */}
      <td style={{
        padding: '10px 12px',
        borderRight: '1px solid var(--grid-line)',
        color: duration.color,
        fontWeight: 'bold'
      }}>
        {duration.days > 0 ? duration.days.toFixed(1) + 'd' : '0.0d'}
      </td>

      {/* Lot Number */}
      <td style={{
        padding: '10px 12px',
        borderRight: '1px solid var(--grid-line)',
        color: 'var(--paper)',
        fontFamily: 'Monaco, monospace',
        fontWeight: 'bold'
      }}>
        {sensor.lot_number || '-'}
      </td>

      {/* HW Version */}
      <td style={{
        padding: '10px 12px',
        borderRight: '1px solid var(--grid-line)',
        color: 'var(--paper)',
        fontWeight: 'bold'
      }}>
        {sensor.hw_version || '-'}
      </td>

      {/* Batch Assignment */}
      <td style={{
        padding: '10px 12px',
        borderRight: '1px solid var(--grid-line)'
      }}>
        <select
          value={assignment ? assignment.batch_id : ''}
          onChange={(e) => handleBatchAssignment(sensor.sensor_id, e.target.value)}
          style={{
            width: '100%',
            padding: '6px',
            border: '2px solid var(--paper)',
            backgroundColor: 'rgba(227, 224, 220, 0.05)',
            color: 'var(--paper)',
            fontSize: '11px',
            fontFamily: 'Monaco, monospace',
            fontWeight: 'bold'
          }}
        >
          <option value="">-</option>
          {batches.map((b, index) => (
            <option key={`${b.batch_id}-${index}`} value={b.batch_id}>
              {b.lot_number}
            </option>
          ))}
        </select>
      </td>

      {/* Success Status */}
      <td style={{
        padding: '10px 12px',
        borderRight: '1px solid var(--grid-line)',
        color: sensor.status === 'running' 
          ? '#fbbf24'  // amber for running
          : sensor.success 
            ? 'var(--color-green)' 
            : 'var(--color-red)',
        fontWeight: 'bold',
        textTransform: 'uppercase',
        fontSize: '11px',
        letterSpacing: '0.05em'
      }}>
        {sensor.status === 'running' 
          ? '🔄 ACTIVE' 
          : sensor.success 
            ? '✓ OK' 
            : 'X FAIL'}
      </td>

      {/* Delete Button */}
      <td style={{
        padding: '10px 12px',
        textAlign: 'center'
      }}>
        <button
          onClick={() => handleDeleteSensor(sensor.sensor_id)}
          style={{
            padding: '6px 12px',
            border: '2px solid var(--color-red)',
            backgroundColor: 'transparent',
            color: 'var(--color-red)',
            fontSize: '11px',
            fontWeight: 'bold',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            cursor: 'pointer',
            fontFamily: 'Monaco, monospace'
          }}
        >
          DELETE
        </button>
      </td>
    </tr>
  );
});

export default SensorRow;
