/**
 * SensorTable.jsx - Sensor data table display
 * 
 * Pure display component for the sensor table.
 * Part of SensorHistoryPanel split (Fase 3, v4.5.0).
 * 
 * Created: 2025-11-22
 */

import React from 'react';

export default function SensorTable({
  sortedSensors,
  batches,
  sortColumn,
  sortDirection,
  onSort,
  onToggleLock,
  onDelete,
  onBatchAssign,
  getEraForDate
}) {
  const SortIndicator = ({ column }) => (
    sortColumn === column ? (sortDirection === 'asc' ? '↑' : '↓') : ''
  );

  return (
    <table style={{
      width: '100%',
      borderCollapse: 'collapse',
      fontFamily: 'monospace'
    }}>
      <thead style={{ position: 'sticky', top: 0, backgroundColor: 'var(--ink)', color: 'var(--paper)' }}>
        <tr>
          <th style={{ padding: '12px', textAlign: 'left', cursor: 'pointer', borderRight: '2px solid var(--paper)' }}
              onClick={() => onSort('sequence')}>
            # <SortIndicator column="sequence" />
          </th>
          <th style={{ padding: '12px', textAlign: 'center', borderRight: '2px solid var(--paper)' }}>
            LOCK
          </th>
          <th style={{ padding: '12px', textAlign: 'left', cursor: 'pointer', borderRight: '2px solid var(--paper)' }}
              onClick={() => onSort('start_date')}>
            START <SortIndicator column="start_date" />
          </th>
          <th style={{ padding: '12px', textAlign: 'left', borderRight: '2px solid var(--paper)' }}>
            END
          </th>
          <th style={{ padding: '12px', textAlign: 'right', borderRight: '2px solid var(--paper)' }}>
            DUUR
          </th>
          <th style={{ padding: '12px', textAlign: 'left', borderRight: '2px solid var(--paper)' }}>
            SEIZOEN
          </th>
          <th style={{ padding: '12px', textAlign: 'left', borderRight: '2px solid var(--paper)' }}>
            BATCH
          </th>
          <th style={{ padding: '12px', textAlign: 'center', cursor: 'pointer', borderRight: '2px solid var(--paper)' }}
              onClick={() => onSort('status')}>
            STATUS <SortIndicator column="status" />
          </th>
          <th style={{ padding: '12px', textAlign: 'center' }}>
            DELETE
          </th>
        </tr>
      </thead>
      <tbody>
        {sortedSensors.map(sensor => (
          <tr key={sensor.id} style={{ borderBottom: '1px solid var(--grid-line)' }}>
            {/* Sequence */}
            <td style={{ padding: '10px 12px', fontWeight: 'bold', borderRight: '1px solid var(--grid-line)', color: 'var(--ink)' }}>
              #{sensor.sequence}
            </td>
            
            {/* Lock */}
            <td style={{
              padding: '10px 12px',
              textAlign: 'center',
              cursor: 'pointer',
              backgroundColor: sensor.is_locked ? 'var(--bg-tertiary)' : 'var(--bg-secondary)',
              borderRight: '1px solid var(--grid-line)'
            }} onClick={() => onToggleLock(sensor.id)}>
              {sensor.is_locked ? '🔒' : '🔓'}
            </td>
            
            {/* Start Date */}
            <td style={{ padding: '10px 12px', borderRight: '1px solid var(--grid-line)', color: 'var(--ink)' }}>
              {(() => {
                const dateStr = sensor.start_date || sensor.startTimestamp;
                if (!dateStr) return 'Invalid Date';
                const date = new Date(dateStr);
                return isNaN(date.getTime()) ? 'Invalid Date' : date.toLocaleString('nl-NL');
              })()}
            </td>
            
            {/* End Date */}
            <td style={{ padding: '10px 12px', borderRight: '1px solid var(--grid-line)', color: 'var(--ink)' }}>
              {(() => {
                const dateStr = sensor.end_date || sensor.endTimestamp || sensor.stoppedAt;
                if (!dateStr) return '-';
                const date = new Date(dateStr);
                return isNaN(date.getTime()) ? '-' : date.toLocaleString('nl-NL');
              })()}
            </td>
            
            {/* Duration */}
            <td style={{ padding: '10px 12px', borderRight: '1px solid var(--grid-line)', color: 'var(--ink)', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
              {(() => {
                const startStr = sensor.start_date || sensor.startTimestamp;
                const endStr = sensor.end_date || sensor.endTimestamp || sensor.stoppedAt;
                if (!startStr) return '-';
                const start = new Date(startStr);
                if (isNaN(start.getTime())) return 'NaN';
                const end = endStr ? new Date(endStr) : new Date();
                const hours = (end - start) / (1000 * 60 * 60);
                const days = (hours / 24).toFixed(1);
                return endStr ? `${days}d` : `${days}d →`;
              })()}
            </td>
            
            {/* Seizoen */}
            <td style={{ padding: '10px 12px', borderRight: '1px solid var(--grid-line)', color: 'var(--ink)', fontSize: '11px' }}>
              {(() => {
                const era = getEraForDate(sensor.start_date);
                return era ? `${era.name} #${era.season}` : '-';
              })()}
            </td>
            
            {/* Batch Assignment */}
            <td style={{ padding: '10px 12px', borderRight: '1px solid var(--grid-line)' }}>
              <select
                value={sensor.batch_id || ''}
                onChange={(e) => onBatchAssign(sensor.id, e.target.value)}
                style={{
                  width: '100%',
                  padding: '4px',
                  border: '1px solid var(--ink)',
                  fontFamily: 'monospace',
                  fontSize: '11px',
                  backgroundColor: 'var(--paper)',
                  color: 'var(--ink)'
                }}
              >
                <option value="">-</option>
                {batches?.map(b => (
                  <option key={b.batch_id} value={b.batch_id}>
                    {b.lot_number}
                  </option>
                ))}
              </select>
            </td>
            
            {/* Status */}
            <td style={{ padding: '10px 12px', textAlign: 'center', borderRight: '1px solid var(--grid-line)' }}>
              <span style={{
                display: 'inline-block',
                padding: '6px 12px',
                backgroundColor: `var(${sensor.statusInfo.colorVar})`,
                color: 'var(--paper)',
                border: `2px solid var(${sensor.statusInfo.colorVar})`,
                fontWeight: 'bold',
                fontSize: '11px',
                letterSpacing: '1px'
              }}>
                {sensor.statusInfo.label.toUpperCase()}
              </span>
            </td>
            
            {/* Delete */}
            <td style={{ padding: '10px 12px', textAlign: 'center' }}>
              <button
                onClick={() => onDelete(sensor.id, sensor.sequence)}
                disabled={sensor.is_locked}
                style={{
                  padding: '6px 12px',
                  border: '2px solid var(--color-red)',
                  backgroundColor: sensor.is_locked ? 'var(--bg-tertiary)' : 'var(--paper)',
                  color: sensor.is_locked ? 'var(--text-secondary)' : 'var(--color-red)',
                  cursor: sensor.is_locked ? 'not-allowed' : 'pointer',
                  fontWeight: 'bold',
                  fontFamily: 'monospace'
                }}
              >
                DEL
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
