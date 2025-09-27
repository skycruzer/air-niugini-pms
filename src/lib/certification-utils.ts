import { differenceInDays, isBefore, parseISO } from 'date-fns'

export interface CertificationStatus {
  color: 'red' | 'yellow' | 'green' | 'gray'
  label: string
  className: string
  daysUntilExpiry: number
}

/**
 * Get certification status based on expiry date
 * Red: Expired, Yellow: Expiring within 30 days, Green: Current
 */
export function getCertificationStatus(expiryDate: string | Date | null): CertificationStatus {
  if (!expiryDate) {
    return {
      color: 'gray',
      label: 'No Date',
      className: 'bg-gray-100 text-gray-800',
      daysUntilExpiry: 0
    }
  }

  const expiry = typeof expiryDate === 'string' ? parseISO(expiryDate) : expiryDate
  const today = new Date()
  const daysUntilExpiry = differenceInDays(expiry, today)

  if (daysUntilExpiry < 0) {
    return {
      color: 'red',
      label: 'Expired',
      className: 'bg-red-100 text-red-800 border-red-200',
      daysUntilExpiry
    }
  }

  if (daysUntilExpiry <= 30) {
    return {
      color: 'yellow',
      label: 'Expiring Soon',
      className: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      daysUntilExpiry
    }
  }

  return {
    color: 'green',
    label: 'Current',
    className: 'bg-green-100 text-green-800 border-green-200',
    daysUntilExpiry
  }
}

/**
 * Get status color for Air Niugini branding
 */
export function getStatusColor(status: CertificationStatus['color']): string {
  switch (status) {
    case 'red':
      return '#EF4444' // Red for expired
    case 'yellow':
      return '#F59E0B' // Amber for expiring soon
    case 'green':
      return '#10B981' // Green for current
    case 'gray':
    default:
      return '#6B7280' // Gray for no date
  }
}

/**
 * Filter certifications by status
 */
export function filterCertificationsByStatus(
  certifications: Array<{ expiry_date?: string }>,
  status: CertificationStatus['color']
): Array<{ expiry_date?: string }> {
  return certifications.filter(cert => {
    const certStatus = getCertificationStatus(cert.expiry_date || null)
    return certStatus.color === status
  })
}

/**
 * Get certifications expiring within specified days
 */
export function getExpiringCertifications(
  certifications: Array<{ expiry_date?: string }>,
  daysAhead: number = 30
): Array<{ expiry_date?: string }> {
  return certifications.filter(cert => {
    if (!cert.expiry_date) return false

    const expiry = parseISO(cert.expiry_date)
    const today = new Date()
    const daysUntilExpiry = differenceInDays(expiry, today)

    return daysUntilExpiry >= 0 && daysUntilExpiry <= daysAhead
  })
}

/**
 * Get expired certifications
 */
export function getExpiredCertifications(
  certifications: Array<{ expiry_date?: string }>
): Array<{ expiry_date?: string }> {
  return certifications.filter(cert => {
    if (!cert.expiry_date) return false

    const expiry = parseISO(cert.expiry_date)
    const today = new Date()

    return isBefore(expiry, today)
  })
}

/**
 * Calculate compliance percentage for a pilot
 */
export function calculateCompliancePercentage(
  certifications: Array<{ expiry_date?: string }>
): number {
  if (certifications.length === 0) return 0

  const currentCerts = certifications.filter(cert => {
    const status = getCertificationStatus(cert.expiry_date || null)
    return status.color === 'green'
  })

  return Math.round((currentCerts.length / certifications.length) * 100)
}

/**
 * Get category icon for certification categories
 */
export function getCategoryIcon(category: string | null): string {
  if (!category) return '✈️'

  switch (category) {
    case 'Flight Checks':
      return '🎯'
    case 'pilot_medical':
      return '🏥'
    case 'simulator_checks':
      return '📚'
    case 'ID Cards':
      return '🔒'
    case 'Travel Visa':
      return '🦺'
    case 'Ground Courses Refresher':
      return '👨‍🏫'
    case 'Foreign Pilot Work Permit':
      return '📜'
    default:
      return '✈️'
  }
}

/**
 * Get category color for certification categories
 */
export function getCategoryColor(category: string | null): string {
  if (!category) return 'bg-gray-100 text-gray-800'

  switch (category) {
    case 'Flight Checks':
      return 'bg-blue-100 text-blue-800'
    case 'pilot_medical':
      return 'bg-green-100 text-green-800'
    case 'simulator_checks':
      return 'bg-yellow-100 text-yellow-800'
    case 'ID Cards':
      return 'bg-red-100 text-red-800'
    case 'Travel Visa':
      return 'bg-orange-100 text-orange-800'
    case 'Ground Courses Refresher':
      return 'bg-indigo-100 text-indigo-800'
    case 'Foreign Pilot Work Permit':
      return 'bg-purple-100 text-purple-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}