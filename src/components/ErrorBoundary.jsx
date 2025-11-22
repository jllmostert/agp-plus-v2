/**
 * Error Boundary for AGP+
 * 
 * Catches JavaScript errors in child components and displays
 * a recovery UI instead of crashing the entire application.
 * 
 * Medical Device Note: Error boundaries are critical for maintaining
 * user trust and preventing data loss perception during errors.
 * 
 * @version 4.5.0
 */
import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log error for debugging (medical audit trail)
    console.error('[AGP+ Error Boundary]', {
      error: error.toString(),
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
      boundary: this.props.name || 'unnamed'
    });
    
    this.setState({ error, errorInfo });
  }

  handleReload = () => {
    window.location.reload();
  };

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (this.state.hasError) {
      // Fallback UI - brutalist design matching AGP+ style
      return (
        <div style={{
          padding: '2rem',
          fontFamily: 'var(--font-mono, "SF Mono", "Monaco", monospace)',
          background: 'var(--paper, #fff)',
          border: '3px solid var(--ink, #000)',
          margin: '1rem',
          maxWidth: '600px'
        }}>
          <h2 style={{ 
            textTransform: 'uppercase', 
            borderBottom: '2px solid var(--ink, #000)',
            paddingBottom: '0.5rem',
            margin: '0 0 1rem 0',
            fontSize: '1rem',
            letterSpacing: '0.05em'
          }}>
            ⚠️ DISPLAY ERROR
          </h2>
          
          <p style={{ marginTop: '1rem', lineHeight: 1.5 }}>
            A display error occurred. <strong>Your data is safe</strong> — 
            this is a visualization issue only.
          </p>

          <div style={{ marginTop: '1.5rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <button 
              onClick={this.handleReset}
              style={{
                padding: '0.5rem 1rem',
                background: 'var(--paper, #fff)',
                border: '2px solid var(--ink, #000)',
                cursor: 'pointer',
                fontFamily: 'inherit',
                fontSize: '0.85rem',
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}
            >
              Try Again
            </button>
            <button 
              onClick={this.handleReload}
              style={{
                padding: '0.5rem 1rem',
                background: 'var(--ink, #000)',
                color: 'var(--paper, #fff)',
                border: '2px solid var(--ink, #000)',
                cursor: 'pointer',
                fontFamily: 'inherit',
                fontSize: '0.85rem',
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}
            >
              Reload App
            </button>
          </div>
          
          {import.meta.env.DEV && this.state.error && (
            <details style={{ marginTop: '1.5rem', fontSize: '0.75rem' }}>
              <summary style={{ cursor: 'pointer', textTransform: 'uppercase' }}>
                Technical Details (Dev Only)
              </summary>
              <pre style={{ 
                overflow: 'auto', 
                background: '#f5f5f5', 
                padding: '1rem',
                marginTop: '0.5rem',
                border: '1px solid #ccc',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word'
              }}>
                {this.state.error.toString()}
                {'\n\nComponent Stack:'}
                {this.state.errorInfo?.componentStack}
              </pre>
            </details>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
