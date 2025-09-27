'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { useAuth } from '@/contexts/AuthContext'
import { permissions } from '@/lib/auth-utils'
import { getCertificationStatus, getCategoryIcon } from '@/lib/certification-utils'
import { getPilotById, getPilotCertifications } from '@/lib/pilot-service-client'
import { format, differenceInYears } from 'date-fns'
// Using emojis and custom SVGs instead of Lucide React icons

interface PilotDetail {
  id: string
  employeeId: string
  firstName: string
  middleName?: string
  lastName: string
  role: 'Captain' | 'First Officer'
  contractType?: string
  nationality?: string
  passportNumber?: string
  passportExpiry?: Date
  dateOfBirth?: Date
  commencementDate?: Date
  seniorityNumber?: number
  isActive: boolean
  email?: string
  phone?: string
  address?: string
  emergencyContact?: {
    name: string
    phone: string
    relationship: string
  }
}

interface Certification {
  id: string
  checkCode: string
  checkDescription: string
  category: string
  expiryDate?: Date
  status: {
    color: string
    label: string
    className: string
  }
}

function InfoCard({ title, children, className = "" }: {
  title: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={`bg-white rounded-lg border border-gray-200 shadow-sm p-6 ${className}`}>
      <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
      {children}
    </div>
  )
}

function InfoRow({ label, value, type = "text" }: {
  label: string
  value: string | number | Date | null | undefined
  type?: "text" | "date" | "years"
}) {
  let displayValue: string

  if (type === "date" && value instanceof Date) {
    displayValue = format(value, 'dd MMM yyyy')
  } else if (type === "years" && value instanceof Date) {
    displayValue = `${differenceInYears(new Date(), value)} years old`
  } else if (!value) {
    displayValue = "Not provided"
  } else {
    displayValue = String(value)
  }

  return (
    <div className="flex justify-between py-2 border-b border-gray-100 last:border-b-0">
      <span className="text-sm font-medium text-gray-600">{label}</span>
      <span className="text-sm text-gray-900">{displayValue}</span>
    </div>
  )
}

