import React, { useState } from 'react';
import { HelpCircle } from 'lucide-react';

/**
 * Tooltip Component
 * 
 * Shows help text on hover for metric explanations.
 * Minimal styling to match AGP+ brutalist aesthetic.
 * 
 * @version 2.2.0
 */
export default function Tooltip({ text, children }) {
  const [visible, setVisible] = useState(false);

  if (!text) return children || null;

  return (
    <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
      {children}
      <button
        onMouseEnter={() => setVisible(true)}
        onMouseLeave={() => setVisible(false)}
        onClick={(e) => {
          e.preventDefault();
          setVisible(!visible);
        }}
        style={{
          background: 'transparent',
          border: 'none',
          color: 'var(--text-secondary)',
          cursor: 'help',
          padding: '0.25rem',
          marginLeft: '0.25rem',
          opacity: 0.6,
          transition: 'opacity 0.2s'
        }}
        onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
        onMouseLeave={(e) => e.currentTarget.style.opacity = '0.6'}
      >
        <HelpCircle style={{ width: '14px', height: '14px' }} />
      </button>
      
      {visible && (
        <div style={{
          position: 'absolute',
          bottom: '100%',
          left: '50%',
          transform: 'translateX(-50%)',
          marginBottom: '0.5rem',
          background: 'var(--bg-primary)',
          border: '2px solid var(--text-primary)',
          color: 'var(--text-primary)',
          padding: '0.75rem',
          minWidth: '200px',
          maxWidth: '300px',
          fontSize: '0.75rem',
          lineHeight: '1.4',
          zIndex: 1000,
          boxShadow: '4px 4px 0 rgba(255,255,255,0.1)',
          pointerEvents: 'none',
          whiteSpace: 'normal',
          wordWrap: 'break-word'
        }}>
          {text}
          <div style={{
            position: 'absolute',
            top: '100%',
            left: '50%',
            transform: 'translateX(-50%)',
            width: 0,
            height: 0,
            borderLeft: '6px solid transparent',
            borderRight: '6px solid transparent',
            borderTop: '6px solid var(--text-primary)'
          }} />
        </div>
      )}
    </div>
  );
}
