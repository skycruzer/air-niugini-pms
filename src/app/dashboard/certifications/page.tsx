'use client'

import { useState, useEffect } from 'react'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { useAuth } from '@/contexts/AuthContext'
import { permissions } from '@/lib/auth-utils'
import {
  getAllCheckTypes,
  getExpiringCertifications,
  getPilotsWithExpiredCertifications
} from '@/lib/pilot-service-client'
import { getCategoryIcon, getCategoryColor } from '@/lib/certification-utils'

interface CheckType {
  id: string
  check_code: string
  check_description: string
  category: string
}

interface ExpiringCert {
  pilotName: string
  employeeId: string
  checkCode: string
  checkDescription: string
  category: string
  expiryDate: Date | string // Can be Date object or string from API
  status: {
    color: string
    label: string
    className: string
  }
}

function CheckTypeCard({ checkType }: { checkType: CheckType }) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-2">
            <span className="text-lg font-bold text-[#E4002B]">{checkType.check_code}</span>
            <span className={`px-2 py-1 text-xs rounded-full ${getCategoryColor(checkType.category)}`}>
              {checkType.category}
            </span>
          </div>
          <h3 className="font-semibold text-gray-900 mb-1">{checkType.check_description}</h3>
        </div>
        <div className="text-2xl">
          {getCategoryIcon(checkType.category)}
        </div>
      </div>
    </div>
  )
}

