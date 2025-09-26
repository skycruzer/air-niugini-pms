'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { useAuth } from '@/contexts/AuthContext'
import { permissions } from '@/lib/auth-utils'
import { createPilot, PilotFormData } from '@/lib/pilot-service-client'
// Using emojis and custom SVGs instead of Lucide React icons

function FormField({
  label,
  name,
  type = "text",
  value,
  onChange,
  required = false,
  options,
  error
}: {
  label: string
  name: string
  type?: string
  value: string | boolean
  onChange: (value: string | boolean) => void
  required?: boolean
  options?: { value: string; label: string }[]
  error?: string
}) {
  if (type === 'select' && options) {
    return (
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
        <select
          value={value as string}
          onChange={(e) => onChange(e.target.value)}
          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#E4002B] focus:border-[#E4002B] ${
            error ? 'border-red-300' : 'border-gray-300'
          }`}
          required={required}
        >
          <option value="">Select {label}</option>
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {error && (
          <p className="mt-1 text-sm text-red-600 flex items-center">
            <span className="mr-1">⚠️</span>
            {error}
          </p>
        )}
      </div>
    )
  }

  if (type === 'checkbox') {
    return (
      <div className="flex items-center">
        <input
          type="checkbox"
          checked={value as boolean}
          onChange={(e) => onChange(e.target.checked)}
          className="h-4 w-4 text-[#E4002B] focus:ring-[#E4002B] border-gray-300 rounded"
        />
        <label className="ml-2 block text-sm text-gray-700">
          {label}
        </label>
      </div>
    )
  }

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input
        type={type}
        value={value as string}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#E4002B] focus:border-[#E4002B] ${
          error ? 'border-red-300' : 'border-gray-300'
        }`}
        required={required}
      />
      {error && (
        <p className="mt-1 text-sm text-red-600 flex items-center">
          <span className="mr-1">⚠️</span>
          {error}
        </p>
      )}
    </div>
  )
}

