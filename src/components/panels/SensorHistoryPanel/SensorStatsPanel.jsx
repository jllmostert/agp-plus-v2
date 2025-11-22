/**
 * SensorStatsPanel.jsx - Statistics display for sensors
 * 
 * Displays sensor statistics: last 90 days, by year, by era/pump/transmitter.
 * Part of SensorHistoryPanel split (Fase 3, v4.5.0).
 * 
 * Created: 2025-11-22
 */

import React from 'react';

export default function SensorStatsPanel({
  stats,
  statsExpanded,
  setStatsExpanded,
  eraStatsExpanded,
  setEraStatsExpanded
}) {
  return (
    <>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '15px'
      }}>
        <div style={{ fontWeight: 'bold', fontFamily: 'monospace', fontSize: '14px', color: 'var(--ink)' }}>
          SENSOR STATISTIEKEN (alleen beëindigde sensoren)
        </div>
        {stats.byYear.length > 0 && (
          <button
            onClick={() => setStatsExpanded(!statsExpanded)}
            style={{
              padding: '6px 12px',
              border: '2px solid var(--ink)',
              backgroundColor: 'var(--paper)',
              color: 'var(--ink)',
              cursor: 'pointer',
              fontFamily: 'monospace',
              fontSize: '11px'
            }}
          >
            {statsExpanded ? '▼ VERBERG JAARSTATS' : '▶ TOON JAARSTATS'}
          </button>
        )}
      </div>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '15px' }}>
        {/* Last 90 days - always visible */}
        <div style={{
          padding: '15px',
          border: '2px solid var(--ink)',
          backgroundColor: 'var(--paper)'
        }}>
          <div style={{ fontWeight: 'bold', marginBottom: '10px', color: 'var(--color-green)' }}>
            LAATSTE 90 DAGEN (n={stats.last90Days.count})
          </div>
          <div style={{ fontSize: '11px', lineHeight: '1.6' }}>
            <div>Ø duur: <strong>{stats.last90Days.avg_duration} dagen</strong></div>
            <div>≥6 dagen: <strong>{stats.last90Days.pct_6days}%</strong></div>
            <div>≥6.8 dagen: <strong>{stats.last90Days.pct_6_8days}%</strong></div>
          </div>
        </div>

        {/* By Year - collapsible */}
        {statsExpanded && stats.byYear.map(yearData => (
          <div key={yearData.year} style={{
            padding: '15px',
            border: '2px solid var(--ink)',
            backgroundColor: 'var(--paper)'
          }}>
            <div style={{ fontWeight: 'bold', marginBottom: '10px', color: 'var(--ink)' }}>
              JAAR {yearData.year} (n={yearData.count})
            </div>
            <div style={{ fontSize: '11px', lineHeight: '1.6' }}>
              <div>Ø duur: <strong>{yearData.avg_duration} dagen</strong></div>
              <div>≥6 dagen: <strong>{yearData.pct_6days}%</strong></div>
              <div>≥6.8 dagen: <strong>{yearData.pct_6_8days}%</strong></div>
            </div>
          </div>
        ))}
      </div>
      
      {/* Device Era Stats */}
      {stats.byEra.length > 0 && (
        <div style={{ marginTop: '15px' }}>
          <button
            onClick={() => setEraStatsExpanded(!eraStatsExpanded)}
            style={{
              width: '100%',
              padding: '10px 15px',
              border: '2px solid var(--ink)',
              backgroundColor: eraStatsExpanded ? 'var(--ink)' : 'var(--paper)',
              color: eraStatsExpanded ? 'var(--paper)' : 'var(--ink)',
              cursor: 'pointer',
              fontFamily: 'monospace',
              fontSize: '12px',
              fontWeight: 'bold',
              textAlign: 'left',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}
          >
            <span>{eraStatsExpanded ? '▼' : '▶'} SEIZOEN STATISTIEKEN</span>
            <span style={{ fontSize: '10px', opacity: 0.8 }}>
              {stats.byEra.length} seizoenen · {stats.byPump.length} pompen · {stats.byTransmitter.length} transmitters
            </span>
          </button>
          
          {eraStatsExpanded && (
            <div style={{ padding: '15px', border: '2px solid var(--ink)', borderTop: 'none', backgroundColor: 'var(--bg-secondary)' }}>
              {/* Per Seizoen */}
              <div style={{ marginBottom: '20px' }}>
                <div style={{ fontWeight: 'bold', marginBottom: '10px', fontSize: '11px', color: 'var(--text-secondary)' }}>
                  PER SEIZOEN
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '10px' }}>
                  {stats.byEra.map(era => (
                    <div key={era.id} style={{ padding: '12px', border: '2px solid var(--ink)', backgroundColor: 'var(--paper)' }}>
                      <div style={{ fontWeight: 'bold', marginBottom: '4px', fontSize: '12px' }}>
                        {era.name} seizoen #{era.season} (n={era.count})
                      </div>
                      <div style={{ fontSize: '10px', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                        {new Date(era.start).toLocaleDateString('nl-NL', { month: 'short', year: 'numeric' })} – {era.end ? new Date(era.end).toLocaleDateString('nl-NL', { month: 'short', year: 'numeric' }) : 'heden'} · TX: {era.transmitter}
                      </div>
                      <div style={{ fontSize: '11px', lineHeight: '1.5' }}>
                        Ø {era.avg_duration}d · ≥6d: {era.pct_6days}% · ≥6.8d: {era.pct_6_8days}%
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Per Pomp */}
              <div style={{ marginBottom: '20px' }}>
                <div style={{ fontWeight: 'bold', marginBottom: '10px', fontSize: '11px', color: 'var(--text-secondary)' }}>
                  PER POMP
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '10px' }}>
                  {stats.byPump.map(pump => (
                    <div key={pump.serial} style={{ padding: '12px', border: '2px solid var(--color-green)', backgroundColor: 'var(--paper)' }}>
                      <div style={{ fontWeight: 'bold', marginBottom: '6px', fontSize: '12px', color: 'var(--color-green)' }}>
                        {pump.name} <span style={{ fontWeight: 'normal', color: 'var(--text-secondary)' }}>(n={pump.count})</span>
                      </div>
                      <div style={{ fontSize: '10px', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                        {pump.serial} · FW {pump.fw}
                      </div>
                      <div style={{ fontSize: '11px' }}>
                        Ø {pump.avg_duration}d · ≥6d: {pump.pct_6days}% · ≥6.8d: {pump.pct_6_8days}%
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Per Transmitter */}
              <div>
                <div style={{ fontWeight: 'bold', marginBottom: '10px', fontSize: '11px', color: 'var(--text-secondary)' }}>
                  PER TRANSMITTER
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '10px' }}>
                  {stats.byTransmitter.map(tx => (
                    <div key={tx.serial} style={{ padding: '12px', border: '2px solid var(--color-yellow)', backgroundColor: 'var(--paper)' }}>
                      <div style={{ fontWeight: 'bold', marginBottom: '6px', fontSize: '12px', color: 'var(--color-yellow)' }}>
                        TX #{tx.number} <span style={{ fontWeight: 'normal', color: 'var(--text-secondary)' }}>(n={tx.count})</span>
                      </div>
                      <div style={{ fontSize: '10px', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                        {tx.serial}
                      </div>
                      <div style={{ fontSize: '11px' }}>
                        Ø {tx.avg_duration}d · ≥6d: {tx.pct_6days}% · ≥6.8d: {tx.pct_6_8days}%
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
}
