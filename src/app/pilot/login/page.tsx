'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Shield, Mail, Lock, Eye, EyeOff, AlertTriangle, UserPlus, Plane } from 'lucide-react';
import BackgroundElements from '@/app/login/components/BackgroundElements';
import { pilotAuthService } from '@/lib/pilot-auth-utils';

export default function PilotLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const user = await pilotAuthService.login(email, password);

      if (user) {
        console.log('✅ Pilot login successful, redirecting to dashboard...');
        router.push('/pilot/dashboard');
      } else {
        setError('Invalid email or password. Please check your credentials.');
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An error occurred during login. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 overflow-hidden">
      {/* Background Elements */}
      <BackgroundElements />

      {/* Header */}
      <header className="relative z-10">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link
                href="/"
                className="btn btn-ghost text-white hover:bg-white/10 border-white/20"
              >
                ← Back to Home
              </Link>
              <Link
                href="/pilot/register"
                className="btn btn-ghost text-white hover:bg-white/10 border-white/20"
              >
                <UserPlus className="w-4 h-4 mr-2" />
                Register
              </Link>
            </div>
            <div className="flex items-center text-white group">
              <div className="relative mr-4">
                {/* Enhanced glow effects */}
                <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full blur-lg opacity-50 group-hover:opacity-75 transition-opacity" />
                <div className="absolute inset-0 bg-[#06B6D4] rounded-full blur-md opacity-40 group-hover:opacity-60 transition-opacity" />

                {/* Logo container */}
                <div className="relative bg-gradient-to-br from-white/15 to-white/5 backdrop-blur-md rounded-xl p-3 border-2 border-white/25 shadow-xl group-hover:scale-105 transition-transform duration-300">
                  <div className="absolute inset-0 bg-gradient-to-br from-[#06B6D4]/10 to-transparent rounded-xl" />
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/images/air-niugini-logo.jpg"
                    alt="Air Niugini Logo"
                    width="40"
                    height="40"
                    className="relative w-10 h-10 object-contain drop-shadow-xl"
                    loading="eager"
                  />
                </div>
              </div>
              <div className="text-right">
                <h1 className="text-xl font-bold drop-shadow-lg">Air Niugini</h1>
                <p className="text-xs text-blue-100 drop-shadow-md">B767 Fleet Operations</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Login Section */}
      <main className="relative z-10 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-5xl">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left Side - Branding & Info */}
            <div className="text-center lg:text-left animate-fade-in">
              <div className="mb-8">
                <div className="inline-flex items-center bg-white px-4 py-2 rounded-full text-sm font-bold mb-6 text-gray-900 shadow-lg">
                  <Plane className="w-4 h-4 mr-2" />
                  Pilot Portal
                </div>
                <h2
                  className="text-display-medium font-black mb-4 text-white"
                  style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.8)' }}
                >
                  Welcome Pilots
                </h2>
                <p
                  className="text-body-large text-white leading-relaxed max-w-lg font-medium"
                  style={{ textShadow: '1px 1px 3px rgba(0,0,0,0.7)' }}
                >
                  Access your pilot dashboard to manage leave requests, share feedback, and stay
                  connected with B767 fleet operations.
                </p>
              </div>

              {/* Air Niugini 50th Anniversary */}
              <div className="mb-8 flex justify-center lg:justify-start">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/images/air-niugini-50th-anniversary.jpg"
                  alt="Air Niugini 50 Years - 1973-2023"
                  width="672"
                  height="245"
                  className="w-full max-w-md rounded-2xl shadow-2xl object-cover h-48"
                  loading="eager"
                />
              </div>

              {/* Features Highlight */}
              <div className="space-y-4 mb-8">
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center mr-4 shadow-lg">
                    <span className="text-green-600">✅</span>
                  </div>
                  <span
                    className="text-white font-medium"
                    style={{ textShadow: '1px 1px 3px rgba(0,0,0,0.7)' }}
                  >
                    Submit and track leave requests
                  </span>
                </div>
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center mr-4 shadow-lg">
                    <span className="text-blue-600">✅</span>
                  </div>
                  <span
                    className="text-white font-medium"
                    style={{ textShadow: '1px 1px 3px rgba(0,0,0,0.7)' }}
                  >
                    Share feedback and suggestions
                  </span>
                </div>
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center mr-4 shadow-lg">
                    <span className="text-purple-600">✅</span>
                  </div>
                  <span
                    className="text-white font-medium"
                    style={{ textShadow: '1px 1px 3px rgba(0,0,0,0.7)' }}
                  >
                    Real-time notifications
                  </span>
                </div>
              </div>

              {/* Registration CTA */}
              <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-4">
                <p className="text-sm text-white/90 mb-3">Don't have a pilot account yet?</p>
                <Link
                  href="/pilot/register"
                  className="btn btn-ghost text-white hover:bg-white/10 border-white/20 w-full"
                >
                  <UserPlus className="w-4 h-4 mr-2" />
                  Register New Account
                </Link>
              </div>
            </div>

            {/* Right Side - Login Form */}
            <div className="animate-slide-in-right">
              <div className="card-premium bg-white/95 backdrop-blur-md border border-white/20 shadow-2xl">
                <div className="text-center mb-8">
                  <div className="relative mb-6">
                    <div className="absolute inset-0 bg-blue-600/20 rounded-2xl blur-lg" />
                    <div className="relative w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto">
                      <Shield className="text-white w-8 h-8" />
                    </div>
                  </div>
                  <h3 className="text-heading-large text-gray-900 mb-2">Pilot Sign In</h3>
                  <p className="text-body-medium text-gray-600">
                    Enter your credentials to access your dashboard
                  </p>
                </div>

                {/* Error Message */}
                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 flex items-start">
                    <AlertTriangle className="text-red-500 w-5 h-5 mr-3 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-red-800">Login Error</p>
                      <p className="text-red-700 text-sm mt-1">{error}</p>
                    </div>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Email Field */}
                  <div>
                    <label className="form-label">Email Address</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Mail className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="form-input pl-12"
                        placeholder="your.email@airniugini.com"
                      />
                    </div>
                  </div>

                  {/* Password Field */}
                  <div>
                    <label className="form-label">Password</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Lock className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="form-input pl-12 pr-12"
                        placeholder="Enter your password"
                      />
                      <button
                        type="button"
                        className="absolute inset-y-0 right-0 pr-4 flex items-center"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                        ) : (
                          <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Login Button */}
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="btn btn-primary w-full btn-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? (
                      <>
                        <div className="loading-spinner-lg mr-3" />
                        Signing In...
                      </>
                    ) : (
                      <>
                        <Shield className="w-5 h-5 mr-2 inline" />
                        Sign In to Dashboard
                      </>
                    )}
                  </button>
                </form>

                {/* Footer */}
                <div className="mt-8 pt-6 border-t border-gray-200 text-center space-y-3">
                  <p className="text-sm text-gray-600">
                    Don't have an account?{' '}
                    <Link
                      href="/pilot/register"
                      className="text-blue-600 hover:text-blue-700 font-semibold"
                    >
                      Register here
                    </Link>
                  </p>
                  <p className="text-xs text-gray-400">
                    Admin access?{' '}
                    <Link href="/login" className="text-gray-500 hover:text-gray-700">
                      Admin Login
                    </Link>
                  </p>
                  <p className="text-xs text-gray-400 mt-4">Powered by PIN Modern Technology</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
