/**
 * DateRangeFilterTest - Test component for DateRangeFilter
 * Shows the filter and displays filtered reading count
 */

import React from 'react';
import { useMasterDataset } from '../hooks/useMasterDataset';
import { DateRangeFilter } from './DateRangeFilter';

export function DateRangeFilterTest() {
  const { readings, stats, setDateRange } = useMasterDataset();

  return (
    <div style={{ padding: '20px' }}>
      <DateRangeFilter 
        onRangeChange={setDateRange}
        currentRange={stats?.dateRange}
      />
      
      <div style={{
        background: '#1a1a1a',
        border: '3px solid #16a34a',
        padding: '16px',
        color: '#ffffff',
        fontFamily: 'monospace'
      }}>
        <h3 style={{ margin: '0 0 12px 0', fontSize: '14px' }}>
          FILTERED RESULTS
        </h3>
        <div style={{ fontSize: '12px', color: '#999' }}>
          <strong style={{ color: '#fff' }}>Readings:</strong> {readings.length.toLocaleString()}
        </div>
      </div>
    </div>
  );
}