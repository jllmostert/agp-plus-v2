/**
 * Count deleted sensors with breakdown by age
 * Useful for UI to show "Clear Old Sensors (X old / Y total)"
 * 
 * @returns {Promise<Object>} Count breakdown
 */
export async function countDeletedSensors() {
  try {
    const db = await openDeletedSensorsDB();
    
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const index = store.index('deleted_at');
    
    const now = new Date();
    const EXPIRY_DAYS = 90;
    const cutoffDate = new Date(now - EXPIRY_DAYS * 24 * 60 * 60 * 1000);
    
    const request = index.openCursor();
    
    let totalCount = 0;
    let oldCount = 0;
    let recentCount = 0;
    
    return new Promise((resolve, reject) => {
      request.onsuccess = (event) => {
        const cursor = event.target.result;
        
        if (cursor) {
          const sensor = cursor.value;
          const deletedAt = new Date(sensor.deleted_at);
          
          totalCount++;
          if (deletedAt < cutoffDate) {
            oldCount++;
          } else {
            recentCount++;
          }
          
          cursor.continue();
        }
      };
