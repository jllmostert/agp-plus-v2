/**
 * SensorHistoryModal.jsx
 * Full-screen modal showing Guardian 4 sensor usage history
 * 
 * Features:
 * - Overall statistics (total, success rate, avg duration)
 * - HW version breakdown
 * - Lot number performance grid
 * - Filterable + sortable table
 * - Export to HTML/CSV
 * 
 * Design: Brutalist paper/ink theme matching day profiles modal
 */

import React, { useState, useMemo } from 'react';
import { 
  calculateOverallStats, 
  calculateHWVersionStats,
  calculateLotPerformance,
  filterSensors,
  sortSensors
} from '../core/sensor-history-engine';

export default function SensorHistoryModal({ isOpen, onClose, sensors }) {
  // Filters state
  const [filters, setFilters] = useState({
    startDate: null,
    endDate: null,
    lotNumber: null,
    hwVersion: null,
    successOnly: false,
    failedOnly: false
  });

  // Sort state
  const [sortColumn, setSortColumn] = useState('start_date');
  const [sortDirection, setSortDirection] = useState('desc');

  // Calculate stats (memoized for performance)
  const overallStats = useMemo(() => calculateOverallStats(sensors), [sensors]);
  const hwStats = useMemo(() => calculateHWVersionStats(sensors), [sensors]);
  const lotStats = useMemo(() => calculateLotPerformance(sensors), [sensors]);

  // Filtered sensors
  const filteredSensors = useMemo(() => {
    return filterSensors(sensors, filters);
  }, [sensors, filters]);

  // Sorted sensors
  const sortedSensors = useMemo(() => {
    return sortSensors(filteredSensors, sortColumn, sortDirection);
  }, [filteredSensors, sortColumn, sortDirection]);

  // Handle sort click
  const handleSort = (column) => {
    if (sortColumn === column) {
      // Toggle direction
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('desc');
    }
  };

  // Reset filters
  const resetFilters = () => {
    setFilters({
      startDate: null,
      endDate: null,
      lotNumber: null,
      hwVersion: null,
      successOnly: false,
      failedOnly: false
    });
  };

  if (!isOpen) return null;

  return (
    <div 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 9999,
        backgroundColor: 'rgba(0, 0, 0, 0.97)',
        overflow: 'hidden'
      }}
      onClick={onClose}
    >
      <div 
        style={{
          position: 'relative',
          height: '100%',
          overflowY: 'auto',
          overflowX: 'hidden'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Control buttons - sticky top */}
        <div className="sticky top-0 z-10 flex justify-end gap-4 p-6 bg-black bg-opacity-90">
          <button
            onClick={onClose}
            style={{
              fontFamily: 'Courier New, monospace',
              fontSize: '18px',
              fontWeight: 'bold',
              padding: '12px 24px',
              border: '3px solid var(--paper)',
              backgroundColor: 'var(--ink)',
              color: 'var(--paper)',
              cursor: 'pointer',
              textTransform: 'uppercase',
              letterSpacing: '2px'
            }}
          >
            ← SLUITEN
          </button>
        </div>

        {/* Content container */}
        <div style={{
          maxWidth: '1400px',
          margin: '0 auto',
          padding: '0 24px 48px'
        }}>
          {/* Title */}
          <div style={{
            fontFamily: 'Courier New, monospace',
            fontSize: '32px',
            fontWeight: 'bold',
            color: 'var(--paper)',
            textTransform: 'uppercase',
            letterSpacing: '3px',
            marginBottom: '24px',
            borderBottom: '3px solid var(--paper)',
            paddingBottom: '16px'
          }}>
            GUARDIAN 4 SENSOR HISTORY
          </div>

          {/* Overall Stats Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '16px',
            marginBottom: '24px'
          }}>
            {/* Total Sensors */}
            <div style={{
              border: '3px solid var(--paper)',
              padding: '16px',
              backgroundColor: 'rgba(227, 224, 220, 0.05)'
            }}>
              <div style={{
                fontSize: '11px',
                fontWeight: 'bold',
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                color: 'var(--paper)',
                marginBottom: '8px'
              }}>
                TOTAAL SENSORS
              </div>
              <div style={{
                fontSize: '32px',
                fontWeight: 'bold',
                color: 'var(--paper)',
                lineHeight: 1
              }}>
                {overallStats.total}
              </div>
              <div style={{
                fontSize: '10px',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                color: 'var(--paper)',
                opacity: 0.7,
                marginTop: '8px'
              }}>
                {overallStats.totalDays} dagen totaal
              </div>
            </div>

            {/* Success Rate */}
            <div style={{
              border: '3px solid var(--paper)',
              padding: '16px',
              backgroundColor: 'rgba(227, 224, 220, 0.05)'
            }}>
              <div style={{
                fontSize: '11px',
                fontWeight: 'bold',
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                color: 'var(--paper)',
                marginBottom: '8px'
              }}>
                SUCCESS RATE
              </div>
              <div style={{
                fontSize: '32px',
                fontWeight: 'bold',
                color: overallStats.successRate >= 70 ? 'var(--color-green)' : 'var(--color-orange)',
                lineHeight: 1
              }}>
                {overallStats.successRate}%
              </div>
              <div style={{
                fontSize: '10px',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                color: 'var(--paper)',
                opacity: 0.7,
                marginTop: '8px'
              }}>
                {overallStats.successful}/{overallStats.total} sensors
              </div>
            </div>

            {/* Avg Duration */}
            <div style={{
              border: '3px solid var(--paper)',
              padding: '16px',
              backgroundColor: 'rgba(227, 224, 220, 0.05)'
            }}>
              <div style={{
                fontSize: '11px',
                fontWeight: 'bold',
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                color: 'var(--paper)',
                marginBottom: '8px'
              }}>
                GEM. DUUR
              </div>
              <div style={{
                fontSize: '32px',
                fontWeight: 'bold',
                color: 'var(--paper)',
                lineHeight: 1
              }}>
                {overallStats.avgDuration}d
              </div>
              <div style={{
                fontSize: '10px',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                color: 'var(--paper)',
                opacity: 0.7,
                marginTop: '8px'
              }}>
                Streefwaarde: 7.0d
              </div>
            </div>

            {/* Failed */}
            <div style={{
              border: '3px solid var(--paper)',
              padding: '16px',
              backgroundColor: 'rgba(227, 224, 220, 0.05)'
            }}>
              <div style={{
                fontSize: '11px',
                fontWeight: 'bold',
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                color: 'var(--paper)',
                marginBottom: '8px'
              }}>
                FAILURES
              </div>
              <div style={{
                fontSize: '32px',
                fontWeight: 'bold',
                color: overallStats.failed > 0 ? 'var(--color-red)' : 'var(--paper)',
                lineHeight: 1
              }}>
                {overallStats.failed}
              </div>
              <div style={{
                fontSize: '10px',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                color: 'var(--paper)',
                opacity: 0.7,
                marginTop: '8px'
              }}>
                &lt;6 dagen = fail
              </div>
            </div>
          </div>

          {/* HW Version Stats */}
          {hwStats.length > 0 && (
            <div style={{
              border: '3px solid var(--paper)',
              padding: '16px',
              backgroundColor: 'rgba(227, 224, 220, 0.05)',
              marginBottom: '24px'
            }}>
              <h2 style={{
                fontSize: '14px',
                fontWeight: 'bold',
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                color: 'var(--paper)',
                marginBottom: '16px'
              }}>
                HARDWARE VERSIE PERFORMANCE
              </h2>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                gap: '12px'
              }}>
                {hwStats.map(hw => (
                  <div key={hw.hwVersion} style={{
                    border: '2px solid var(--paper)',
                    padding: '12px',
                    backgroundColor: 'rgba(227, 224, 220, 0.03)'
                  }}>
                    <div style={{
                      fontSize: '11px',
                      fontWeight: 'bold',
                      textTransform: 'uppercase',
                      letterSpacing: '0.1em',
                      color: 'var(--paper)',
                      marginBottom: '8px'
                    }}>
                      {hw.hwVersion}
                    </div>
                    <div style={{
                      fontSize: '20px',
                      fontWeight: 'bold',
                      color: hw.successRate >= 70 ? 'var(--color-green)' : 'var(--color-orange)'
                    }}>
                      {hw.successRate}%
                    </div>
                    <div style={{
                      fontSize: '10px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      color: 'var(--paper)',
                      opacity: 0.7,
                      marginTop: '4px'
                    }}>
                      {hw.successful}/{hw.total} • {hw.avgDuration}d gem
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Lot Number Performance (top 10) */}
          {lotStats.length > 0 && (
            <div style={{
              border: '3px solid var(--paper)',
              padding: '16px',
              backgroundColor: 'rgba(227, 224, 220, 0.05)',
              marginBottom: '24px'
            }}>
              <h2 style={{
                fontSize: '14px',
                fontWeight: 'bold',
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                color: 'var(--paper)',
                marginBottom: '16px'
              }}>
                TOP 10 LOTNUMMERS
              </h2>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
                gap: '8px'
              }}>
                {lotStats.slice(0, 10).map(lot => (
                  <div key={lot.lotNumber} style={{
                    border: '2px solid var(--paper)',
                    padding: '10px',
                    backgroundColor: 'rgba(227, 224, 220, 0.03)'
                  }}>
                    <div style={{
                      fontSize: '10px',
                      fontWeight: 'bold',
                      textTransform: 'uppercase',
                      letterSpacing: '0.1em',
                      color: 'var(--paper)',
                      marginBottom: '6px',
                      fontFamily: 'Monaco, monospace'
                    }}>
                      {lot.lotNumber}
                    </div>
                    <div style={{
                      fontSize: '18px',
                      fontWeight: 'bold',
                      color: lot.successRate >= 70 ? 'var(--color-green)' : 
                             lot.successRate >= 50 ? 'var(--color-orange)' : 'var(--color-red)'
                    }}>
                      {lot.successRate}%
                    </div>
                    <div style={{
                      fontSize: '9px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      color: 'var(--paper)',
                      opacity: 0.7,
                      marginTop: '4px'
                    }}>
                      {lot.successful}/{lot.total} sensors
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Sensors Table */}
          <div style={{
            border: '3px solid var(--paper)',
            backgroundColor: 'rgba(227, 224, 220, 0.05)',
            overflowX: 'auto'
          }}>
            <table style={{
              width: '100%',
              borderCollapse: 'collapse',
              fontFamily: 'Courier New, monospace',
              fontSize: '12px'
            }}>
              <thead style={{
                backgroundColor: 'var(--ink)',
                color: 'var(--paper)'
              }}>
                <tr>
                  <th 
                    onClick={() => handleSort('sensor_id')}
                    style={{
                      padding: '12px',
                      textAlign: 'left',
                      fontSize: '11px',
                      fontWeight: 'bold',
                      textTransform: 'uppercase',
                      letterSpacing: '0.1em',
                      cursor: 'pointer',
                      borderRight: '1px solid var(--paper)'
                    }}
                  >
                    #ID {sortColumn === 'sensor_id' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </th>
                  <th 
                    onClick={() => handleSort('start_date')}
                    style={{
                      padding: '12px',
                      textAlign: 'left',
                      fontSize: '11px',
                      fontWeight: 'bold',
                      textTransform: 'uppercase',
                      letterSpacing: '0.1em',
                      cursor: 'pointer',
                      borderRight: '1px solid var(--paper)'
                    }}
                  >
                    START {sortColumn === 'start_date' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </th>
                  <th 
                    onClick={() => handleSort('end_date')}
                    style={{
                      padding: '12px',
                      textAlign: 'left',
                      fontSize: '11px',
                      fontWeight: 'bold',
                      textTransform: 'uppercase',
                      letterSpacing: '0.1em',
                      cursor: 'pointer',
                      borderRight: '1px solid var(--paper)'
                    }}
                  >
                    EINDE {sortColumn === 'end_date' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </th>

                  <th 
                    onClick={() => handleSort('duration_days')}
                    style={{
                      padding: '12px',
                      textAlign: 'left',
                      fontSize: '11px',
                      fontWeight: 'bold',
                      textTransform: 'uppercase',
                      letterSpacing: '0.1em',
                      cursor: 'pointer',
                      borderRight: '1px solid var(--paper)'
                    }}
                  >
                    DUUR {sortColumn === 'duration_days' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </th>
                  <th 
                    onClick={() => handleSort('lot_number')}
                    style={{
                      padding: '12px',
                      textAlign: 'left',
                      fontSize: '11px',
                      fontWeight: 'bold',
                      textTransform: 'uppercase',
                      letterSpacing: '0.1em',
                      cursor: 'pointer',
                      borderRight: '1px solid var(--paper)'
                    }}
                  >
                    LOT {sortColumn === 'lot_number' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </th>
                  <th 
                    onClick={() => handleSort('hw_version')}
                    style={{
                      padding: '12px',
                      textAlign: 'left',
                      fontSize: '11px',
                      fontWeight: 'bold',
                      textTransform: 'uppercase',
                      letterSpacing: '0.1em',
                      cursor: 'pointer',
                      borderRight: '1px solid var(--paper)'
                    }}
                  >
                    HW {sortColumn === 'hw_version' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </th>
                  <th 
                    onClick={() => handleSort('success')}
                    style={{
                      padding: '12px',
                      textAlign: 'left',
                      fontSize: '11px',
                      fontWeight: 'bold',
                      textTransform: 'uppercase',
                      letterSpacing: '0.1em',
                      cursor: 'pointer'
                    }}
                  >
                    STATUS {sortColumn === 'success' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </th>
                </tr>
              </thead>

              <tbody>
                {sortedSensors.map(sensor => (
                  <tr key={sensor.sensor_id} style={{
                    borderBottom: '1px solid var(--grid-line)'
                  }}>
                    <td style={{
                      padding: '10px 12px',
                      borderRight: '1px solid var(--grid-line)',
                      color: 'var(--paper)',
                      fontWeight: 'bold'
                    }}>
                      #{sensor.sensor_id}
                    </td>
                    <td style={{
                      padding: '10px 12px',
                      borderRight: '1px solid var(--grid-line)',
                      color: 'var(--paper)'
                    }}>
                      {sensor.start_date ? new Date(sensor.start_date).toLocaleDateString('nl-NL') : '-'}
                    </td>
                    <td style={{
                      padding: '10px 12px',
                      borderRight: '1px solid var(--grid-line)',
                      color: 'var(--paper)'
                    }}>
                      {sensor.end_date ? new Date(sensor.end_date).toLocaleDateString('nl-NL') : '-'}
                    </td>
                    <td style={{
                      padding: '10px 12px',
                      borderRight: '1px solid var(--grid-line)',
                      color: sensor.duration_days >= 7 ? 'var(--color-green)' :
                             sensor.duration_days >= 6 ? 'var(--color-orange)' :
                             'var(--color-red)',
                      fontWeight: 'bold'
                    }}>
                      {sensor.duration_days ? sensor.duration_days.toFixed(1) : '0.0'}d
                    </td>
                    <td style={{
                      padding: '10px 12px',
                      borderRight: '1px solid var(--grid-line)',
                      color: 'var(--paper)',
                      fontFamily: 'Monaco, monospace',
                      fontWeight: 'bold'
                    }}>
                      {sensor.lot_number || '-'}
                    </td>
                    <td style={{
                      padding: '10px 12px',
                      borderRight: '1px solid var(--grid-line)',
                      color: 'var(--paper)',
                      fontWeight: 'bold'
                    }}>
                      {sensor.hw_version || '-'}
                    </td>
                    <td style={{
                      padding: '10px 12px',
                      color: 'var(--paper)'
                    }}>
                      <span style={{
                        display: 'inline-block',
                        padding: '4px 12px',
                        fontSize: '10px',
                        fontWeight: 'bold',
                        textTransform: 'uppercase',
                        letterSpacing: '0.1em',
                        border: sensor.success === 1 ? '2px solid var(--color-green)' : '2px solid var(--color-red)',
                        backgroundColor: sensor.success === 1 ? 'var(--color-green)' : 'var(--color-red)',
                        color: 'var(--paper)'
                      }}>
                        {sensor.success === 1 ? '✓ OK' : '✗ FAIL'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
