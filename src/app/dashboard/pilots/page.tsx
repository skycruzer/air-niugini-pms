'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { useAuth } from '@/contexts/AuthContext'
import { permissions } from '@/lib/auth-utils'
import { getAllPilots, searchPilots, PilotWithCertifications } from '@/lib/pilot-service-client'
// Using emojis and custom SVGs instead of Lucide React icons

function PilotCard({ pilot, onView, onEdit }: {
  pilot: PilotWithCertifications
  onView: (id: string) => void
  onEdit: (id: string) => void
}) {
  const { user } = useAuth()

  const statusColor = pilot.certificationStatus.expired > 0
    ? 'text-red-600'
    : pilot.certificationStatus.expiring > 0
    ? 'text-yellow-600'
    : 'text-green-600'

  const statusIcon = pilot.certificationStatus.expired > 0
    ? <span className="text-red-600">⚠️</span>
    : pilot.certificationStatus.expiring > 0
    ? <span className="text-yellow-600">⏰</span>
    : <span className="text-green-600">✅</span>

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-2">
            <h3 className="text-lg font-semibold text-gray-900">
              {pilot.first_name} {pilot.middle_name && `${pilot.middle_name} `}{pilot.last_name}
            </h3>
            {!pilot.is_active && (
              <span className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-full">
                Inactive
              </span>
            )}
          </div>

          <div className="mt-1 space-y-1">
            <p className="text-sm text-gray-600">
              <span className="font-medium">Employee ID:</span> {pilot.employee_id}
            </p>
            <p className="text-sm text-gray-600">
              <span className="font-medium">Role:</span> {pilot.role}
            </p>
            {pilot.contract_type && (
              <p className="text-sm text-gray-600">
                <span className="font-medium">Contract:</span> {pilot.contract_type}
              </p>
            )}
          </div>

          <div className="mt-3 flex items-center space-x-4">
            <div className="flex items-center space-x-1">
              {statusIcon}
              <span className={`text-sm font-medium ${statusColor}`}>
                {pilot.certificationStatus.current} Current
              </span>
            </div>
            {pilot.certificationStatus.expiring > 0 && (
              <span className="text-sm text-yellow-600">
                {pilot.certificationStatus.expiring} Expiring
              </span>
            )}
            {pilot.certificationStatus.expired > 0 && (
              <span className="text-sm text-red-600">
                {pilot.certificationStatus.expired} Expired
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center space-x-2 ml-4">
          <button
            onClick={() => onView(pilot.id)}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            title="View Details"
          >
            👁️
          </button>

          {permissions.canEdit(user) && (
            <button
              onClick={() => onEdit(pilot.id)}
              className="p-2 text-blue-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              title="Edit Pilot"
            >
              ✏️
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default function PilotsPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [pilots, setPilots] = useState<PilotWithCertifications[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [filterRole, setFilterRole] = useState<'all' | 'Captain' | 'First Officer'>('all')
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch pilots from Supabase
  useEffect(() => {
    const fetchPilots = async () => {
      try {
        setLoading(true)
        setError(null)
        const data = await getAllPilots()
        setPilots(data)
      } catch (err) {
        console.error('Error fetching pilots:', err)
        setError(err instanceof Error ? err.message : 'Failed to load pilots')
      } finally {
        setLoading(false)
      }
    }

    fetchPilots()
  }, [])

  const filteredPilots = pilots.filter(pilot => {
    const matchesSearch = searchTerm === '' ||
      pilot.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pilot.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pilot.employee_id.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesRole = filterRole === 'all' || pilot.role === filterRole
    const matchesStatus = filterStatus === 'all' ||
      (filterStatus === 'active' && pilot.is_active) ||
      (filterStatus === 'inactive' && !pilot.is_active)

    return matchesSearch && matchesRole && matchesStatus
  })

  const handleViewPilot = (pilotId: string) => {
    // Navigate to pilot detail view
    router.push(`/dashboard/pilots/${pilotId}`)
  }

  const handleEditPilot = (pilotId: string) => {
    // Navigate to pilot edit form
    router.push(`/dashboard/pilots/${pilotId}/edit`)
  }

  const handleCreatePilot = () => {
    // Navigate to pilot creation form
    router.push('/dashboard/pilots/new')
  }

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="p-6">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                  <span className="text-3xl mr-3">👨‍✈️</span>
                  Pilot Management
                </h1>
                <p className="text-gray-600 mt-1">
                  Manage B767 fleet pilot information and certifications
                </p>
              </div>

              {permissions.canCreate(user) && (
                <button
                  onClick={handleCreatePilot}
                  className="flex items-center px-4 py-2 bg-[#E4002B] text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  <span className="mr-2">➕</span>
                  Add New Pilot
                </button>
              )}
            </div>
          </div>

          {/* Search and Filters */}
          <div className="mb-6 bg-white rounded-lg border border-gray-200 p-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Search */}
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">🔍</span>
                <input
                  type="text"
                  placeholder="Search pilots..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#E4002B] focus:border-[#E4002B]"
                />
              </div>

              {/* Role Filter */}
              <div>
                <select
                  value={filterRole}
                  onChange={(e) => setFilterRole(e.target.value as any)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#E4002B] focus:border-[#E4002B]"
                >
                  <option value="all">All Roles</option>
                  <option value="Captain">Captain</option>
                  <option value="First Officer">First Officer</option>
                </select>
              </div>

              {/* Status Filter */}
              <div>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value as any)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#E4002B] focus:border-[#E4002B]"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>

              {/* Results Count */}
              <div className="flex items-center text-sm text-gray-600">
                <span className="mr-1">📊</span>
                {filteredPilots.length} of {pilots.length} pilots
              </div>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-800">Error: {error}</p>
              <button
                onClick={() => router.refresh()}
                className="mt-2 px-3 py-1 text-sm bg-red-100 text-red-800 rounded hover:bg-red-200 transition-colors"
              >
                Retry
              </button>
            </div>
          )}

          {/* Pilots Grid */}
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#E4002B] mx-auto"></div>
              <p className="text-gray-600 mt-2">Loading pilots...</p>
            </div>
          ) : filteredPilots.length === 0 ? (
            <div className="text-center py-12">
              <span className="text-6xl block mb-4">👨‍✈️</span>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No pilots found</h3>
              <p className="text-gray-600 mb-4">
                {searchTerm || filterRole !== 'all' || filterStatus !== 'all'
                  ? 'Try adjusting your search or filters'
                  : 'Get started by adding your first pilot'
                }
              </p>
              {permissions.canCreate(user) && (
                <button
                  onClick={handleCreatePilot}
                  className="px-4 py-2 bg-[#E4002B] text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  Add New Pilot
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {filteredPilots.map((pilot) => (
                <PilotCard
                  key={pilot.id}
                  pilot={pilot}
                  onView={handleViewPilot}
                  onEdit={handleEditPilot}
                />
              ))}
            </div>
          )}

          {/* Summary Stats */}
          {pilots.length > 0 && (
            <div className="mt-8 bg-gray-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Fleet Summary</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-blue-600">{pilots.filter(p => p.is_active).length}</p>
                  <p className="text-sm text-gray-600">Active Pilots</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-purple-600">{pilots.filter(p => p.role === 'Captain').length}</p>
                  <p className="text-sm text-gray-600">Captains</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-600">{pilots.filter(p => p.role === 'First Officer').length}</p>
                  <p className="text-sm text-gray-600">First Officers</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-red-600">
                    {pilots.reduce((sum, p) => sum + p.certificationStatus.expired, 0)}
                  </p>
                  <p className="text-sm text-gray-600">Expired Certifications</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}