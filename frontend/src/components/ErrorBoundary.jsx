import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('CampusResolve Error Boundary caught an error:', error, errorInfo);
  }

  handleReset = () => {
    try {
      localStorage.removeItem('ccms_user');
      localStorage.removeItem('ccms_token');
    } catch {}
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px',
          backgroundColor: '#0f172a',
          color: '#f8fafc',
          fontFamily: "'Plus Jakarta Sans', system-ui, -apple-system, sans-serif"
        }}>
          <div style={{
            maxWidth: '480px',
            width: '100%',
            backgroundColor: '#1e293b',
            border: '1px solid #334155',
            borderRadius: '16px',
            padding: '32px 24px',
            textAlign: 'center',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)'
          }}>
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              backgroundColor: 'rgba(239, 68, 68, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
              color: '#ef4444'
            }}>
              <AlertTriangle size={28} />
            </div>

            <h2 style={{ fontSize: '1.25rem', fontWeight: '800', marginBottom: '8px' }}>
              Something went wrong
            </h2>

            <p style={{ fontSize: '0.875rem', color: '#94a3b8', marginBottom: '24px', lineHeight: '1.5' }}>
              CampusResolve encountered an unexpected issue. Click below to reload the app.
            </p>

            <button
              onClick={this.handleReset}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                width: '100%',
                padding: '12px 20px',
                backgroundColor: '#4f46e5',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                fontWeight: '700',
                fontSize: '0.9rem',
                cursor: 'pointer',
                transition: 'background-color 0.2s'
              }}
            >
              <RefreshCw size={16} /> Reload CampusResolve
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
