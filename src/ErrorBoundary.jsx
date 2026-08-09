import React from 'react';
export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  render() {
    if (this.state.hasError) {
      return <div style={{color:'red', background:'black', padding: 20, zIndex: 99999, position: 'absolute', top: 0, left: 0, right: 0, bottom: 0}}>
        <h1>Something went wrong.</h1>
        <pre>{this.state.error.stack}</pre>
      </div>;
    }
    return this.props.children;
  }
}
