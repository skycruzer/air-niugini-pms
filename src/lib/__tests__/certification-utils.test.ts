/**
 * Certification Utils Tests
 * Tests for Air Niugini aviation certification status logic and compliance calculations
 */

import {
  getCertificationStatus,
  getStatusColor,
  filterCertificationsByStatus,
  getExpiringCertifications,
  getExpiredCertifications,
  calculateCompliancePercentage,
  getCategoryIcon,
  getCategoryColor,
} from '../certification-utils'
import { addDays, subDays, format } from 'date-fns'

describe('Certification Utils', () => {
  describe('getCertificationStatus', () => {
    it('returns gray status for null expiry date', () => {
      const status = getCertificationStatus(null)
      expect(status.color).toBe('gray')
      expect(status.label).toBe('No Date')
      expect(status.className).toContain('bg-gray-100')
      expect(status.daysUntilExpiry).toBe(0)
    })

    it('returns red status for expired certification (past date)', () => {
      const expiredDate = subDays(new Date(), 10)
      const status = getCertificationStatus(expiredDate)
      expect(status.color).toBe('red')
      expect(status.label).toBe('Expired')
      expect(status.className).toContain('bg-red-100')
      expect(status.daysUntilExpiry).toBeLessThan(0)
    })

    it('returns yellow status for certification expiring soon (within 30 days)', () => {
      const expiringDate = addDays(new Date(), 15)
      const status = getCertificationStatus(expiringDate)
      expect(status.color).toBe('yellow')
      expect(status.label).toBe('Expiring Soon')
      expect(status.className).toContain('bg-yellow-100')
      expect(status.daysUntilExpiry).toBe(15)
    })

    it('returns green status for current certification (more than 30 days)', () => {
      const currentDate = addDays(new Date(), 90)
      const status = getCertificationStatus(currentDate)
      expect(status.color).toBe('green')
      expect(status.label).toBe('Current')
      expect(status.className).toContain('bg-green-100')
      expect(status.daysUntilExpiry).toBe(90)
    })

    it('handles exactly 30 days until expiry as expiring', () => {
      const exactDate = addDays(new Date(), 30)
      const status = getCertificationStatus(exactDate)
      expect(status.color).toBe('yellow')
      expect(status.label).toBe('Expiring Soon')
    })

    it('handles exactly 31 days as current', () => {
      const exactDate = addDays(new Date(), 31)
      const status = getCertificationStatus(exactDate)
      expect(status.color).toBe('green')
      expect(status.label).toBe('Current')
    })

    it('handles string date format', () => {
      const futureDate = format(addDays(new Date(), 60), 'yyyy-MM-dd')
      const status = getCertificationStatus(futureDate)
      expect(status.color).toBe('green')
      expect(status.daysUntilExpiry).toBeGreaterThan(30) // More than 30 days makes it "current"
    })

    it('handles Date object', () => {
      const futureDate = addDays(new Date(), 60)
      const status = getCertificationStatus(futureDate)
      expect(status.color).toBe('green')
      expect(status.daysUntilExpiry).toBeGreaterThan(30) // More than 30 days makes it "current"
    })
  })

  describe('getStatusColor', () => {
    it('returns red color hex for expired', () => {
      const color = getStatusColor('red')
      expect(color).toBe('#EF4444')
    })

    it('returns amber color hex for expiring', () => {
      const color = getStatusColor('yellow')
      expect(color).toBe('#F59E0B')
    })

    it('returns green color hex for current', () => {
      const color = getStatusColor('green')
      expect(color).toBe('#10B981')
    })

    it('returns gray color hex for no date', () => {
      const color = getStatusColor('gray')
      expect(color).toBe('#6B7280')
    })
  })

  describe('filterCertificationsByStatus', () => {
    const mockCerts = [
      { expiry_date: format(addDays(new Date(), 90), 'yyyy-MM-dd') },
      { expiry_date: format(addDays(new Date(), 20), 'yyyy-MM-dd') },
      { expiry_date: format(subDays(new Date(), 10), 'yyyy-MM-dd') },
      { expiry_date: undefined },
    ]

    it('filters current certifications', () => {
      const current = filterCertificationsByStatus(mockCerts, 'green')
      expect(current).toHaveLength(1)
    })

    it('filters expiring certifications', () => {
      const expiring = filterCertificationsByStatus(mockCerts, 'yellow')
      expect(expiring).toHaveLength(1)
    })

    it('filters expired certifications', () => {
      const expired = filterCertificationsByStatus(mockCerts, 'red')
      expect(expired).toHaveLength(1)
    })

    it('filters certifications with no date', () => {
      const noDate = filterCertificationsByStatus(mockCerts, 'gray')
      expect(noDate).toHaveLength(1)
    })

    it('returns empty array when no matches', () => {
      const emptyResult = filterCertificationsByStatus([], 'green')
      expect(emptyResult).toEqual([])
    })
  })

  describe('getExpiringCertifications', () => {
    const mockCerts = [
      { expiry_date: format(addDays(new Date(), 90), 'yyyy-MM-dd') },
      { expiry_date: format(addDays(new Date(), 20), 'yyyy-MM-dd') },
      { expiry_date: format(addDays(new Date(), 5), 'yyyy-MM-dd') },
      { expiry_date: format(subDays(new Date(), 10), 'yyyy-MM-dd') },
      { expiry_date: undefined },
    ]

    it('returns certifications expiring within default 30 days', () => {
      const expiring = getExpiringCertifications(mockCerts)
      expect(expiring).toHaveLength(2) // 20 days and 5 days
    })

    it('returns certifications expiring within custom days ahead', () => {
      const expiring = getExpiringCertifications(mockCerts, 60)
      expect(expiring).toHaveLength(2) // Still 20 and 5 days (90 is excluded)
    })

    it('excludes already expired certifications', () => {
      const expiring = getExpiringCertifications(mockCerts, 90)
      expect(expiring.every(cert => cert.expiry_date && new Date(cert.expiry_date) > new Date())).toBe(true)
    })

    it('excludes certifications with no date', () => {
      const expiring = getExpiringCertifications(mockCerts)
      expect(expiring.every(cert => cert.expiry_date)).toBe(true)
    })

    it('returns empty array when no expiring certs', () => {
      const futureCerts = [{ expiry_date: format(addDays(new Date(), 365), 'yyyy-MM-dd') }]
      const result = getExpiringCertifications(futureCerts, 30)
      expect(result).toEqual([])
    })
  })

  describe('getExpiredCertifications', () => {
    const mockCerts = [
      { expiry_date: format(addDays(new Date(), 90), 'yyyy-MM-dd') },
      { expiry_date: format(subDays(new Date(), 10), 'yyyy-MM-dd') },
      { expiry_date: format(subDays(new Date(), 30), 'yyyy-MM-dd') },
      { expiry_date: undefined },
    ]

    it('returns only expired certifications', () => {
      const expired = getExpiredCertifications(mockCerts)
      expect(expired).toHaveLength(2)
    })

    it('excludes future certifications', () => {
      const expired = getExpiredCertifications(mockCerts)
      expect(expired.every(cert => cert.expiry_date && new Date(cert.expiry_date) < new Date())).toBe(true)
    })

    it('excludes certifications with no date', () => {
      const expired = getExpiredCertifications(mockCerts)
      expect(expired.every(cert => cert.expiry_date)).toBe(true)
    })

    it('returns empty array when no expired certs', () => {
      const futureCerts = [{ expiry_date: format(addDays(new Date(), 365), 'yyyy-MM-dd') }]
      const result = getExpiredCertifications(futureCerts)
      expect(result).toEqual([])
    })
  })

  describe('calculateCompliancePercentage', () => {
    it('returns 100 for all current certifications', () => {
      const allCurrent = [
        { expiry_date: format(addDays(new Date(), 90), 'yyyy-MM-dd') },
        { expiry_date: format(addDays(new Date(), 180), 'yyyy-MM-dd') },
        { expiry_date: format(addDays(new Date(), 365), 'yyyy-MM-dd') },
      ]
      const percentage = calculateCompliancePercentage(allCurrent)
      expect(percentage).toBe(100)
    })

    it('returns 0 for all expired certifications', () => {
      const allExpired = [
        { expiry_date: format(subDays(new Date(), 10), 'yyyy-MM-dd') },
        { expiry_date: format(subDays(new Date(), 30), 'yyyy-MM-dd') },
      ]
      const percentage = calculateCompliancePercentage(allExpired)
      expect(percentage).toBe(0)
    })

    it('calculates correct percentage for mixed certifications', () => {
      const mixed = [
        { expiry_date: format(addDays(new Date(), 90), 'yyyy-MM-dd') }, // current
        { expiry_date: format(addDays(new Date(), 180), 'yyyy-MM-dd') }, // current
        { expiry_date: format(addDays(new Date(), 20), 'yyyy-MM-dd') }, // expiring
        { expiry_date: format(subDays(new Date(), 10), 'yyyy-MM-dd') }, // expired
      ]
      const percentage = calculateCompliancePercentage(mixed)
      expect(percentage).toBe(50) // 2 out of 4 are current
    })

    it('returns 0 for empty array', () => {
      const percentage = calculateCompliancePercentage([])
      expect(percentage).toBe(0)
    })

    it('rounds percentage to nearest integer', () => {
      const certs = [
        { expiry_date: format(addDays(new Date(), 90), 'yyyy-MM-dd') },
        { expiry_date: format(addDays(new Date(), 180), 'yyyy-MM-dd') },
        { expiry_date: format(subDays(new Date(), 10), 'yyyy-MM-dd') },
      ]
      const percentage = calculateCompliancePercentage(certs)
      expect(percentage).toBe(67) // 2/3 = 66.67, rounded to 67
    })
  })

  describe('getCategoryIcon', () => {
    it('returns correct icon for Flight Checks', () => {
      expect(getCategoryIcon('Flight Checks')).toBe('🎯')
    })

    it('returns correct icon for Pilot Medical', () => {
      expect(getCategoryIcon('Pilot Medical')).toBe('🏥')
    })

    it('returns correct icon for Simulator Checks', () => {
      expect(getCategoryIcon('Simulator Checks')).toBe('📚')
    })

    it('returns correct icon for ID Cards', () => {
      expect(getCategoryIcon('ID Cards')).toBe('🔒')
    })

    it('returns correct icon for Travel Visa', () => {
      expect(getCategoryIcon('Travel Visa')).toBe('🦺')
    })

    it('returns correct icon for Ground Courses Refresher', () => {
      expect(getCategoryIcon('Ground Courses Refresher')).toBe('👨‍🏫')
    })

    it('returns correct icon for Foreign Pilot Work Permit', () => {
      expect(getCategoryIcon('Foreign Pilot Work Permit')).toBe('📜')
    })

    it('returns correct icon for Non-renewal', () => {
      expect(getCategoryIcon('Non-renewal')).toBe('📋')
    })

    it('returns default airplane icon for unknown category', () => {
      expect(getCategoryIcon('Unknown Category')).toBe('✈️')
    })

    it('returns default icon for null category', () => {
      expect(getCategoryIcon(null)).toBe('✈️')
    })
  })

  describe('getCategoryColor', () => {
    it('returns correct color for Flight Checks', () => {
      expect(getCategoryColor('Flight Checks')).toBe('bg-blue-100 text-blue-800')
    })

    it('returns correct color for Pilot Medical', () => {
      expect(getCategoryColor('Pilot Medical')).toBe('bg-green-100 text-green-800')
    })

    it('returns correct color for Simulator Checks', () => {
      expect(getCategoryColor('Simulator Checks')).toBe('bg-yellow-100 text-yellow-800')
    })

    it('returns default color for unknown category', () => {
      expect(getCategoryColor('Unknown')).toBe('bg-gray-100 text-gray-800')
    })

    it('returns default color for null category', () => {
      expect(getCategoryColor(null)).toBe('bg-gray-100 text-gray-800')
    })
  })

  describe('Aviation Safety Standards', () => {
    it('follows FAA color coding for status indicators', () => {
      const expired = getCertificationStatus(subDays(new Date(), 1))
      const expiring = getCertificationStatus(addDays(new Date(), 15))
      const current = getCertificationStatus(addDays(new Date(), 90))

      expect(expired.color).toBe('red') // Critical - not safe to operate
      expect(expiring.color).toBe('yellow') // Warning - action required
      expect(current.color).toBe('green') // Safe - compliant
    })

    it('maintains 30-day alert threshold for expiring certifications', () => {
      const day30 = getCertificationStatus(addDays(new Date(), 30))
      const day31 = getCertificationStatus(addDays(new Date(), 31))

      expect(day30.color).toBe('yellow') // Alert at 30 days
      expect(day31.color).toBe('green') // Safe beyond 30 days
    })

    it('calculates days until expiry for tracking', () => {
      const daysAhead = 45
      const status = getCertificationStatus(addDays(new Date(), daysAhead))
      expect(status.daysUntilExpiry).toBe(daysAhead)
    })
  })
})