function ExpiringCertCard({ cert }: { cert: ExpiringCert }) {
  // Ensure expiryDate is a Date object (convert from string if necessary)
  const expiryDate = cert.expiryDate instanceof Date ? cert.expiryDate : new Date(cert.expiryDate)
  const daysUntilExpiry = Math.ceil((expiryDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))

  return (
    <div className={`bg-white rounded-lg border p-4 ${
      daysUntilExpiry <= 7 ? 'border-red-300 bg-red-50' :
      daysUntilExpiry <= 30 ? 'border-yellow-300 bg-yellow-50' :
      'border-gray-200'
    }`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-2">
            <h4 className="font-semibold text-gray-900">{cert.pilotName}</h4>
            <span className="text-sm text-gray-500">({cert.employeeId})</span>
          </div>
          <div className="flex items-center space-x-2 mb-1">
            <span className="font-medium text-[#E4002B]">{cert.checkCode}</span>
            <span className="text-sm text-gray-600">{cert.checkDescription}</span>
          </div>
          <p className="text-sm text-gray-500">{cert.category}</p>
        </div>
        <div className="text-right">
          <div className="flex items-center space-x-2 mb-1">
            <span className={`text-lg ${
              daysUntilExpiry <= 0 ? 'text-red-600' :
              daysUntilExpiry <= 7 ? 'text-red-500' :
              daysUntilExpiry <= 30 ? 'text-yellow-500' :
              'text-green-500'
            }`}>
              {daysUntilExpiry <= 0 ? '⚠️' :
               daysUntilExpiry <= 7 ? '🚨' :
               daysUntilExpiry <= 30 ? '⏰' :
               '✅'
              }
            </span>
          </div>
          <p className={`text-sm font-medium ${
            daysUntilExpiry <= 0 ? 'text-red-600' :
            daysUntilExpiry <= 7 ? 'text-red-500' :
            daysUntilExpiry <= 30 ? 'text-yellow-600' :
            'text-green-600'
          }`}>
            {daysUntilExpiry <= 0 ? 'Expired' :
             daysUntilExpiry === 1 ? '1 day left' :
             `${daysUntilExpiry} days left`
            }
          </p>
          <p className="text-xs text-gray-500">
            {expiryDate.toLocaleDateString()}
          </p>
        </div>
      </div>
    </div>
  )
}

export default function CertificationsPage() {
  const { user } = useAuth()
  const [checkTypes, setCheckTypes] = useState<CheckType[]>([])
  const [expiringCerts, setExpiringCerts] = useState<ExpiringCert[]>([])
  const [expiredPilots, setExpiredPilots] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | string>('all')

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)

        console.log('🔍 Certifications Page: Starting data fetch...')

        // Use API routes in development mode to bypass RLS
        if (process.env.NODE_ENV === 'development') {
          console.log('🔍 Certifications Page: Using API routes in development mode')

          // Load all check types
          const typesResponse = await fetch('/api/check-types')
          const typesResult = await typesResponse.json()
          if (typesResult.success) {
            setCheckTypes(typesResult.data || [])
            console.log('🔍 Certifications Page: Loaded', typesResult.data?.length || 0, 'check types')
          } else {
            console.error('Failed to load check types:', typesResult.error)
          }

          // Load expiring certifications
          const expiringResponse = await fetch('/api/expiring-certifications?daysAhead=60')
          const expiringResult = await expiringResponse.json()
          if (expiringResult.success) {
            setExpiringCerts(expiringResult.data || [])
            console.log('🔍 Certifications Page: Loaded', expiringResult.data?.length || 0, 'expiring certifications')
          } else {
            console.error('Failed to load expiring certifications:', expiringResult.error)
          }

          // Load pilots with expired certifications
          const expiredResponse = await fetch('/api/expired-certifications')
          const expiredResult = await expiredResponse.json()
          if (expiredResult.success) {
            setExpiredPilots(expiredResult.data || [])
            console.log('🔍 Certifications Page: Loaded', expiredResult.data?.length || 0, 'pilots with expired certifications')
          } else {
            console.error('Failed to load expired certifications:', expiredResult.error)
          }
        } else {
          // Production mode - use service functions directly
          console.log('🔍 Certifications Page: Using service functions in production mode')

          const types = await getAllCheckTypes()
          setCheckTypes(types || [])

          const expiring = await getExpiringCertifications(60) // Next 60 days
          setExpiringCerts(expiring || [])

          const expired = await getPilotsWithExpiredCertifications()
          setExpiredPilots(expired || [])
        }

        console.log('🔍 Certifications Page: Data loading completed')
      } catch (error) {
        console.error('Error loading certifications data:', error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  const categories = Array.from(new Set(checkTypes.map(ct => ct.category))).sort()
  const filteredCheckTypes = filter === 'all' ? checkTypes : checkTypes.filter(ct => ct.category === filter)

  if (loading) {
    return (
      <ProtectedRoute>
        <DashboardLayout>
          <div className="p-6">
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#E4002B] mx-auto"></div>
              <p className="text-gray-600 mt-2">Loading certification data...</p>
            </div>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    )
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
                  <span className="text-3xl mr-3">🛡️</span>
                  Certification Management
                </h1>
                <p className="text-gray-600 mt-1">
                  Track and manage pilot certifications across 34 different check types for the B767 fleet
                </p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-[#E4002B]">{checkTypes.length}</p>
                <p className="text-sm text-gray-600">Check Types</p>
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
              <div className="text-3xl mb-2">📋</div>
              <p className="text-2xl font-bold text-blue-600">{checkTypes.length}</p>
              <p className="text-sm text-blue-600">Total Check Types</p>
            </div>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
              <div className="text-3xl mb-2">⏰</div>
              <p className="text-2xl font-bold text-yellow-600">{expiringCerts.length}</p>
              <p className="text-sm text-yellow-600">Expiring Soon</p>
            </div>
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
              <div className="text-3xl mb-2">⚠️</div>
              <p className="text-2xl font-bold text-red-600">{expiredPilots.length}</p>
              <p className="text-sm text-red-600">Pilots with Expired</p>
            </div>
            <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
              <div className="text-3xl mb-2">✅</div>
              <p className="text-2xl font-bold text-green-600">98%</p>
              <p className="text-sm text-green-600">Overall Compliance</p>
            </div>
          </div>

          {/* Expiring Certifications Alert */}
          {expiringCerts.length > 0 && (
            <div className="mb-8">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-yellow-900 flex items-center">
                    <span className="text-2xl mr-2">⚠️</span>
                    Certifications Expiring Soon
                  </h2>
                  <span className="px-3 py-1 bg-yellow-200 text-yellow-800 rounded-full text-sm font-medium">
                    {expiringCerts.length} items
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-96 overflow-y-auto">
                  {expiringCerts.slice(0, 8).map((cert, index) => (
                    <ExpiringCertCard key={index} cert={cert} />
                  ))}
                </div>
                {expiringCerts.length > 8 && (
                  <div className="mt-4 text-center">
                    <button className="text-yellow-700 hover:text-yellow-900 font-medium">
                      View all {expiringCerts.length} expiring certifications →
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Check Types Section */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">All Check Types</h2>
              <div className="flex items-center space-x-4">
                <select
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#E4002B] focus:border-[#E4002B]"
                >
                  <option value="all">All Categories</option>
                  {categories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
                <span className="text-sm text-gray-600">
                  {filteredCheckTypes.length} of {checkTypes.length} check types
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredCheckTypes.map((checkType) => (
                <CheckTypeCard key={checkType.id} checkType={checkType} />
              ))}
            </div>
          </div>

          {/* Categories Overview */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Categories Overview</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {categories.map((category) => {
                const count = checkTypes.filter(ct => ct.category === category).length
                return (
                  <div key={category} className="text-center p-4 bg-gray-50 rounded-lg">
                    <div className="text-2xl mb-2">
                      {getCategoryIcon(category)}
                    </div>
                    <p className="font-semibold text-gray-900">{count}</p>
                    <p className="text-sm text-gray-600">{category}</p>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}