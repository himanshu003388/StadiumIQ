import React from 'react';

const isDev = import.meta.env.DEV;

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(_error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Only store sensitive details; never log to external service in client code
    if (isDev) {
      this.setState({ error, errorInfo });
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          role="alert"
          aria-live="assertive"
          style={{
            padding: '20px',
            background: '#fee2e2',
            color: '#991b1b',
            borderRadius: '8px',
            margin: '20px',
          }}
        >
          <h2>Something went wrong in this component.</h2>
          <p style={{ fontSize: '14px', marginTop: '6px' }}>
            Please refresh the page or contact support if the issue persists.
          </p>
          {isDev && this.state.error && (
            <details style={{ whiteSpace: 'pre-wrap', marginTop: '10px', fontSize: '12px' }}>
              <summary>Developer details (hidden in production)</summary>
              {this.state.error.toString()}
              <br />
              {this.state.errorInfo?.componentStack}
            </details>
          )}
        </div>
      );
    }
    return this.props.children;
  }
}
