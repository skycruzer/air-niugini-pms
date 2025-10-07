'use client';

import React from 'react';
import { ErrorBoundary as ReactErrorBoundary, FallbackProps } from 'react-error-boundary';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface SectionErrorFallbackProps extends FallbackProps {
  sectionName?: string;
}

function SectionErrorFallback({
  error,
  resetErrorBoundary,
  sectionName = 'Section',
}: SectionErrorFallbackProps) {
  console.error(`${sectionName} error:`, error);

  return (
    <div className="w-full bg-red-50 border-2 border-red-200 rounded-lg p-6 my-4">
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0">
          <div className="bg-[#E4002B]/10 rounded-full p-3">
            <AlertTriangle className="w-6 h-6 text-[#E4002B]" />
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold text-[#E4002B] mb-1">{sectionName} Error</h3>
          <p className="text-sm text-neutral-700 mb-4">
            We encountered a problem loading this section. This won't affect other parts of the
            application.
          </p>

          {/* Error Message */}
          <div className="bg-white rounded-md p-3 mb-4 border border-red-200">
            <p className="text-xs font-mono text-neutral-800 break-all">
              {error.message || 'An unexpected error occurred'}
            </p>
          </div>

          {/* Action Button */}
          <button
            onClick={resetErrorBoundary}
            className="inline-flex items-center gap-2 bg-[#E4002B] hover:bg-[#C00020] text-white px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200 shadow-sm hover:shadow-md"
          >
            <RefreshCw className="w-4 h-4" />
            Retry Loading {sectionName}
          </button>

          {/* Development Details */}
          {process.env.NODE_ENV === 'development' && error.stack && (
            <details className="mt-4">
              <summary className="text-xs font-semibold text-neutral-600 cursor-pointer hover:text-[#E4002B]">
                Stack Trace (Development)
              </summary>
              <pre className="mt-2 p-3 bg-neutral-900 text-green-400 text-xs rounded overflow-x-auto">
                <code>{error.stack}</code>
              </pre>
            </details>
          )}
        </div>
      </div>
    </div>
  );
}

interface SectionErrorBoundaryProps {
  children: React.ReactNode;
  sectionName?: string;
  fallback?: React.ReactNode;
  onReset?: () => void;
}

export function SectionErrorBoundary({
  children,
  sectionName = 'Section',
  fallback,
  onReset,
}: SectionErrorBoundaryProps) {
  const handleReset = () => {
    if (onReset) {
      onReset();
    }
  };

  // If custom fallback is provided, use it
  if (fallback) {
    return (
      <ReactErrorBoundary
        fallbackRender={() => <>{fallback}</>}
        onReset={handleReset}
        onError={(error) => {
          console.error(`SectionErrorBoundary (${sectionName}):`, error);
        }}
      >
        {children}
      </ReactErrorBoundary>
    );
  }

  // Otherwise use the default section error fallback
  return (
    <ReactErrorBoundary
      fallbackRender={(props) => <SectionErrorFallback {...props} sectionName={sectionName} />}
      onReset={handleReset}
      onError={(error, errorInfo) => {
        if (process.env.NODE_ENV === 'development') {
          console.error(`SectionErrorBoundary (${sectionName}):`, error);
          console.error('Component stack:', errorInfo.componentStack);
        }

        // TODO: Send to error tracking service with section context
        // Example: Sentry.captureException(error, {
        //   tags: { section: sectionName },
        //   extra: errorInfo
        // })
      }}
    >
      {children}
    </ReactErrorBoundary>
  );
}

export default SectionErrorBoundary;
