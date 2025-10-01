import Link from 'next/link';
import { Home, Search, ArrowLeft, FileQuestion } from 'lucide-react';

export default function NotFound() {
  return (
    <html>
      <body>
        <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-neutral-100 flex items-center justify-center p-4">
          <div className="max-w-2xl w-full bg-white rounded-xl shadow-2xl overflow-hidden">
            {/* Air Niugini Red Header */}
            <div className="bg-[#E4002B] p-8">
              <div className="flex items-center justify-center mb-4">
                <div className="bg-white/10 backdrop-blur-sm rounded-full p-4">
                  <FileQuestion className="w-16 h-16 text-white" />
                </div>
              </div>
              <h1 className="text-4xl font-bold text-white text-center mb-2">
                404 - Page Not Found
              </h1>
              <p className="text-white/90 text-center">The page you're looking for doesn't exist</p>
            </div>

            {/* Content */}
            <div className="p-8 space-y-6">
              {/* Gold Accent Box */}
              <div className="bg-[#FFC72C]/10 border-l-4 border-[#FFC72C] p-5 rounded-r">
                <h3 className="text-base font-semibold text-neutral-900 mb-2">What happened?</h3>
                <p className="text-sm text-neutral-700">
                  The page you requested could not be found. This could be because:
                </p>
                <ul className="mt-3 space-y-2 text-sm text-neutral-700">
                  <li className="flex items-start">
                    <span className="text-[#FFC72C] mr-2">•</span>
                    <span>The URL was typed incorrectly</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-[#FFC72C] mr-2">•</span>
                    <span>The page has been moved or deleted</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-[#FFC72C] mr-2">•</span>
                    <span>You followed an outdated link</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-[#FFC72C] mr-2">•</span>
                    <span>You don't have permission to access this page</span>
                  </li>
                </ul>
              </div>

              {/* Quick Navigation */}
              <div className="bg-neutral-50 rounded-lg p-5">
                <h3 className="text-base font-semibold text-neutral-900 mb-3">Quick Navigation:</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Link
                    href="/dashboard"
                    className="flex items-center gap-3 p-3 bg-white rounded-lg border border-neutral-200 hover:border-[#E4002B] hover:shadow-md transition-all duration-200 group"
                  >
                    <div className="bg-[#E4002B] group-hover:bg-[#C00020] p-2 rounded-lg transition-colors">
                      <Home className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-neutral-900">Dashboard</p>
                      <p className="text-xs text-neutral-600">Main dashboard</p>
                    </div>
                  </Link>

                  <Link
                    href="/dashboard/pilots"
                    className="flex items-center gap-3 p-3 bg-white rounded-lg border border-neutral-200 hover:border-[#E4002B] hover:shadow-md transition-all duration-200 group"
                  >
                    <div className="bg-neutral-800 group-hover:bg-black p-2 rounded-lg transition-colors">
                      <Search className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-neutral-900">Pilots</p>
                      <p className="text-xs text-neutral-600">View all pilots</p>
                    </div>
                  </Link>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <Link
                  href="/dashboard"
                  className="flex-1 flex items-center justify-center gap-2 bg-[#E4002B] hover:bg-[#C00020] text-white px-6 py-3.5 rounded-lg font-semibold transition-all duration-200 shadow-md hover:shadow-lg active:scale-95"
                >
                  <Home className="w-5 h-5" />
                  Go to Dashboard
                </Link>
                <button
                  onClick={() => window.history.back()}
                  className="flex-1 flex items-center justify-center gap-2 bg-neutral-800 hover:bg-black text-white px-6 py-3.5 rounded-lg font-semibold transition-all duration-200 shadow-md hover:shadow-lg active:scale-95"
                >
                  <ArrowLeft className="w-5 h-5" />
                  Go Back
                </button>
              </div>

              {/* Support Contact */}
              <div className="bg-gradient-to-r from-neutral-100 to-neutral-50 rounded-lg p-4 border border-neutral-200">
                <p className="text-xs text-neutral-600 text-center">
                  Still can't find what you're looking for?{' '}
                  <a
                    href="mailto:support@airniugini.com.pg"
                    className="text-[#E4002B] hover:underline font-semibold"
                  >
                    Contact IT Support
                  </a>
                </p>
              </div>
            </div>

            {/* Air Niugini Footer */}
            <div className="bg-gradient-to-r from-neutral-100 to-neutral-50 px-8 py-4 border-t border-neutral-200">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-xs">
                <p className="text-neutral-600">Air Niugini B767 Pilot Management System</p>
                <p className="text-[#E4002B] font-bold">Papua New Guinea's National Airline</p>
              </div>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
