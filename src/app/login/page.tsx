'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { Shield, Mail, Lock, Eye, EyeOff, AlertTriangle } from 'lucide-react';
import BackgroundElements from './components/BackgroundElements';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const success = await login(email, password);
      if (success) {
        router.push('/dashboard');
      } else {
        setError('Invalid email or password. Please check your credentials.');
      }
    } catch {
      setError('An error occurred during login');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 overflow-hidden">
      {/* Background Elements - Dynamically loaded */}
      <BackgroundElements />

      {/* Header */}
      <header className="relative z-10">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Link href="/" className="btn btn-ghost text-white hover:bg-white/10 border-white/20">
                ← Back to Home
              </Link>
            </div>
            <div className="flex items-center text-white group">
              <div className="relative mr-4">
                {/* Enhanced glow effects */}
                <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full blur-lg opacity-50 group-hover:opacity-75 transition-opacity" />
                <div className="absolute inset-0 bg-air-niugini-gold rounded-full blur-md opacity-40 group-hover:opacity-60 transition-opacity" />

                {/* Logo container */}
                <div className="relative bg-gradient-to-br from-white/15 to-white/5 backdrop-blur-md rounded-xl p-3 border-2 border-white/25 shadow-xl group-hover:scale-105 transition-transform duration-300">
                  <div className="absolute inset-0 bg-gradient-to-br from-air-niugini-gold/10 to-transparent rounded-xl" />
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
                  <Shield className="w-4 h-4 mr-2" />
                  Secure Access Portal
                </div>
                <h2
                  className="text-display-medium font-black mb-4 text-white"
                  style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.8)' }}
                >
                  Welcome Back
                </h2>
                <p
                  className="text-body-large text-white leading-relaxed max-w-lg font-medium"
                  style={{ textShadow: '1px 1px 3px rgba(0,0,0,0.7)' }}
                >
                  Access your professional pilot management dashboard with secure authentication.
                  Manage certifications, leave requests, and fleet compliance with confidence.
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
                    Real-time certification tracking
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
                    Intelligent roster management
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
                    Comprehensive compliance monitoring
                  </span>
                </div>
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
                  <h3 className="text-heading-large text-gray-900 mb-2">Secure Sign In</h3>
                  <p className="text-body-medium text-gray-600">
                    Enter your credentials to access the dashboard
                  </p>
                </div>

                {/* Error Message */}
                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 flex items-start">
                    <AlertTriangle className="text-red-500 w-5 h-5 mr-3 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-red-800">Authentication Error</p>
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
                        Authenticating...
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
                <div className="mt-8 pt-6 border-t border-gray-200 text-center">
                  <p className="text-xs text-gray-400">Powered by PIN Modern Technology</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
