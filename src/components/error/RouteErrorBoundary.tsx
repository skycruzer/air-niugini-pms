'use client';

/**
 * @fileoverview Route-level Error Boundary
 * Lighter error boundary for individual routes/sections
 */

import React, { Component, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: (error: Error, reset: () => void) => ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class RouteErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Route Error Boundary caught an error:', error, errorInfo);

    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
    });
  };

  render() {
    if (this.state.hasError && this.state.error) {
      if (this.props.fallback) {
        return this.props.fallback(this.state.error, this.handleReset);
      }

      return (
        <div className="p-6 bg-red-50 border-2 border-red-200 rounded-lg">
          <div className="flex items-start gap-4">
            <span className="text-3xl">⚠️</span>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Error Loading Section
              </h3>
              <p className="text-gray-600 mb-4">
                {this.state.error.message || 'An unexpected error occurred'}
              </p>
              <button
                onClick={this.handleReset}
                className="px-4 py-2 bg-[#E4002B] text-white rounded hover:bg-[#C00020] transition-colors text-sm font-medium"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
