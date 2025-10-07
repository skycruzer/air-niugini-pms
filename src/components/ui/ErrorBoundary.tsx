'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  componentName?: string;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

/**
 * Error Boundary component for catching React errors
 * Prevents entire app crashes and provides graceful fallback UI
 *
 * Usage:
 * <ErrorBoundary componentName="Dashboard">
 *   <DashboardSkeleton />
 * </ErrorBoundary>
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log error to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('[ErrorBoundary] Component error:', error);
      console.error('[ErrorBoundary] Error info:', errorInfo);
    }

    // Call optional error handler
    this.props.onError?.(error, errorInfo);

    // Update state with error info
    this.setState({ errorInfo });
  }

  handleReset = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  handleReload = (): void => {
    window.location.reload();
  };

  handleHome = (): void => {
    window.location.href = '/dashboard';
  };

  render(): ReactNode {
    const { hasError, error, errorInfo } = this.state;
    const { children, fallback, componentName } = this.props;

    if (hasError) {
      // Custom fallback provided
      if (fallback) {
        return fallback;
      }

      // Default error UI
      return (
        <div className="min-h-[400px] flex items-center justify-center p-6">
          <div className="max-w-2xl w-full bg-white rounded-xl shadow-2xl overflow-hidden border-2 border-red-200">
            {/* Air Niugini Red Header */}
            <div className="bg-gradient-to-r from-red-500 to-red-600 p-6">
              <div className="flex items-center justify-center mb-3">
                <div className="bg-white/10 backdrop-blur-sm rounded-full p-3">
                  <AlertTriangle className="w-12 h-12 text-white" />
                </div>
              </div>
              <h2 className="text-2xl font-bold text-white text-center mb-2">
                {componentName ? `${componentName} Error` : 'Component Error'}
              </h2>
              <p className="text-white/90 text-center text-sm">
                Something went wrong while loading this component
              </p>
            </div>

            {/* Error Details */}
            <div className="p-6 space-y-4">
              {/* Error Message */}
              <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-r">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <AlertTriangle className="w-5 h-5 text-red-600" />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-semibold text-red-800 mb-1">Error Details</h3>
                    <p className="text-sm text-red-700">
                      {error?.message || 'An unexpected error occurred'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Development-only stack trace */}
              {process.env.NODE_ENV === 'development' && errorInfo && (
                <details className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <summary className="cursor-pointer text-sm font-medium text-gray-700 hover:text-gray-900">
                    Component Stack Trace (Development Only)
                  </summary>
                  <pre className="mt-3 text-xs text-gray-600 overflow-auto max-h-48 font-mono bg-white p-3 rounded border border-gray-200">
                    {errorInfo.componentStack}
                  </pre>
                </details>
              )}

              {/* Troubleshooting Steps */}
              <div className="bg-blue-50 rounded-lg p-4">
                <h4 className="text-sm font-semibold text-blue-900 mb-2">Suggested Actions:</h4>
                <ul className="space-y-2 text-sm text-blue-800">
                  <li className="flex items-start">
                    <span className="inline-block w-5 h-5 rounded-full bg-blue-500 text-white text-xs font-bold flex items-center justify-center mr-2 flex-shrink-0 mt-0.5">
                      1
                    </span>
                    <span>Try refreshing the page to reload the component</span>
                  </li>
                  <li className="flex items-start">
                    <span className="inline-block w-5 h-5 rounded-full bg-blue-500 text-white text-xs font-bold flex items-center justify-center mr-2 flex-shrink-0 mt-0.5">
                      2
                    </span>
                    <span>Return to the dashboard and try again</span>
                  </li>
                  <li className="flex items-start">
                    <span className="inline-block w-5 h-5 rounded-full bg-blue-500 text-white text-xs font-bold flex items-center justify-center mr-2 flex-shrink-0 mt-0.5">
                      3
                    </span>
                    <span>If the problem persists, contact IT support</span>
                  </li>
                </ul>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <button
                  onClick={this.handleReset}
                  className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-200 shadow-md hover:shadow-lg active:scale-95"
                >
                  <RefreshCw className="w-5 h-5" />
                  Try Again
                </button>
                <button
                  onClick={this.handleReload}
                  className="flex-1 flex items-center justify-center gap-2 bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-200 shadow-md hover:shadow-lg active:scale-95"
                >
                  <RefreshCw className="w-5 h-5" />
                  Reload Page
                </button>
                <button
                  onClick={this.handleHome}
                  className="flex-1 flex items-center justify-center gap-2 bg-[#E4002B] hover:bg-[#C00020] text-white px-6 py-3 rounded-lg font-semibold transition-all duration-200 shadow-md hover:shadow-lg active:scale-95"
                >
                  <Home className="w-5 h-5" />
                  Dashboard
                </button>
              </div>

              {/* Support Contact */}
              <div className="bg-gradient-to-r from-gray-100 to-gray-50 rounded-lg p-4 border border-gray-200">
                <p className="text-xs text-gray-600 text-center">
                  Need help?{' '}
                  <a
                    href="mailto:support@airniugini.com.pg"
                    className="text-[#E4002B] hover:underline font-semibold"
                  >
                    Contact IT Support
                  </a>
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="bg-gradient-to-r from-gray-100 to-gray-50 px-6 py-4 border-t border-gray-200">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-xs">
                <p className="text-gray-600">Air Niugini B767 Pilot Management System</p>
                <p className="text-[#E4002B] font-bold">Error Boundary Protection Active</p>
              </div>
            </div>
          </div>
        </div>
      );
    }

    // No error, render children normally
    return children;
  }
}

/**
 * Functional wrapper for ErrorBoundary (for easier use with hooks)
 */
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<ErrorBoundaryProps, 'children'>
) {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name || 'Component'})`;

  return WrappedComponent;
}
