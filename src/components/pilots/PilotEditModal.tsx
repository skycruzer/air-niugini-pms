'use client'

import { useState, useEffect } from 'react'
import { getPilotById, updatePilot, checkEmployeeIdExists, PilotFormData, calculateSeniorityNumber } from '@/lib/pilot-service-client'
import { ModalSheet } from '@/components/ui/ModalSheet'
import { format } from 'date-fns'

interface PilotEditModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
  pilotId: string | null
}

function FormField({
  label,
  name,
  type = "text",
  value,
  onChange,
  required = false,
  options,
  error,
  readOnly = false,
  placeholder
}: {
  label: string
  name: string
  type?: string
  value: string | boolean
  onChange: (value: string | boolean) => void
  required?: boolean
  options?: { value: string; label: string }[]
  error?: string
  readOnly?: boolean
  placeholder?: string
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
          disabled={readOnly}
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
          disabled={readOnly}
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
        } ${readOnly ? 'bg-gray-50 text-gray-600' : ''}`}
        required={required}
        readOnly={readOnly}
        disabled={readOnly}
        placeholder={placeholder}
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

export function PilotEditModal({ isOpen, onClose, onSuccess, pilotId }: PilotEditModalProps) {
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [pilot, setPilot] = useState<any>(null)
  const [calculatedSeniority, setCalculatedSeniority] = useState<number | null>(null)

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

  // Load pilot data when modal opens and pilotId changes
  useEffect(() => {
    if (isOpen && pilotId) {
      loadPilotData()
    }
  }, [isOpen, pilotId])

  const loadPilotData = async () => {
    if (!pilotId) return

    try {
      setLoading(true)
      const pilotData = await getPilotById(pilotId)

      if (!pilotData) {
        setErrors({ general: 'Pilot not found' })
        return
      }

      setPilot(pilotData)

      // Populate form with existing data
      const formatDate = (dateValue: any) => {
        if (!dateValue) return ''
        try {
          return format(new Date(dateValue), 'yyyy-MM-dd')
        } catch (error) {
          console.error('Date formatting error:', error)
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
        nationality: pilotData.nationality || 'Papua New Guinea',
        passport_number: pilotData.passport_number || '',
        passport_expiry: formatDate(pilotData.passport_expiry),
        date_of_birth: formatDate(pilotData.date_of_birth),
        commencement_date: formatDate(pilotData.commencement_date),
        seniority_number: undefined,
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
      console.error('Error loading pilot:', error)
      setErrors({ general: 'Failed to load pilot data' })
    } finally {
      setLoading(false)
    }
  }

  const updateFormData = async (field: keyof PilotFormData, value: string | boolean | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))

    // Recalculate seniority when commencement date changes
    if (field === 'commencement_date' && value && pilotId) {
      try {
        const seniority = await calculateSeniorityNumber(value as string, pilotId)
        setCalculatedSeniority(seniority)
      } catch (error) {
        console.error('Error calculating seniority:', error)
        setCalculatedSeniority(null)
      }
    }

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }))
    }
  }

  const validateForm = async (): Promise<boolean> => {
    const newErrors: Record<string, string> = {}

    // Required fields
    if (!formData.employee_id) newErrors.employee_id = 'Employee ID is required'
    if (!formData.first_name) newErrors.first_name = 'First name is required'
    if (!formData.last_name) newErrors.last_name = 'Last name is required'
    if (!formData.role) newErrors.role = 'Role is required'

    // Check if employee ID is unique (excluding current pilot)
    if (formData.employee_id.trim() && formData.employee_id !== pilot?.employee_id) {
      try {
        const exists = await checkEmployeeIdExists(formData.employee_id, pilotId!)
        if (exists) {
          newErrors.employee_id = 'Employee ID already exists'
        }
      } catch (error) {
        console.error('Error checking employee ID:', error)
      }
    }

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

    if (!pilotId || saving) return

    if (!await validateForm()) {
      return
    }

    setSaving(true)

    try {
      await updatePilot(pilotId, formData)

      // Close modal and call success callback
      onClose()
      if (onSuccess) {
        onSuccess()
      }
    } catch (error) {
      console.error('Error updating pilot:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to update pilot. Please try again.'
      setErrors({ general: errorMessage })
    } finally {
      setSaving(false)
    }
  }

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setFormData({
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
        email: '',
        phone: '',
        address: '',
        emergency_contact_name: '',
        emergency_contact_phone: '',
        emergency_contact_relationship: ''
      })
      setErrors({})
      setPilot(null)
      setCalculatedSeniority(null)
    }
  }, [isOpen])

  return (
    <ModalSheet
      isOpen={isOpen}
      onClose={onClose}
      title="Edit Pilot"
      size="xl"
    >
      {loading ? (
        <div className="p-6 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#E4002B] mx-auto"></div>
          <p className="text-gray-600 mt-2">Loading pilot data...</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="p-6 space-y-8">
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
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
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

            <div className="mt-4">
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
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Personal Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
          <div className="flex items-center justify-end space-x-4 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              disabled={saving}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center px-6 py-2 bg-[#E4002B] text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              ) : (
                <span className="mr-2">💾</span>
              )}
              {saving ? 'Updating...' : 'Update Pilot'}
            </button>
          </div>
        </form>
      )}
    </ModalSheet>
  )
}