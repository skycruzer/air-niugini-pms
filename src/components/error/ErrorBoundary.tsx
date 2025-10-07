'use client';

import React from 'react';
import { ErrorBoundary as ReactErrorBoundary, FallbackProps } from 'react-error-boundary';
import { AlertCircle, RefreshCw, Home, Mail } from 'lucide-react';

function ErrorFallback({ error, resetErrorBoundary }: FallbackProps) {
  // Log error to console for debugging
  console.error('ErrorBoundary caught an error:', error);

  const handleReportIssue = () => {
    const subject = encodeURIComponent('Air Niugini PMS - Error Report');
    const body = encodeURIComponent(
      `Error Details:\n\nMessage: ${error.message}\n\nStack: ${error.stack}\n\nTime: ${new Date().toISOString()}\n\nUser Agent: ${navigator.userAgent}`
    );
    window.location.href = `mailto:support@airniugini.com.pg?subject=${subject}&body=${body}`;
  };

  const handleGoHome = () => {
    window.location.href = '/dashboard';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-neutral-100 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-white rounded-xl shadow-2xl overflow-hidden">
        {/* Air Niugini Red Header */}
        <div className="bg-[#E4002B] p-6">
          <div className="flex items-center justify-center mb-4">
            <div className="bg-white/10 backdrop-blur-sm rounded-full p-4">
              <AlertCircle className="w-12 h-12 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-white text-center mb-2">Something Went Wrong</h1>
          <p className="text-white/90 text-center text-sm">
            We apologize for the inconvenience. Our team has been notified.
          </p>
        </div>

        {/* Error Details */}
        <div className="p-8 space-y-6">
          {/* Error Message */}
          <div className="bg-red-50 border-l-4 border-[#E4002B] p-4 rounded-r">
            <div className="flex items-start">
              <AlertCircle className="w-5 h-5 text-[#E4002B] mt-0.5 mr-3 flex-shrink-0" />
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-[#E4002B] mb-1">Error Message</h3>
                <p className="text-sm text-neutral-700">
                  {error.message || 'An unexpected error occurred'}
                </p>
              </div>
            </div>
          </div>

          {/* Helpful Information */}
          <div className="bg-neutral-50 p-4 rounded-lg">
            <h3 className="text-sm font-semibold text-neutral-900 mb-2">What you can do:</h3>
            <ul className="space-y-2 text-sm text-neutral-700">
              <li className="flex items-start">
                <span className="text-[#FFC72C] mr-2">•</span>
                Try refreshing the page to see if the issue resolves
              </li>
              <li className="flex items-start">
                <span className="text-[#FFC72C] mr-2">•</span>
                Return to the dashboard and try your action again
              </li>
              <li className="flex items-start">
                <span className="text-[#FFC72C] mr-2">•</span>
                Report this issue to IT support if it persists
              </li>
              <li className="flex items-start">
                <span className="text-[#FFC72C] mr-2">•</span>
                Check your internet connection
              </li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <button
              onClick={resetErrorBoundary}
              className="flex-1 flex items-center justify-center gap-2 bg-[#E4002B] hover:bg-[#C00020] text-white px-6 py-3 rounded-lg font-semibold transition-colors duration-200 shadow-md hover:shadow-lg"
            >
              <RefreshCw className="w-5 h-5" />
              Try Again
            </button>
            <button
              onClick={handleGoHome}
              className="flex-1 flex items-center justify-center gap-2 bg-neutral-800 hover:bg-black text-white px-6 py-3 rounded-lg font-semibold transition-colors duration-200 shadow-md hover:shadow-lg"
            >
              <Home className="w-5 h-5" />
              Go to Dashboard
            </button>
          </div>

          <div className="pt-4 border-t border-neutral-200">
            <button
              onClick={handleReportIssue}
              className="w-full flex items-center justify-center gap-2 bg-white hover:bg-neutral-50 text-neutral-800 px-6 py-3 rounded-lg font-medium border-2 border-neutral-300 hover:border-[#E4002B] transition-all duration-200"
            >
              <Mail className="w-5 h-5" />
              Report Issue to IT Support
            </button>
          </div>

          {/* Technical Details (collapsed by default) */}
          {process.env.NODE_ENV === 'development' && (
            <details className="mt-6">
              <summary className="text-sm font-semibold text-neutral-700 cursor-pointer hover:text-[#E4002B] transition-colors">
                Technical Details (Development Only)
              </summary>
              <pre className="mt-3 p-4 bg-neutral-900 text-green-400 text-xs rounded-lg overflow-x-auto">
                <code>{error.stack}</code>
              </pre>
            </details>
          )}
        </div>

        {/* Air Niugini Footer */}
        <div className="bg-neutral-100 px-8 py-4 border-t border-neutral-200">
          <div className="flex items-center justify-between text-xs text-neutral-600">
            <p>Air Niugini Pilot Management System</p>
            <p className="text-[#E4002B] font-semibold">Papua New Guinea&apos;s National Airline</p>
          </div>
        </div>
      </div>
    </div>
  );
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  onReset?: () => void;
}

export function ErrorBoundary({ children, onReset }: ErrorBoundaryProps) {
  const handleReset = () => {
    // Clear any error state
    if (onReset) {
      onReset();
    }
    // Optionally reload the page
    window.location.reload();
  };

  return (
    <ReactErrorBoundary
      FallbackComponent={ErrorFallback}
      onReset={handleReset}
      onError={(error, errorInfo) => {
        // Log to console in development
        if (process.env.NODE_ENV === 'development') {
          console.error('Error caught by ErrorBoundary:', error);
          console.error('Component stack:', errorInfo.componentStack);
        }

        // TODO: Send to error tracking service (e.g., Sentry) in production
        // Example: Sentry.captureException(error, { extra: errorInfo })
      }}
    >
      {children}
    </ReactErrorBoundary>
  );
}

export default ErrorBoundary;