export default function NewPilotPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const [formData, setFormData] = useState<PilotFormData>({
    employee_id: '',
    first_name: '',
    middle_name: '',
    last_name: '',
    role: 'First Officer',
    contract_type: '',
    nationality: 'Papua New Guinea',
    passport_number: '',
    passport_expiry: '',
    date_of_birth: '',
    commencement_date: '',
    seniority_number: undefined,
    is_active: true,
    // Optional fields not stored in database yet
    email: '',
    phone: '',
    address: '',
    emergency_contact_name: '',
    emergency_contact_phone: '',
    emergency_contact_relationship: ''
  })

  // Check permissions
  if (!permissions.canCreate(user)) {
    return (
      <ProtectedRoute>
        <DashboardLayout>
          <div className="p-6">
            <div className="text-center py-12">
              <span className="text-6xl block mb-4">🚫</span>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Access Denied</h3>
              <p className="text-gray-600 mb-4">You don't have permission to create new pilots.</p>
              <a
                href="/dashboard/pilots"
                className="inline-flex items-center px-4 py-2 bg-[#E4002B] text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                <span className="mr-2">⬅️</span>
                Back to Pilots
              </a>
            </div>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    )
  }

  const updateFormData = (field: keyof PilotFormData, value: string | boolean | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }))
    }
  }

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    // Required fields
    if (!formData.employee_id) newErrors.employee_id = 'Employee ID is required'
    if (!formData.first_name) newErrors.first_name = 'First name is required'
    if (!formData.last_name) newErrors.last_name = 'Last name is required'
    if (!formData.role) newErrors.role = 'Role is required'

    // Date validation
    if (formData.date_of_birth && new Date(formData.date_of_birth) > new Date()) {
      newErrors.date_of_birth = 'Date of birth cannot be in the future'
    }

    if (formData.passport_expiry && new Date(formData.passport_expiry) < new Date()) {
      newErrors.passport_expiry = 'Passport expiry date should be in the future'
    }

    // Validate commencement date is after date of birth
    if (formData.date_of_birth && formData.commencement_date) {
      const birthDate = new Date(formData.date_of_birth)
      const commenceDate = new Date(formData.commencement_date)

      if (commenceDate <= birthDate) {
        newErrors.commencement_date = 'Commencement date must be after date of birth'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setLoading(true)

    try {
      // Create pilot using the service - formData already has correct field names
      await createPilot(formData)

      // Redirect to pilots list on success
      router.push('/dashboard/pilots')
    } catch (error) {
      console.error('Error creating pilot:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to create pilot. Please try again.'
      setErrors({ general: errorMessage })
    } finally {
      setLoading(false)
    }
  }

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="p-6 max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center space-x-4">
              <a
                href="/dashboard/pilots"
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <span className="text-xl">⬅️</span>
              </a>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                  <span className="text-3xl mr-3">👤</span>
                  Add New Pilot
                </h1>
                <p className="text-gray-600 mt-1">
                  Create a new pilot profile for the B767 fleet
                </p>
              </div>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* General Error */}
            {errors.general && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex">
                  <span className="text-red-400">⚠️</span>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800">Error</h3>
                    <p className="text-sm text-red-700 mt-1">{errors.general}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Basic Information */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <FormField
                  label="Employee ID"
                  name="employee_id"
                  value={formData.employee_id || ''}
                  onChange={(value) => updateFormData('employee_id', value)}
                  required
                  error={errors.employee_id}
                />

                <FormField
                  label="Role"
                  name="role"
                  type="select"
                  value={formData.role || ''}
                  onChange={(value) => updateFormData('role', value)}
                  required
                  options={[
                    { value: 'Captain', label: 'Captain' },
                    { value: 'First Officer', label: 'First Officer' }
                  ]}
                  error={errors.role}
                />

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Seniority Number
                  </label>
                  <input
                    type="text"
                    value="Auto-calculated"
                    readOnly
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
                    placeholder="Auto-calculated based on commencement date"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Calculated automatically from commencement date
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
                <FormField
                  label="First Name"
                  name="first_name"
                  value={formData.first_name || ''}
                  onChange={(value) => updateFormData('first_name', value)}
                  required
                  error={errors.first_name}
                />

                <FormField
                  label="Middle Name"
                  name="middle_name"
                  value={formData.middle_name || ''}
                  onChange={(value) => updateFormData('middle_name', value)}
                />

                <FormField
                  label="Last Name"
                  name="last_name"
                  value={formData.last_name || ''}
                  onChange={(value) => updateFormData('last_name', value)}
                  required
                  error={errors.last_name}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                <FormField
                  label="Contract Type"
                  name="contract_type"
                  type="select"
                  value={formData.contract_type || ''}
                  onChange={(value) => updateFormData('contract_type', value)}
                  options={[
                    { value: 'Fulltime', label: 'Fulltime' },
                    { value: 'Commuting', label: 'Commuting' },
                    { value: 'Tours', label: 'Tours' }
                  ]}
                />

                <FormField
                  label="Nationality"
                  name="nationality"
                  value={formData.nationality || ''}
                  onChange={(value) => updateFormData('nationality', value)}
                />
              </div>

              <div className="mt-6">
                <FormField
                  label="Active Pilot"
                  name="is_active"
                  type="checkbox"
                  value={formData.is_active}
                  onChange={(value) => updateFormData('is_active', value)}
                />
              </div>
            </div>

            {/* Personal Details */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Personal Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  label="Date of Birth"
                  name="date_of_birth"
                  type="date"
                  value={formData.date_of_birth || ''}
                  onChange={(value) => updateFormData('date_of_birth', value)}
                  error={errors.date_of_birth}
                />

                <FormField
                  label="Commencement Date"
                  name="commencement_date"
                  type="date"
                  value={formData.commencement_date || ''}
                  onChange={(value) => updateFormData('commencement_date', value)}
                  error={errors.commencement_date}
                />

                <FormField
                  label="Passport Number"
                  name="passport_number"
                  value={formData.passport_number || ''}
                  onChange={(value) => updateFormData('passport_number', value)}
                />

                <FormField
                  label="Passport Expiry Date"
                  name="passport_expiry"
                  type="date"
                  value={formData.passport_expiry || ''}
                  onChange={(value) => updateFormData('passport_expiry', value)}
                  error={errors.passport_expiry}
                />
              </div>
            </div>


            {/* Form Actions */}
            <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200">
              <a
                href="/dashboard/pilots"
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </a>
              <button
                type="submit"
                disabled={loading}
                className="flex items-center px-6 py-2 bg-[#E4002B] text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                ) : (
                  <span className="mr-2">💾</span>
                )}
                {loading ? 'Creating...' : 'Create Pilot'}
              </button>
            </div>
          </form>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}