'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useRouter } from 'next/navigation'
import { Users, Upload, CheckCircle, AlertTriangle, ArrowLeft, Search, Filter } from 'lucide-react'

const bulkUpdateSchema = z.object({
  checkTypeId: z.string().min(1, 'Check type is required'),
  newExpiryDate: z.string().min(1, 'Expiry date is required'),
  selectedPilots: z.array(z.string()).min(1, 'At least one pilot must be selected')
})

type BulkUpdateData = z.infer<typeof bulkUpdateSchema>

interface Pilot {
  id: string
  employee_id: string
  first_name: string
  last_name: string
  role: string
  is_active: boolean
}

interface CheckType {
  id: string
  check_code: string
  check_description: string
  category: string
}

export default function BulkUpdatePage() {
  const router = useRouter()
  const [pilots, setPilots] = useState<Pilot[]>([])
  const [checkTypes, setCheckTypes] = useState<CheckType[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedPilots, setSelectedPilots] = useState<string[]>([])
  const [selectAll, setSelectAll] = useState(false)
  const [updateResults, setUpdateResults] = useState<any>(null)
  const [submitting, setSubmitting] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterRole, setFilterRole] = useState('')

  const { register, handleSubmit, watch, setValue, reset, formState: { errors } } = useForm<BulkUpdateData>({
    resolver: zodResolver(bulkUpdateSchema),
    defaultValues: {
      selectedPilots: []
    }
  })

  // Load pilots and check types
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        setError(null)

        // Fetch pilots and check types in parallel
        const [pilotsResponse, checkTypesResponse] = await Promise.all([
          fetch('/api/pilots'),
          fetch('/api/check-types')
        ])

        if (!pilotsResponse.ok || !checkTypesResponse.ok) {
          throw new Error('Failed to fetch data')
        }

        const pilotsData = await pilotsResponse.json()
        const checkTypesData = await checkTypesResponse.json()

        if (!pilotsData.success || !checkTypesData.success) {
          throw new Error('API request failed')
        }

        setPilots(pilotsData.data || [])
        setCheckTypes(checkTypesData.data || [])

      } catch (err) {
        console.error('Error fetching data:', err)
        setError('Failed to load pilots and check types')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  // Update form when selectedPilots changes
  useEffect(() => {
    setValue('selectedPilots', selectedPilots)
  }, [selectedPilots, setValue])

  // Filter pilots based on search and role filter
  const filteredPilots = pilots.filter(pilot => {
    const matchesSearch = searchTerm === '' ||
      pilot.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pilot.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pilot.employee_id.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesRole = filterRole === '' || pilot.role === filterRole

    return matchesSearch && matchesRole
  })

  const handlePilotToggle = (pilotId: string) => {
    setSelectedPilots(prev =>
      prev.includes(pilotId)
        ? prev.filter(id => id !== pilotId)
        : [...prev, pilotId]
    )
  }

  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedPilots([])
    } else {
      setSelectedPilots(filteredPilots.map(p => p.id))
    }
    setSelectAll(!selectAll)
  }

  const onSubmit = async (data: BulkUpdateData) => {
    try {
      setSubmitting(true)
      setError(null)
      setUpdateResults(null)

      const response = await fetch('/api/certifications/bulk-update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Bulk update failed')
      }

      setUpdateResults(result)
      setSelectedPilots([])
      setSelectAll(false)
      reset()

    } catch (err) {
      console.error('Bulk update error:', err)
      setError(err instanceof Error ? err.message : 'Failed to update certifications')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#E4002B] mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading pilots and check types...</p>
        </div>
      </div>
    )
  }

  const uniqueRoles = [...new Set(pilots.map(p => p.role))].sort()

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.back()}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="h-5 w-5 text-gray-600" />
              </button>
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-[#E4002B] rounded-lg">
                  <Upload className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">Bulk Certification Update</h1>
                  <p className="text-sm text-gray-600">Update certification expiry dates for multiple pilots</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Success/Error Messages */}
        {updateResults && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <div>
                <h3 className="font-medium text-green-800">Update Successful!</h3>
                <p className="text-sm text-green-700">{updateResults.message}</p>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              <div>
                <h3 className="font-medium text-red-800">Update Failed</h3>
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          {/* Certification Details */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Certification Details</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Check Type Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Check Type *
                </label>
                <select
                  {...register('checkTypeId')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#E4002B] focus:border-transparent"
                >
                  <option value="">Select check type...</option>
                  {checkTypes.map(checkType => (
                    <option key={checkType.id} value={checkType.id}>
                      {checkType.check_code} - {checkType.check_description}
                    </option>
                  ))}
                </select>
                {errors.checkTypeId && (
                  <p className="mt-1 text-sm text-red-600">{errors.checkTypeId.message}</p>
                )}
              </div>

              {/* New Expiry Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  New Expiry Date *
                </label>
                <input
                  type="date"
                  {...register('newExpiryDate')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#E4002B] focus:border-transparent"
                />
                {errors.newExpiryDate && (
                  <p className="mt-1 text-sm text-red-600">{errors.newExpiryDate.message}</p>
                )}
              </div>
            </div>
          </div>

          {/* Pilot Selection */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Select Pilots</h2>
              <div className="text-sm text-gray-600">
                {selectedPilots.length} of {filteredPilots.length} selected
              </div>
            </div>

            {/* Search and Filter Controls */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search pilots..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#E4002B] focus:border-transparent"
                />
              </div>

              <div className="relative">
                <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <select
                  value={filterRole}
                  onChange={(e) => setFilterRole(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#E4002B] focus:border-transparent"
                >
                  <option value="">All roles</option>
                  {uniqueRoles.map(role => (
                    <option key={role} value={role}>{role}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center">
                <button
                  type="button"
                  onClick={handleSelectAll}
                  className="px-4 py-2 text-sm font-medium text-[#E4002B] hover:bg-red-50 rounded-lg transition-colors"
                >
                  {selectAll ? 'Deselect All' : 'Select All'}
                </button>
              </div>
            </div>

            {/* Pilots List */}
            <div className="max-h-96 overflow-y-auto border border-gray-200 rounded-lg">
              {filteredPilots.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>No pilots found matching your criteria</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {filteredPilots.map(pilot => (
                    <label
                      key={pilot.id}
                      className="flex items-center p-4 hover:bg-gray-50 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={selectedPilots.includes(pilot.id)}
                        onChange={() => handlePilotToggle(pilot.id)}
                        className="h-4 w-4 text-[#E4002B] focus:ring-[#E4002B] border-gray-300 rounded"
                      />
                      <div className="ml-3 flex-1">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {pilot.first_name} {pilot.last_name}
                            </p>
                            <p className="text-xs text-gray-600">
                              {pilot.employee_id} • {pilot.role}
                            </p>
                          </div>
                          <div className="text-right">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              pilot.is_active
                                ? 'bg-green-100 text-green-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {pilot.is_active ? 'Active' : 'Inactive'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </div>

            {errors.selectedPilots && (
              <p className="mt-2 text-sm text-red-600">{errors.selectedPilots.message}</p>
            )}
          </div>

          {/* Submit Button */}
          <div className="flex items-center justify-end space-x-4">
            <button
              type="button"
              onClick={() => router.back()}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || selectedPilots.length === 0}
              className="px-6 py-2 bg-[#E4002B] text-white rounded-lg hover:bg-[#C00020] disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
            >
              {submitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Updating...</span>
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4" />
                  <span>Update {selectedPilots.length} Certification{selectedPilots.length !== 1 ? 's' : ''}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}