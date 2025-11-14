/**
 * useSensors Hook
 * 
 * Simple React hook for sensor storage access.
 * No complexity, no magic, just data.
 */

import { useState, useEffect } from 'react';
import * as sensorStorage from '../storage/sensorStorage.js';
import * as stockStorage from '../storage/stockStorage.js';

export function useSensors() {
  const [sensors, setSensors] = useState([]);
  const [batches, setBatches] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const [sensorsData, batchesData, statsData] = await Promise.all([
        sensorStorage.getAllSensors(),
        stockStorage.getAllBatches(),
        sensorStorage.getStatistics()
      ]);
      
      setSensors(sensorsData);
      setBatches(batchesData);
      setStats(statsData);
      setLoading(false);
    } catch (error) {
      console.error('[useSensors] Load error:', error);
      setLoading(false);
    }
  };

  useEffect(() => {
    load(); // load is now async, but useEffect cleanup doesn't need await
  }, []);

  return {
    sensors,
    batches,
    stats,
    loading,
    refresh: load,
    
    // Pass through all storage functions
    ...sensorStorage
  };
}

export default useSensors;
