'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { useAuth } from '@/contexts/AuthContext'
import { permissions } from '@/lib/auth-utils'
import { getPilotById, updatePilot, checkEmployeeIdExists, PilotFormData, calculateSeniorityNumber } from '@/lib/pilot-service-client'
import { format } from 'date-fns'

interface FormErrors {
  [key: string]: string
}

export default function EditPilotPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState<FormErrors>({})
  const [pilot, setPilot] = useState<any>(null)
  const [calculatedSeniority, setCalculatedSeniority] = useState<number | null>(null)

  const [formData, setFormData] = useState<PilotFormData>({
    employee_id: '',
    first_name: '',
    middle_name: '',
    last_name: '',
    role: 'First Officer',
    contract_type: '',
    nationality: '',
    passport_number: '',
    passport_expiry: '',
    date_of_birth: '',
    commencement_date: '',
    seniority_number: undefined,
    is_active: true,
    // Note: email, phone, address, emergency contact fields are not stored in database
    email: '',
    phone: '',
    address: '',
    emergency_contact_name: '',
    emergency_contact_phone: '',
    emergency_contact_relationship: ''
  })

  const pilotId = params.id as string

  useEffect(() => {
    if (!permissions.canEdit(user)) {
      router.push('/dashboard/pilots')
      return
    }

    const fetchPilot = async () => {
      try {
        setLoading(true)
        const pilotData = await getPilotById(pilotId)

        if (!pilotData) {
          router.push('/dashboard/pilots')
          return
        }

        setPilot(pilotData)

        // Populate form with existing data - handle missing fields gracefully
        const formatDate = (dateValue: any) => {
          if (!dateValue) return ''
          try {
            return format(new Date(dateValue), 'yyyy-MM-dd')
          } catch (error) {
            console.error('Date formatting error:', error, 'for value:', dateValue)
            return ''
          }
        }

        const newFormData = {
          employee_id: pilotData.employee_id || '',
          first_name: pilotData.first_name || '',
          middle_name: pilotData.middle_name || '',
          last_name: pilotData.last_name || '',
          role: pilotData.role || 'First Officer',
          contract_type: pilotData.contract_type || '',
          nationality: pilotData.nationality || '',
          passport_number: pilotData.passport_number || '',
          passport_expiry: formatDate(pilotData.passport_expiry),
          date_of_birth: formatDate(pilotData.date_of_birth),
          commencement_date: formatDate(pilotData.commencement_date),
          seniority_number: undefined, // Field doesn't exist in database yet
          is_active: pilotData.is_active ?? true,
          // These fields don't exist in the database yet
          email: '',
          phone: '',
          address: '',
          emergency_contact_name: '',
          emergency_contact_phone: '',
          emergency_contact_relationship: ''
        }

        setFormData(newFormData)

        // Calculate seniority number if commencement date exists
        if (pilotData.commencement_date) {
          try {
            const seniority = await calculateSeniorityNumber(pilotData.commencement_date, pilotId)
            setCalculatedSeniority(seniority)
          } catch (error) {
            console.error('Error calculating seniority:', error)
            setCalculatedSeniority(null)
          }
        }
      } catch (error) {
        console.error('Error fetching pilot:', error)
        router.push('/dashboard/pilots')
      } finally {
        setLoading(false)
      }
    }

    fetchPilot()
  }, [pilotId, user, router])

  const validateForm = async (): Promise<boolean> => {
    const newErrors: FormErrors = {}

    // Required fields
    if (!formData.employee_id.trim()) newErrors.employee_id = 'Employee ID is required'
    if (!formData.first_name.trim()) newErrors.first_name = 'First name is required'
    if (!formData.last_name.trim()) newErrors.last_name = 'Last name is required'
    if (!formData.role) newErrors.role = 'Role is required'

    // Check if employee ID is unique (excluding current pilot)
    if (formData.employee_id.trim() && formData.employee_id !== pilot?.employee_id) {
      try {
        const exists = await checkEmployeeIdExists(formData.employee_id, pilotId)
        if (exists) {
          newErrors.employee_id = 'Employee ID already exists'
        }
      } catch (error) {
        console.error('Error checking employee ID:', error)
      }
    }

    // Date validations
    if (formData.date_of_birth && formData.commencement_date) {
      const birthDate = new Date(formData.date_of_birth)
      const commenceDate = new Date(formData.commencement_date)

      if (commenceDate <= birthDate) {
        newErrors.commencement_date = 'Commencement date must be after date of birth'
      }
    }

    if (formData.passport_expiry) {
      const expiryDate = new Date(formData.passport_expiry)
      const today = new Date()

      if (expiryDate < today) {
        newErrors.passport_expiry = 'Passport expiry date cannot be in the past'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (saving) return

    const isValid = await validateForm()
    if (!isValid) return

    try {
      setSaving(true)
      setErrors({})

      await updatePilot(pilotId, formData)

      // Redirect back to pilot detail page
      router.push(`/dashboard/pilots/${pilotId}`)
    } catch (error) {
      console.error('Error updating pilot:', error)
      setErrors({ submit: 'Failed to update pilot. Please try again.' })
    } finally {
      setSaving(false)
    }
  }

  const handleInputChange = async (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target
    const newValue = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value

    setFormData(prev => ({
      ...prev,
      [name]: newValue
    }))

    // Recalculate seniority when commencement date changes
    if (name === 'commencement_date' && newValue) {
      try {
        const seniority = await calculateSeniorityNumber(newValue as string, pilotId)
        setCalculatedSeniority(seniority)
      } catch (error) {
        console.error('Error calculating seniority:', error)
        setCalculatedSeniority(null)
      }
    }

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  if (!permissions.canEdit(user)) {
    return (
      <ProtectedRoute>
        <DashboardLayout>
          <div className="p-6">
            <div className="text-center py-12">
              <span className="text-6xl block mb-4">🚫</span>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Access Denied</h3>
              <p className="text-gray-600 mb-4">You don't have permission to edit pilots.</p>
            </div>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    )
  }

  if (loading) {
    return (
      <ProtectedRoute>
        <DashboardLayout>
          <div className="p-6">
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#E4002B] mx-auto"></div>
              <p className="text-gray-600 mt-2">Loading pilot data...</p>
            </div>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="p-6 max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center space-x-4 mb-4">
              <button
                onClick={() => router.push(`/dashboard/pilots/${pilotId}`)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <span className="text-xl">⬅️</span>
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                  <span className="text-3xl mr-3">✏️</span>
                  Edit Pilot
                </h1>
                <p className="text-gray-600 mt-1">
                  Update pilot information and details
                </p>
              </div>
            </div>
          </div>

          {/* Debug Info */}
          {pilot && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <p className="text-blue-800 text-sm">
                ✅ Loaded data for: {pilot.first_name} {pilot.last_name} (ID: {pilot.employee_id})
              </p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Error Message */}
            {errors.submit && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-800">{errors.submit}</p>
              </div>
            )}

            {/* Basic Information */}
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">
                Basic Information
                {formData.employee_id && (
                  <span className="text-sm text-green-600 ml-2">✓ Data Loaded</span>
                )}
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Employee ID *
                  </label>
                  <input
                    type="text"
                    name="employee_id"
                    value={formData.employee_id}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#E4002B] focus:border-[#E4002B] ${
                      errors.employee_id ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="e.g., PX001"
                  />
                  {errors.employee_id && (
                    <p className="mt-1 text-sm text-red-600">{errors.employee_id}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Role *
                  </label>
                  <select
                    name="role"
                    value={formData.role}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#E4002B] focus:border-[#E4002B] ${
                      errors.role ? 'border-red-300' : 'border-gray-300'
                    }`}
                  >
                    <option value="First Officer">First Officer</option>
                    <option value="Captain">Captain</option>
                  </select>
                  {errors.role && (
                    <p className="mt-1 text-sm text-red-600">{errors.role}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Seniority Number
                  </label>
                  <input
                    type="text"
                    value={
                      calculatedSeniority
                        ? `#${calculatedSeniority} (${calculatedSeniority === 1 ? 'Most Senior' : `${calculatedSeniority} in seniority`})`
                        : formData.commencement_date
                          ? 'Calculating...'
                          : 'Requires commencement date'
                    }
                    readOnly
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
                    placeholder="Auto-calculated based on commencement date"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Based on commencement date - longest serving pilot gets #1
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    First Name *
                  </label>
                  <input
                    type="text"
                    name="first_name"
                    value={formData.first_name}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#E4002B] focus:border-[#E4002B] ${
                      errors.first_name ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="First name"
                  />
                  {errors.first_name && (
                    <p className="mt-1 text-sm text-red-600">{errors.first_name}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Middle Name
                  </label>
                  <input
                    type="text"
                    name="middle_name"
                    value={formData.middle_name}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#E4002B] focus:border-[#E4002B]"
                    placeholder="Middle name (optional)"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Last Name *
                  </label>
                  <input
                    type="text"
                    name="last_name"
                    value={formData.last_name}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#E4002B] focus:border-[#E4002B] ${
                      errors.last_name ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="Last name"
                  />
                  {errors.last_name && (
                    <p className="mt-1 text-sm text-red-600">{errors.last_name}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Contract Type
                  </label>
                  <select
                    name="contract_type"
                    value={formData.contract_type}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#E4002B] focus:border-[#E4002B]"
                  >
                    <option value="">Select contract type...</option>
                    <option value="Fulltime">Fulltime</option>
                    <option value="Commuting">Commuting</option>
                    <option value="Tours">Tours</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nationality
                  </label>
                  <input
                    type="text"
                    name="nationality"
                    value={formData.nationality}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#E4002B] focus:border-[#E4002B]"
                    placeholder="e.g., Papua New Guinean"
                  />
                </div>
              </div>

              <div className="mt-6">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    name="is_active"
                    checked={formData.is_active}
                    onChange={handleInputChange}
                    className="rounded border-gray-300 text-[#E4002B] focus:ring-[#E4002B]"
                  />
                  <span className="ml-2 text-sm text-gray-700">Active Pilot</span>
                </label>
              </div>
            </div>

            {/* Personal Details */}
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Personal Details</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Date of Birth
                  </label>
                  <input
                    type="date"
                    name="date_of_birth"
                    value={formData.date_of_birth}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#E4002B] focus:border-[#E4002B] ${
                      errors.date_of_birth ? 'border-red-300' : 'border-gray-300'
                    }`}
                  />
                  {errors.date_of_birth && (
                    <p className="mt-1 text-sm text-red-600">{errors.date_of_birth}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Commencement Date
                  </label>
                  <input
                    type="date"
                    name="commencement_date"
                    value={formData.commencement_date}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#E4002B] focus:border-[#E4002B] ${
                      errors.commencement_date ? 'border-red-300' : 'border-gray-300'
                    }`}
                  />
                  {errors.commencement_date && (
                    <p className="mt-1 text-sm text-red-600">{errors.commencement_date}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Passport Number
                  </label>
                  <input
                    type="text"
                    name="passport_number"
                    value={formData.passport_number}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#E4002B] focus:border-[#E4002B]"
                    placeholder="Passport number"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Passport Expiry
                  </label>
                  <input
                    type="date"
                    name="passport_expiry"
                    value={formData.passport_expiry}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#E4002B] focus:border-[#E4002B] ${
                      errors.passport_expiry ? 'border-red-300' : 'border-gray-300'
                    }`}
                  />
                  {errors.passport_expiry && (
                    <p className="mt-1 text-sm text-red-600">{errors.passport_expiry}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Note about additional fields */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex">
                <span className="text-blue-500 mr-3">ℹ️</span>
                <div>
                  <h4 className="text-sm font-medium text-blue-800">Additional Information</h4>
                  <p className="text-sm text-blue-700 mt-1">
                    Contact information and emergency contacts are not currently stored in the database schema.
                    Only the fields above will be saved when updating pilot information.
                  </p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-between pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={() => router.push(`/dashboard/pilots/${pilotId}`)}
                className="px-6 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>

              <div className="flex items-center space-x-4">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center px-6 py-2 bg-[#E4002B] text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {saving ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Saving...
                    </>
                  ) : (
                    <>
                      <span className="mr-2">💾</span>
                      Save Changes
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}