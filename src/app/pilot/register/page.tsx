'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Shield,
  Mail,
  Lock,
  Eye,
  EyeOff,
  AlertTriangle,
  UserPlus,
  BadgeCheck,
  User,
  CheckCircle2,
} from 'lucide-react';
import BackgroundElements from '@/app/login/components/BackgroundElements';

// Form validation schema
const registrationSchema = z
  .object({
    employee_id: z
      .string()
      .min(1, 'Employee ID is required')
      .regex(/^[A-Z0-9-]+$/, 'Invalid Employee ID format (use uppercase letters, numbers, and hyphens)'),
    email: z.string().email('Invalid email address'),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        'Password must contain uppercase, lowercase, and number'
      ),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
    first_name: z.string().min(1, 'First name is required').max(100),
    last_name: z.string().min(1, 'Last name is required').max(100),
    rank: z.enum(['Captain', 'First Officer'], {
      errorMap: () => ({ message: 'Please select your rank' }),
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type RegistrationFormData = z.infer<typeof registrationSchema>;

export default function PilotRegisterPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [registrationSuccess, setRegistrationSuccess] = useState(false);
  const [isPendingApproval, setIsPendingApproval] = useState(false);
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
  } = useForm<RegistrationFormData>({
    resolver: zodResolver(registrationSchema),
  });

  const onSubmit = async (data: RegistrationFormData) => {
    setIsLoading(true);

    try {
      const response = await fetch('/api/pilot/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        // Check if this is a "pending approval" error
        if (result.error?.toLowerCase().includes('pending approval')) {
          // Show informational screen instead of error
          setIsPendingApproval(true);
          setIsLoading(false);

          // Redirect to pilot login after 8 seconds
          setTimeout(() => {
            router.push('/pilot/login');
          }, 8000);
          return;
        }

        // Show error message for other errors
        setError('root', {
          type: 'manual',
          message: result.error || 'Registration failed. Please try again.',
        });
        setIsLoading(false);
        return;
      }

      // Show success message
      setRegistrationSuccess(true);
      setIsLoading(false);

      // Redirect to pilot login after 5 seconds
      setTimeout(() => {
        router.push('/pilot/login');
      }, 5000);
    } catch (error) {
      console.error('Registration error:', error);
      setError('root', {
        type: 'manual',
        message: 'An unexpected error occurred. Please try again.',
      });
      setIsLoading(false);
    }
  };

  // Pending Approval Info Screen
  if (isPendingApproval) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 overflow-hidden">
        <BackgroundElements />

        <div className="relative z-10 flex items-center justify-center min-h-screen px-4">
          <div className="card-premium bg-white/95 backdrop-blur-md border border-white/20 shadow-2xl max-w-2xl w-full text-center">
            <div className="mb-8">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <BadgeCheck className="text-white w-10 h-10" />
              </div>
              <h2 className="text-heading-lg text-gray-900 mb-4">Registration Pending Approval</h2>
              <p className="text-body-lg text-gray-600 mb-6 leading-relaxed">
                Your pilot account registration for this Employee ID is already submitted and awaiting administrator approval.
              </p>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-8 text-left">
              <h3 className="font-semibold text-blue-900 mb-3 flex items-center">
                <Shield className="w-5 h-5 mr-2" />
                Current Status:
              </h3>
              <ol className="space-y-3 text-blue-800">
                <li className="flex items-start">
                  <span className="font-bold mr-3">✓</span>
                  <span>Registration submitted - Your application is in the queue</span>
                </li>
                <li className="flex items-start">
                  <span className="font-bold mr-3">⏳</span>
                  <span>Awaiting administrator review (typically within 24-48 hours)</span>
                </li>
                <li className="flex items-start">
                  <span className="font-bold mr-3">📧</span>
                  <span>You will receive an email notification once your account is approved</span>
                </li>
                <li className="flex items-start">
                  <span className="font-bold mr-3">🔐</span>
                  <span>After approval, you can login using the credentials you provided</span>
                </li>
              </ol>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-8">
              <p className="text-sm text-amber-800">
                <strong>Note:</strong> If you haven&apos;t verified your email address yet, please check your inbox and click the verification link.
              </p>
            </div>

            <div className="text-center">
              <p className="text-sm text-gray-600 mb-6">
                Redirecting to login page in 8 seconds...
              </p>
              <Link
                href="/pilot/login"
                className="btn btn-primary inline-flex items-center"
              >
                <Shield className="w-4 h-4 mr-2" />
                Go to Login Page
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Success screen
  if (registrationSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 overflow-hidden">
        <BackgroundElements />

        <div className="relative z-10 flex items-center justify-center min-h-screen px-4">
          <div className="card-premium bg-white/95 backdrop-blur-md border border-white/20 shadow-2xl max-w-2xl w-full text-center">
            <div className="mb-8">
              <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 className="text-white w-10 h-10" />
              </div>
              <h2 className="text-heading-lg text-gray-900 mb-4">Registration Submitted!</h2>
              <p className="text-body-lg text-gray-600 mb-6 leading-relaxed">
                Your pilot account registration has been submitted successfully.
              </p>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-8 text-left">
              <h3 className="font-semibold text-blue-900 mb-3 flex items-center">
                <BadgeCheck className="w-5 h-5 mr-2" />
                Next Steps:
              </h3>
              <ol className="space-y-3 text-blue-800">
                <li className="flex items-start">
                  <span className="font-bold mr-3">1.</span>
                  <span>Check your email inbox for a verification link</span>
                </li>
                <li className="flex items-start">
                  <span className="font-bold mr-3">2.</span>
                  <span>Verify your email address by clicking the link</span>
                </li>
                <li className="flex items-start">
                  <span className="font-bold mr-3">3.</span>
                  <span>
                    Wait for an administrator to approve your registration (typically within 24-48
                    hours)
                  </span>
                </li>
                <li className="flex items-start">
                  <span className="font-bold mr-3">4.</span>
                  <span>You will receive an email notification once approved</span>
                </li>
              </ol>
            </div>

            <div className="text-center">
              <p className="text-sm text-gray-600 mb-6">
                Redirecting to login page in 5 seconds...
              </p>
              <Link
                href="/pilot/login"
                className="btn btn-primary inline-flex items-center"
              >
                <Shield className="w-4 h-4 mr-2" />
                Go to Login Page
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Registration form
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 overflow-hidden">
      <BackgroundElements />

      {/* Header */}
      <header className="relative z-10">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <Link
              href="/"
              className="btn btn-ghost text-white hover:bg-white/10 border-white/20"
            >
              ← Back to Home
            </Link>
            <div className="flex items-center text-white group">
              <div className="relative mr-4">
                <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full blur-lg opacity-50 group-hover:opacity-75 transition-opacity" />
                <div className="absolute inset-0 bg-[#06B6D4] rounded-full blur-md opacity-40 group-hover:opacity-60 transition-opacity" />
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

      {/* Main Registration Section */}
      <main className="relative z-10 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-6xl">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-start">
            {/* Left Side - Branding & Info */}
            <div className="lg:col-span-2 text-center lg:text-left animate-fade-in">
              <div className="mb-8">
                <div className="inline-flex items-center bg-white px-4 py-2 rounded-full text-sm font-bold mb-6 text-gray-900 shadow-lg">
                  <UserPlus className="w-4 h-4 mr-2" />
                  Pilot Self-Service Portal
                </div>
                <h2
                  className="text-display-medium font-black mb-4 text-white"
                  style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.8)' }}
                >
                  Register Your Account
                </h2>
                <p
                  className="text-body-large text-white leading-relaxed font-medium mb-8"
                  style={{ textShadow: '1px 1px 3px rgba(0,0,0,0.7)' }}
                >
                  Join the B767 Pilot Management System. Submit leave requests, provide feedback,
                  and stay connected with fleet operations.
                </p>
              </div>

              {/* Benefits */}
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
                    Access real-time notifications
                  </span>
                </div>
              </div>

              {/* Security Note */}
              <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-4">
                <p className="text-sm text-white/90 flex items-start">
                  <Shield className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" />
                  <span>
                    Your registration will be reviewed by an administrator. You will receive email
                    notifications about your approval status.
                  </span>
                </p>
              </div>
            </div>

            {/* Right Side - Registration Form */}
            <div className="lg:col-span-3 animate-slide-in-right">
              <div className="card-premium bg-white/95 backdrop-blur-md border border-white/20 shadow-2xl">
                <div className="text-center mb-8">
                  <div className="relative mb-6">
                    <div className="absolute inset-0 bg-blue-600/20 rounded-2xl blur-lg" />
                    <div className="relative w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto">
                      <UserPlus className="text-white w-8 h-8" />
                    </div>
                  </div>
                  <h3 className="text-heading-large text-gray-900 mb-2">Create Pilot Account</h3>
                  <p className="text-body-medium text-gray-600">
                    Enter your information to register
                  </p>
                </div>

                {/* Error Message */}
                {errors.root && (
                  <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 flex items-start">
                    <AlertTriangle className="text-red-500 w-5 h-5 mr-3 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-red-800">Registration Error</p>
                      <p className="text-red-700 text-sm mt-1">{errors.root.message}</p>
                    </div>
                  </div>
                )}

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                  {/* Employee ID */}
                  <div>
                    <label className="form-label">
                      Employee ID <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <BadgeCheck className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        {...register('employee_id')}
                        type="text"
                        className={`form-input pl-12 uppercase ${errors.employee_id ? 'border-red-300' : ''}`}
                        placeholder="2393"
                      />
                    </div>
                    {errors.employee_id && (
                      <p className="text-red-600 text-sm mt-1">{errors.employee_id.message}</p>
                    )}
                  </div>

                  {/* Name Fields - Side by Side */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="form-label">
                        First Name <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                          <User className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                          {...register('first_name')}
                          type="text"
                          className={`form-input pl-12 ${errors.first_name ? 'border-red-300' : ''}`}
                          placeholder="John"
                        />
                      </div>
                      {errors.first_name && (
                        <p className="text-red-600 text-sm mt-1">{errors.first_name.message}</p>
                      )}
                    </div>

                    <div>
                      <label className="form-label">
                        Last Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        {...register('last_name')}
                        type="text"
                        className={`form-input ${errors.last_name ? 'border-red-300' : ''}`}
                        placeholder="Doe"
                      />
                      {errors.last_name && (
                        <p className="text-red-600 text-sm mt-1">{errors.last_name.message}</p>
                      )}
                    </div>
                  </div>

                  {/* Rank */}
                  <div>
                    <label className="form-label">
                      Rank <span className="text-red-500">*</span>
                    </label>
                    <select
                      {...register('rank')}
                      className={`form-input ${errors.rank ? 'border-red-300' : ''}`}
                    >
                      <option value="">Select your rank</option>
                      <option value="Captain">Captain</option>
                      <option value="First Officer">First Officer</option>
                    </select>
                    {errors.rank && (
                      <p className="text-red-600 text-sm mt-1">{errors.rank.message}</p>
                    )}
                  </div>

                  {/* Email */}
                  <div>
                    <label className="form-label">
                      Email Address <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Mail className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        {...register('email')}
                        type="email"
                        className={`form-input pl-12 ${errors.email ? 'border-red-300' : ''}`}
                        placeholder="your.email@airniugini.com"
                      />
                    </div>
                    {errors.email && (
                      <p className="text-red-600 text-sm mt-1">{errors.email.message}</p>
                    )}
                  </div>

                  {/* Password */}
                  <div>
                    <label className="form-label">
                      Password <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Lock className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        {...register('password')}
                        type={showPassword ? 'text' : 'password'}
                        className={`form-input pl-12 pr-12 ${errors.password ? 'border-red-300' : ''}`}
                        placeholder="Min. 8 characters"
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
                    {errors.password && (
                      <p className="text-red-600 text-sm mt-1">{errors.password.message}</p>
                    )}
                  </div>

                  {/* Confirm Password */}
                  <div>
                    <label className="form-label">
                      Confirm Password <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Lock className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        {...register('confirmPassword')}
                        type={showConfirmPassword ? 'text' : 'password'}
                        className={`form-input pl-12 pr-12 ${errors.confirmPassword ? 'border-red-300' : ''}`}
                        placeholder="Re-enter password"
                      />
                      <button
                        type="button"
                        className="absolute inset-y-0 right-0 pr-4 flex items-center"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                        ) : (
                          <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                        )}
                      </button>
                    </div>
                    {errors.confirmPassword && (
                      <p className="text-red-600 text-sm mt-1">{errors.confirmPassword.message}</p>
                    )}
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="btn btn-primary w-full btn-lg disabled:opacity-50 disabled:cursor-not-allowed mt-6"
                  >
                    {isLoading ? (
                      <>
                        <div className="loading-spinner-lg mr-3" />
                        Creating Account...
                      </>
                    ) : (
                      <>
                        <UserPlus className="w-5 h-5 mr-2 inline" />
                        Register Account
                      </>
                    )}
                  </button>
                </form>

                {/* Footer */}
                <div className="mt-8 pt-6 border-t border-gray-200 text-center">
                  <p className="text-sm text-gray-600">
                    Already have an account?{' '}
                    <Link
                      href="/pilot/login"
                      className="text-blue-600 hover:text-blue-700 font-semibold"
                    >
                      Sign in here
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