function CertificationCard({ cert }: { cert: Certification }) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h4 className="font-medium text-gray-900">{cert.checkCode}</h4>
          <p className="text-sm text-gray-600 mt-1">{cert.checkDescription}</p>
          <p className="text-xs text-gray-500 mt-1">{cert.category}</p>
        </div>
        <div className="ml-4">
          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${cert.status.className}`}>
            {cert.status.color === 'red' && <span className="mr-1">⚠️</span>}
            {cert.status.color === 'yellow' && <span className="mr-1">⏰</span>}
            {cert.status.color === 'green' && <span className="mr-1">✅</span>}
            {cert.status.label}
          </span>
          {cert.expiryDate && (
            <p className="text-xs text-gray-500 mt-1 text-right">
              Expires: {format(cert.expiryDate, 'dd MMM yyyy')}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

export default function PilotDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const [pilot, setPilot] = useState<PilotDetail | null>(null)
  const [certifications, setCertifications] = useState<Certification[]>([])
  const [loading, setLoading] = useState(true)

  const pilotId = params.id as string

  useEffect(() => {
    const fetchPilotData = async () => {
      try {
        setLoading(true)

        // Fetch pilot details and certifications in parallel
        const [pilotData, certData] = await Promise.all([
          getPilotById(pilotId),
          getPilotCertifications(pilotId)
        ])

        if (pilotData) {
          setPilot({
            id: pilotData.id,
            employeeId: pilotData.employee_id,
            firstName: pilotData.first_name,
            middleName: pilotData.middle_name,
            lastName: pilotData.last_name,
            role: pilotData.role,
            contractType: pilotData.contract_type,
            nationality: pilotData.nationality,
            passportNumber: pilotData.passport_number,
            passportExpiry: pilotData.passport_expiry ? new Date(pilotData.passport_expiry) : undefined,
            dateOfBirth: pilotData.date_of_birth ? new Date(pilotData.date_of_birth) : undefined,
            commencementDate: pilotData.commencement_date ? new Date(pilotData.commencement_date) : undefined,
            seniorityNumber: pilotData.seniority_number,
            isActive: pilotData.is_active,
            email: pilotData.email,
            phone: pilotData.phone,
            address: pilotData.address,
            emergencyContact: pilotData.emergencyContact
          })
        }

        setCertifications(certData || [])
      } catch (error) {
        console.error('Error fetching pilot data:', error)
        // Keep pilot as null to show "not found" message
      } finally {
        setLoading(false)
      }
    }

    fetchPilotData()
  }, [pilotId])

  if (loading) {
    return (
      <ProtectedRoute>
        <DashboardLayout>
          <div className="p-6">
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-air-niugini-red mx-auto"></div>
              <p className="text-gray-600 mt-2">Loading pilot details...</p>
            </div>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    )
  }

  if (!pilot) {
    return (
      <ProtectedRoute>
        <DashboardLayout>
          <div className="p-6">
            <div className="text-center py-12">
              <span className="text-6xl block mb-4">👨‍✈️</span>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Pilot not found</h3>
              <p className="text-gray-600 mb-4">The pilot you're looking for doesn't exist.</p>
              <button
                onClick={() => router.push('/dashboard/pilots')}
                className="inline-flex items-center px-4 py-2 bg-[#E4002B] text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                <span className="mr-2">⬅️</span>
                Back to Pilots
              </button>
            </div>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    )
  }

  const certificationStats = {
    total: certifications.length,
    current: certifications.filter(c => c.status.color === 'green').length,
    expiring: certifications.filter(c => c.status.color === 'yellow').length,
    expired: certifications.filter(c => c.status.color === 'red').length
  }

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="p-6">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => router.push('/dashboard/pilots')}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <span className="text-xl">⬅️</span>
                </button>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                    <span className="text-3xl mr-3">👤</span>
                    {pilot.firstName} {pilot.middleName && `${pilot.middleName} `}{pilot.lastName}
                    {!pilot.isActive && (
                      <span className="ml-3 px-3 py-1 text-sm bg-gray-100 text-gray-600 rounded-full">
                        Inactive
                      </span>
                    )}
                  </h1>
                  <p className="text-gray-600 mt-1">
                    {pilot.role} • Employee ID: {pilot.employeeId}
                  </p>
                </div>
              </div>

              {permissions.canEdit(user) && (
                <div className="flex space-x-2">
                  <button
                    onClick={() => router.push(`/dashboard/pilots/${pilot.id}/edit`)}
                    className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <span className="mr-2">✏️</span>
                    Edit Pilot
                  </button>
                  <button
                    onClick={() => router.push(`/dashboard/pilots/${pilot.id}/certifications`)}
                    className="flex items-center px-4 py-2 bg-[#E4002B] text-white rounded-lg hover:bg-red-700 transition-colors"
                  >
                    <span className="mr-2">🛡️</span>
                    Manage Certifications
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 text-center">
              <span className="text-4xl block mb-2">📄</span>
              <p className="text-2xl font-bold text-gray-900">{certificationStats.total}</p>
              <p className="text-sm text-gray-600">Total Certifications</p>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 text-center">
              <span className="text-4xl block mb-2 text-green-600">✅</span>
              <p className="text-2xl font-bold text-green-600">{certificationStats.current}</p>
              <p className="text-sm text-gray-600">Current</p>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 text-center">
              <span className="text-4xl block mb-2 text-yellow-600">⏰</span>
              <p className="text-2xl font-bold text-yellow-600">{certificationStats.expiring}</p>
              <p className="text-sm text-gray-600">Expiring Soon</p>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 text-center">
              <span className="text-4xl block mb-2 text-red-600">⚠️</span>
              <p className="text-2xl font-bold text-red-600">{certificationStats.expired}</p>
              <p className="text-sm text-gray-600">Expired</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Personal Information */}
            <InfoCard title="Personal Information">
              <div className="space-y-0">
                <InfoRow label="Full Name" value={`${pilot.firstName} ${pilot.middleName || ''} ${pilot.lastName}`} />
                <InfoRow label="Date of Birth" value={pilot.dateOfBirth} type="date" />
                <InfoRow label="Age" value={pilot.dateOfBirth} type="years" />
                <InfoRow label="Nationality" value={pilot.nationality} />
                <InfoRow label="Passport Number" value={pilot.passportNumber} />
                <InfoRow label="Passport Expiry" value={pilot.passportExpiry} type="date" />
              </div>
            </InfoCard>

            {/* Employment Details */}
            <InfoCard title="Employment Details">
              <div className="space-y-0">
                <InfoRow label="Employee ID" value={pilot.employeeId} />
                <InfoRow label="Role" value={pilot.role} />
                <InfoRow label="Contract Type" value={pilot.contractType} />
                <InfoRow label="Commencement Date" value={pilot.commencementDate} type="date" />
                <InfoRow label="Seniority Number" value={pilot.seniorityNumber ? `#${pilot.seniorityNumber}` : "Not assigned"} />
                <InfoRow label="Status" value={pilot.isActive ? "Active" : "Inactive"} />
              </div>
            </InfoCard>

            {/* Contact Information */}
            <InfoCard title="Contact Information">
              <div className="space-y-0">
                <InfoRow label="Email" value={pilot.email} />
                <InfoRow label="Phone" value={pilot.phone} />
                <InfoRow label="Address" value={pilot.address} />
              </div>
            </InfoCard>
          </div>

          {/* Emergency Contact */}
          {pilot.emergencyContact && (
            <div className="mt-6">
              <InfoCard title="Emergency Contact">
                <div className="space-y-0">
                  <InfoRow label="Name" value={pilot.emergencyContact.name} />
                  <InfoRow label="Phone" value={pilot.emergencyContact.phone} />
                  <InfoRow label="Relationship" value={pilot.emergencyContact.relationship} />
                </div>
              </InfoCard>
            </div>
          )}

          {/* Certifications */}
          <div className="mt-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900 flex items-center">
                <span className="text-2xl mr-2">📄</span>
                Certifications ({certifications.length})
              </h2>
              <div className="flex items-center space-x-4 text-sm">
                <span className="flex items-center">
                  <span className="mr-1">✅</span>
                  {certificationStats.current} Current
                </span>
                <span className="flex items-center">
                  <span className="mr-1">⏰</span>
                  {certificationStats.expiring} Expiring
                </span>
                <span className="flex items-center">
                  <span className="mr-1">⚠️</span>
                  {certificationStats.expired} Expired
                </span>
              </div>
            </div>

            {certifications.length === 0 ? (
              <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
                <span className="text-6xl block mb-4">📄</span>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No certifications found</h3>
                <p className="text-gray-600">This pilot doesn't have any certifications recorded.</p>
              </div>
            ) : (
              <div className="space-y-6">
                {(() => {
                  // Group certifications by category
                  const categorizedCertifications = certifications.reduce((acc, cert) => {
                    if (!acc[cert.category]) {
                      acc[cert.category] = []
                    }
                    acc[cert.category].push(cert)
                    return acc
                  }, {} as Record<string, Certification[]>)

                  const categories = Object.keys(categorizedCertifications).sort()

                  return categories.map(category => (
                    <div key={category} className="bg-white rounded-lg border border-gray-200 shadow-sm">
                      <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                          <span className="mr-2">
                            {getCategoryIcon(category)}
                          </span>
                          {category}
                          <span className="ml-2 text-sm text-gray-500">
                            ({categorizedCertifications[category].length} items)
                          </span>
                        </h3>
                      </div>
                      <div className="p-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {categorizedCertifications[category].map((cert) => (
                            <CertificationCard key={cert.id} cert={cert} />
                          ))}
                        </div>
                      </div>
                    </div>
                  ))
                })()}
              </div>
            )}
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}