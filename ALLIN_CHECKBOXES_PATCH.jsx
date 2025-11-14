// COMPLETE ALL-IN SECTIE MET CHECKBOXES
// Vervang regels 217-320 in DataManagementModal.jsx

          {/* ALL-IN Complete Reset Option */}
          <div style={{
            background: 'rgba(220, 38, 38, 0.1)',
            border: '3px solid var(--color-red)',
            padding: '1.5rem'
          }}>
            <h3 style={{
              fontSize: '0.875rem',
              fontWeight: 700,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              marginBottom: '1rem',
              color: 'var(--color-red)'
            }}>
              ⚠️ COMPLETE RESET
            </h3>
            <p style={{
              fontSize: '0.875rem',
              lineHeight: '1.6',
              marginBottom: '1rem',
              color: 'var(--ink)'
            }}>
              <strong>ALL-IN</strong> - Selecteer wat je wilt verwijderen:
            </p>
            
            {/* Checkboxes for ALL-IN deletion */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '0.75rem',
              marginBottom: '1rem',
              paddingLeft: '0.5rem'
            }}>
              <label style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                cursor: 'pointer',
                fontSize: '0.875rem',
                color: 'var(--ink)'
              }}>
                <input
                  type="checkbox"
                  checked={allInGlucose}
                  onChange={(e) => setAllInGlucose(e.target.checked)}
                  style={{ cursor: 'pointer', width: '16px', height: '16px' }}
                />
                Alle glucose readings
              </label>
              
              <label style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                cursor: 'pointer',
                fontSize: '0.875rem',
                color: 'var(--ink)'
              }}>
                <input
                  type="checkbox"
                  checked={allInCartridge}
                  onChange={(e) => setAllInCartridge(e.target.checked)}
                  style={{ cursor: 'pointer', width: '16px', height: '16px' }}
                />
                Alle cartridge changes
              </label>
              
              <label style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                cursor: 'pointer',
                fontSize: '0.875rem',
                color: 'var(--ink)'
              }}>
                <input
                  type="checkbox"
                  checked={allInProTime}
                  onChange={(e) => setAllInProTime(e.target.checked)}
                  style={{ cursor: 'pointer', width: '16px', height: '16px' }}
                />
                Alle ProTime werkdagen
              </label>
              
              <div style={{ height: '1px', background: 'var(--border-primary)', margin: '0.5rem 0' }} />
              
              <label style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                cursor: 'pointer',
                fontSize: '0.875rem',
                color: 'var(--color-red)',
                fontWeight: 600
              }}>
                <input
                  type="checkbox"
                  checked={allInSensors}
                  onChange={(e) => setAllInSensors(e.target.checked)}
                  style={{ cursor: 'pointer', width: '16px', height: '16px' }}
                />
                Alle sensoren (⚠️ permanent!)
              </label>
              
              <label style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                cursor: 'pointer',
                fontSize: '0.875rem',
                color: 'var(--color-red)',
                fontWeight: 600
              }}>
                <input
                  type="checkbox"
                  checked={allInStock}
                  onChange={(e) => setAllInStock(e.target.checked)}
                  style={{ cursor: 'pointer', width: '16px', height: '16px' }}
                />
                Alle sensor stock (⚠️ permanent!)
              </label>
              
              <label style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                cursor: 'pointer',
                fontSize: '0.875rem',
                color: 'var(--color-red)',
                fontWeight: 700
              }}>
                <input
                  type="checkbox"
                  checked={allInPatient}
                  onChange={(e) => setAllInPatient(e.target.checked)}
                  style={{ cursor: 'pointer', width: '16px', height: '16px' }}
                />
                Patiënt info (⚠️ ALLES WISSEN!)
              </label>
            </div>
            
            <p style={{
              fontSize: '0.75rem',
              marginBottom: '1rem',
              color: 'var(--text-secondary)',
              background: 'rgba(0,0,0,0.05)',
              padding: '0.5rem',
              borderLeft: '3px solid var(--color-red)'
            }}>
              ✓ Automatische backup wordt gemaakt<br/>
              ✓ Je kunt altijd herstellen via JSON import
            </p>
            
            <button
              onClick={async () => {
                // Check if at least one option selected
                const hasSelection = allInGlucose || allInCartridge || allInProTime || 
                                    allInSensors || allInStock || allInPatient;
                
                if (!hasSelection) {
                  alert('Selecteer minimaal 1 optie om te verwijderen');
                  return;
                }
                
                // Build confirmation message
                const toDelete = [];
                if (allInGlucose) toDelete.push('Glucose readings');
                if (allInCartridge) toDelete.push('Cartridge changes');
                if (allInProTime) toDelete.push('ProTime werkdagen');
                if (allInSensors) toDelete.push('⚠️ SENSOREN');
                if (allInStock) toDelete.push('⚠️ SENSOR STOCK');
                if (allInPatient) toDelete.push('⚠️⚠️ PATIËNT INFO');
                
                const confirmed = confirm(
                  'ALL-IN CLEANUP\n\n' +
                  'Dit wordt verwijderd:\n' +
                  toDelete.map(item => `- ${item}`).join('\n') +
                  '\n\nAutomatische backup wordt gemaakt\n\n' +
                  'Ben je ABSOLUUT ZEKER?'
                );
                
                if (!confirmed) {
                  return;
                }
                
                setIsDeleting(true);
                
                try {
                  // Create backup first
                  debug.log('[DataManagementModal] Creating backup before ALL-IN...');
                  const { exportAndDownload } = await import('../storage/export');
                  const backupResult = await exportAndDownload();
                  
                  if (!backupResult.success) {
                    alert(`Backup failed: ${backupResult.error}\n\nCleanup cancelled for safety.`);
                    setIsDeleting(false);
                    return;
                  }
                  
                  debug.log('[DataManagementModal] Backup created:', backupResult.filename);
                  
                  // Execute ALL-IN cleanup with selected options
                  if (allInGlucose || allInCartridge || allInProTime) {
                    const { cleanupRecords } = await import('../storage/masterDatasetStorage');
                    const result = await cleanupRecords({ type: 'all-in' });
                    
                    if (!result.success) {
                      alert(`Cleanup failed: ${result.error}`);
                      setIsDeleting(false);
                      return;
                    }
                  }
                  
                  // Delete sensors if selected
                  if (allInSensors) {
                    const sensorStorage = await import('../storage/sensorStorage');
                    const result = sensorStorage.clearAllSensors();
                    debug.log('[DataManagementModal] Sensors cleared:', result);
                  }
                  
                  // Delete stock if selected
                  if (allInStock) {
                    const { getAllBatches, deleteBatch } = await import('../storage/stockStorage');
                    const batches = getAllBatches();
                    batches.forEach(batch => deleteBatch(batch.batch_id));
                    debug.log('[DataManagementModal] Stock cleared:', batches.length, 'batches');
                  }
                  
                  // Delete patient info if selected
                  if (allInPatient) {
                    localStorage.removeItem('agp-patient-info');
                    debug.log('[DataManagementModal] Patient info cleared');
                  }
                  
                  const summary = [
                    `Backup: ${backupResult.filename}`,
                    '',
                    'Verwijderd:'
                  ];
                  
                  if (allInGlucose) summary.push('✓ Glucose readings');
                  if (allInCartridge) summary.push('✓ Cartridge changes');
                  if (allInProTime) summary.push('✓ ProTime werkdagen');
                  if (allInSensors) summary.push('✓ Sensoren');
                  if (allInStock) summary.push('✓ Sensor stock');
                  if (allInPatient) summary.push('✓ Patiënt info');
                  
                  alert('ALL-IN Cleanup Complete\n\n' + summary.join('\n'));
                  onClose();
                  window.location.reload(); // Force reload to clear all caches
                  
                } catch (err) {
                  debug.error('[DataManagementModal] ALL-IN failed:', err);
                  alert(`ALL-IN failed: ${err.message}`);
                } finally {
                  setIsDeleting(false);
                }
              }}
              disabled={isDeleting || !(allInGlucose || allInCartridge || allInProTime || allInSensors || allInStock || allInPatient)}
              style={{
                width: '100%',
                padding: '1rem',
                border: '3px solid var(--border-primary)',
                background: (isDeleting || !(allInGlucose || allInCartridge || allInProTime || allInSensors || allInStock || allInPatient)) 
                  ? 'var(--bg-tertiary)' 
                  : 'var(--color-red)',
                color: (isDeleting || !(allInGlucose || allInCartridge || allInProTime || allInSensors || allInStock || allInPatient))
                  ? 'var(--text-secondary)'
                  : '#fff',
                fontWeight: 700,
                fontSize: '0.875rem',
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                cursor: (isDeleting || !(allInGlucose || allInCartridge || allInProTime || allInSensors || allInStock || allInPatient))
                  ? 'not-allowed' 
                  : 'pointer',
                opacity: isDeleting ? 0.5 : 1
              }}
            >
              {isDeleting ? '⏳ Deleting...' : '⚠️ ALL-IN UITVOEREN'}
            </button>
          </div>
