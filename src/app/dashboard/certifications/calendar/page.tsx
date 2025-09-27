'use client'

import { useState, useEffect } from 'react'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { CertificationCalendar } from '@/components/calendar/CertificationCalendar'
import { Calendar, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { format } from 'date-fns'

interface ExpiringCert {
  pilotName: string
  employeeId: string
  checkCode: string
  checkDescription: string
  category: string
  expiryDate: Date | string
}

interface CertificationEvent {
  id: string
  pilotName: string
  employeeId: string
  checkCode: string
  checkDescription: string
  expiryDate: Date
  status: 'expired' | 'expiring_soon' | 'due_soon'
}

export default function CertificationCalendarPage() {
  const [certifications, setCertifications] = useState<CertificationEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchCertifications = async () => {
      try {
        setLoading(true)
        const response = await fetch('/api/expiring-certifications?daysAhead=90')
        if (!response.ok) {
          throw new Error('Failed to fetch expiring certifications')
        }
        const result = await response.json()
        const expiringCerts = result.success ? result.data : []

        const transformedCerts: CertificationEvent[] = expiringCerts.map((cert: ExpiringCert, index: number) => {
          const expiryDate = cert.expiryDate instanceof Date ? cert.expiryDate : new Date(cert.expiryDate)
          const daysUntilExpiry = Math.ceil((expiryDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))

          let status: 'expired' | 'expiring_soon' | 'due_soon' = 'due_soon'
          if (daysUntilExpiry <= 0) {
            status = 'expired'
          } else if (daysUntilExpiry <= 7) {
            status = 'expiring_soon'
          }

          return {
            id: `${cert.pilotName}-${cert.checkCode}-${index}`,
            pilotName: cert.pilotName,
            employeeId: cert.employeeId,
            checkCode: cert.checkCode,
            checkDescription: cert.checkDescription,
            expiryDate,
            status
          }
        })

        setCertifications(transformedCerts)
      } catch (error) {
        console.error('Error fetching certifications:', error)
        setError('Failed to load certifications')
      } finally {
        setLoading(false)
      }
    }

    fetchCertifications()
  }, [])

  const handleDateSelect = (date: Date, events: CertificationEvent[]) => {
    console.log('Selected date:', format(date, 'yyyy-MM-dd'), 'Events:', events)
  }

  if (loading) {
    return (
      <ProtectedRoute>
        <DashboardLayout>
          <div className="p-6">
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#E4002B] mx-auto"></div>
              <p className="text-gray-600 mt-2">Loading certification calendar...</p>
            </div>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    )
  }

  if (error) {
    return (
      <ProtectedRoute>
        <DashboardLayout>
          <div className="p-6">
            <div className="text-center py-12">
              <p className="text-red-600">{error}</p>
            </div>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="p-6 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link
                href="/dashboard/certifications"
                className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Certifications
              </Link>
              <div className="h-6 w-px bg-gray-300"></div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                  <Calendar className="w-7 h-7 text-[#E4002B] mr-3" />
                  Certification Calendar
                </h1>
                <p className="text-gray-600 mt-1">
                  View certification expiry dates in calendar format
                </p>
              </div>
            </div>
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
              <div className="text-2xl mb-1">⚠️</div>
              <p className="text-xl font-bold text-red-600">
                {certifications.filter(c => c.status === 'expired').length}
              </p>
              <p className="text-sm text-red-600">Expired</p>
            </div>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
              <div className="text-2xl mb-1">🚨</div>
              <p className="text-xl font-bold text-yellow-600">
                {certifications.filter(c => c.status === 'expiring_soon').length}
              </p>
              <p className="text-sm text-yellow-600">Expiring Soon</p>
            </div>
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 text-center">
              <div className="text-2xl mb-1">⏰</div>
              <p className="text-xl font-bold text-orange-600">
                {certifications.filter(c => c.status === 'due_soon').length}
              </p>
              <p className="text-sm text-orange-600">Due Soon</p>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
              <div className="text-2xl mb-1">📋</div>
              <p className="text-xl font-bold text-blue-600">{certifications.length}</p>
              <p className="text-sm text-blue-600">Total</p>
            </div>
          </div>

          {/* Calendar */}
          <CertificationCalendar
            certifications={certifications}
            onDateSelect={handleDateSelect}
          />
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}