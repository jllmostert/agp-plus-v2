import { useState, useEffect } from 'react';

/**
 * Panel navigation + keyboard shortcuts
 * Manages active panel, DevTools visibility, and all keyboard shortcuts
 * 
 * Extracted from AGPGenerator.jsx to reduce component size
 * Part of Phase 1 refactoring (Quick Wins)
 */
export function usePanelNavigation() {
  // Active panel state
  const [activePanel, setActivePanel] = useState('import');
  
  // DevTools visibility (persisted in localStorage)
  const [showDevTools, setShowDevTools] = useState(() => {
    const saved = localStorage.getItem('agp-devtools-enabled');
    return saved === 'true';
  });
  
  // Keyboard shortcuts modal
  const [showShortcuts, setShowShortcuts] = useState(false);

  // Persist DevTools state to localStorage
  useEffect(() => {
    localStorage.setItem('agp-devtools-enabled', String(showDevTools));
  }, [showDevTools]);

  // Keyboard shortcuts handler
  useEffect(() => {
    const handleKeyPress = (e) => {
      // Ctrl+1/2/3/4/5: Switch panels
      if (e.ctrlKey && ['1', '2', '3', '4', '5'].includes(e.key)) {
        e.preventDefault();
        const panels = ['import', 'dagprofielen', 'sensoren', 'export', 'settings'];
        const panelIndex = parseInt(e.key) - 1;
        setActivePanel(panels[panelIndex]);
      }
      
      // Ctrl+Shift+D: Toggle DevTools
      if (e.ctrlKey && e.shiftKey && e.key === 'D') {
        e.preventDefault();
        setShowDevTools(prev => !prev);
      }
      
      // Escape: Close DevTools (only if DevTools is open)
      if (e.key === 'Escape' && showDevTools) {
        setShowDevTools(false);
      }
      
      // Ctrl+K: Show/hide keyboard shortcuts modal
      if (e.ctrlKey && e.key === 'k') {
        e.preventDefault();
        setShowShortcuts(prev => !prev);
      }
    };

    // Add event listener
    window.addEventListener('keydown', handleKeyPress);
    
    // Cleanup on unmount
    return () => {
      window.removeEventListener('keydown', handleKeyPress);
    };
  }, [showDevTools]); // Re-run when showDevTools changes (for Escape handling)

  // Helper: Toggle DevTools programmatically
  const toggleDevTools = () => {
    setShowDevTools(prev => !prev);
  };

  return {
    // Panel navigation
    activePanel,
    setActivePanel,
    
    // DevTools
    showDevTools,
    setShowDevTools,
    toggleDevTools,
    
    // Keyboard shortcuts modal
    showShortcuts,
    setShowShortcuts
  };
}
