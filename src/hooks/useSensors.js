/**
 * useSensors Hook
 * 
 * Simple React hook for sensor storage access.
 * No complexity, no magic, just data.
 */

import { useState, useEffect } from 'react';
import * as sensorStorage from '../storage/sensorStorage.js';

export function useSensors() {
  const [sensors, setSensors] = useState([]);
  const [batches, setBatches] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = () => {
    try {
      setSensors(sensorStorage.getAllSensors());
      setBatches(sensorStorage.getAllBatches());
      setStats(sensorStorage.getStatistics());
      setLoading(false);
    } catch (error) {
      console.error('[useSensors] Load error:', error);
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
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
