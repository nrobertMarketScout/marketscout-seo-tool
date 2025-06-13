// frontend/src/components/ErrorBoundary.jsx
import React from 'react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError (error) {
    return { hasError: true, error };
  }

  componentDidCatch (error, info) {
    console.error('ErrorBoundary caught an error:', error, info);
  }

  render () {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center h-full p-6">
          <div className="bg-red-100 border border-red-400 text-red-700 px-6 py-4 rounded-lg max-w-md">
            <strong className="block mb-2">Oops—something went wrong.</strong>
            <pre className="text-xs whitespace-pre-wrap">{this.state.error.toString()}</pre>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
