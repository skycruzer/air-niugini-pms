'use client';

import { useEffect } from 'react';
import { AlertCircle, RefreshCw, Home, Mail, FileText } from 'lucide-react';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function Error({ error, reset }: ErrorProps) {
  useEffect(() => {
    // Log the error to console in development
    console.error('Global error page:', error);

    // TODO: Log to error tracking service in production
    // Example: Sentry.captureException(error, { tags: { page: 'global' } })
  }, [error]);

  const handleReportIssue = () => {
    const subject = encodeURIComponent('Air Niugini PMS - Error Report');
    const body = encodeURIComponent(
      `Error Report\n\n` +
        `Message: ${error.message}\n` +
        `Digest: ${error.digest || 'N/A'}\n` +
        `Time: ${new Date().toISOString()}\n` +
        `Page: ${window.location.href}\n` +
        `User Agent: ${navigator.userAgent}\n\n` +
        `Stack Trace:\n${error.stack || 'Not available'}`
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
            <div className="bg-[#4F46E5] p-8">
              <div className="flex items-center justify-center mb-4">
                <div className="bg-white/10 backdrop-blur-sm rounded-full p-4">
                  <AlertCircle className="w-16 h-16 text-white" />
                </div>
              </div>
              <h1 className="text-4xl font-bold text-white text-center mb-2">Application Error</h1>
              <p className="text-white/90 text-center">
                We&apos;re sorry, but something unexpected happened
              </p>
            </div>

            {/* Error Content */}
            <div className="p-8 space-y-6">
              {/* Error Message */}
              <div className="bg-red-50 border-l-4 border-[#4F46E5] p-4 rounded-r">
                <div className="flex items-start">
                  <AlertCircle className="w-5 h-5 text-[#4F46E5] mt-0.5 mr-3 flex-shrink-0" />
                  <div className="flex-1">
                    <h3 className="text-sm font-semibold text-[#4F46E5] mb-1">Error Details</h3>
                    <p className="text-sm text-neutral-700 break-words">
                      {error.message || 'An unexpected error occurred'}
                    </p>
                    {error.digest && (
                      <p className="text-xs text-neutral-500 mt-2 font-mono">
                        Error ID: {error.digest}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Helpful Information */}
              <div className="bg-neutral-50 rounded-lg p-5">
                <h3 className="text-base font-semibold text-neutral-900 mb-3 flex items-center">
                  <FileText className="w-5 h-5 mr-2 text-[#4F46E5]" />
                  What to do next:
                </h3>
                <ul className="space-y-2.5 text-sm text-neutral-700">
                  <li className="flex items-start">
                    <span className="inline-block w-6 h-6 rounded-full bg-[#06B6D4] text-black text-xs font-bold flex items-center justify-center mr-3 flex-shrink-0 mt-0.5">
                      1
                    </span>
                    <span>Try refreshing the page to see if the issue resolves itself</span>
                  </li>
                  <li className="flex items-start">
                    <span className="inline-block w-6 h-6 rounded-full bg-[#06B6D4] text-black text-xs font-bold flex items-center justify-center mr-3 flex-shrink-0 mt-0.5">
                      2
                    </span>
                    <span>Return to the dashboard and navigate back to what you were doing</span>
                  </li>
                  <li className="flex items-start">
                    <span className="inline-block w-6 h-6 rounded-full bg-[#06B6D4] text-black text-xs font-bold flex items-center justify-center mr-3 flex-shrink-0 mt-0.5">
                      3
                    </span>
                    <span>If the problem persists, report this issue to IT Support</span>
                  </li>
                  <li className="flex items-start">
                    <span className="inline-block w-6 h-6 rounded-full bg-[#06B6D4] text-black text-xs font-bold flex items-center justify-center mr-3 flex-shrink-0 mt-0.5">
                      4
                    </span>
                    <span>Check your internet connection and try again</span>
                  </li>
                </ul>
              </div>

              {/* Primary Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <button
                  onClick={reset}
                  className="flex-1 flex items-center justify-center gap-2 bg-[#4F46E5] hover:bg-[#4338CA] text-white px-6 py-3.5 rounded-lg font-semibold transition-all duration-200 shadow-md hover:shadow-lg active:scale-95"
                >
                  <RefreshCw className="w-5 h-5" />
                  Try Again
                </button>
                <button
                  onClick={handleGoHome}
                  className="flex-1 flex items-center justify-center gap-2 bg-neutral-800 hover:bg-black text-white px-6 py-3.5 rounded-lg font-semibold transition-all duration-200 shadow-md hover:shadow-lg active:scale-95"
                >
                  <Home className="w-5 h-5" />
                  Go to Dashboard
                </button>
              </div>

              {/* Report Issue Button */}
              <div className="pt-4 border-t border-neutral-200">
                <button
                  onClick={handleReportIssue}
                  className="w-full flex items-center justify-center gap-2 bg-white hover:bg-neutral-50 text-neutral-800 px-6 py-3.5 rounded-lg font-medium border-2 border-neutral-300 hover:border-[#4F46E5] transition-all duration-200 active:scale-95"
                >
                  <Mail className="w-5 h-5" />
                  Report Issue to IT Support
                </button>
              </div>

              {/* Support Contact Information */}
              <div className="bg-gradient-to-r from-neutral-100 to-neutral-50 rounded-lg p-4 border border-neutral-200">
                <p className="text-xs text-neutral-600 text-center">
                  Need immediate assistance? Contact IT Support at{' '}
                  <a
                    href="mailto:support@airniugini.com.pg"
                    className="text-[#4F46E5] hover:underline font-semibold"
                  >
                    support@airniugini.com.pg
                  </a>
                </p>
              </div>

              {/* Technical Details (Development Only) */}
              {process.env.NODE_ENV === 'development' && (
                <details className="mt-6">
                  <summary className="text-sm font-semibold text-neutral-700 cursor-pointer hover:text-[#4F46E5] transition-colors py-2">
                    Technical Details (Development Only)
                  </summary>
                  <div className="mt-3 space-y-2">
                    <div className="bg-neutral-900 text-green-400 p-4 rounded-lg">
                      <p className="text-xs font-semibold mb-2 text-green-300">Error Message:</p>
                      <pre className="text-xs overflow-x-auto">{error.message}</pre>
                    </div>
                    {error.stack && (
                      <div className="bg-neutral-900 text-green-400 p-4 rounded-lg">
                        <p className="text-xs font-semibold mb-2 text-green-300">Stack Trace:</p>
                        <pre className="text-xs overflow-x-auto">{error.stack}</pre>
                      </div>
                    )}
                  </div>
                </details>
              )}
            </div>

            {/* Air Niugini Footer */}
            <div className="bg-gradient-to-r from-neutral-100 to-neutral-50 px-8 py-4 border-t border-neutral-200">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-xs">
                <p className="text-neutral-600">Air Niugini B767 Pilot Management System</p>
                <p className="text-[#4F46E5] font-bold">Papua New Guinea&apos;s National Airline</p>
              </div>
            </div>
          </div>
    </div>
  );
}
