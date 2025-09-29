/**
 * @fileoverview Certification Expiry PDF Report Generator
 * Professional PDF reports for Air Niugini certification expiry planning
 *
 * @author Air Niugini Development Team
 * @version 1.0.0
 * @since 2025-09-28
 */

import React from 'react'
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet
} from '@react-pdf/renderer'
import { format, parseISO } from 'date-fns'
import {
  PDFHeader,
  PDFFooter,
  SummaryStats,
  PDFTable,
  Section,
  AlertBox,
  pdfStyles,
  airNiuginiStyles
} from './pdf-components'
import { PDFReportMetadata } from '@/types/pdf-reports'

// =============================================================================
// TYPES AND INTERFACES
// =============================================================================

export interface CertificationExpiryReportData {
  timeframeDays: number
  expiringCertifications: ExpiringCertification[]
  generatedBy: string
  generatedAt: Date
}

interface ExpiringCertification {
  id: string
  pilot_id: string
  check_type_id: string
  expiry_date: string
  days_until_expiry: number
  pilot_name: string
  employee_id: string
  check_type_name: string
  check_category: string
  is_expired: boolean
  expiry_roster_period: string
  expiry_roster_display: string
}

interface CertificationsByCategory {
  [key: string]: ExpiringCertification[]
}

interface CertificationStatistics {
  totalCertifications: number
  totalPilots: number
  byStatus: {
    expired: number
    expiring_soon: number
    upcoming: number
  }
  byCategory: {
    [key: string]: number
  }
  byRosterPeriod: {
    [key: string]: number
  }
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Calculate comprehensive certification statistics
 */
function calculateCertificationStatistics(certifications: ExpiringCertification[]): CertificationStatistics {
  const stats: CertificationStatistics = {
    totalCertifications: certifications.length,
    totalPilots: new Set(certifications.map(c => c.pilot_id)).size,
    byStatus: { expired: 0, expiring_soon: 0, upcoming: 0 },
    byCategory: {},
    byRosterPeriod: {}
  }

  certifications.forEach(cert => {
    // By status
    if (cert.days_until_expiry < 0) {
      stats.byStatus.expired++
    } else if (cert.days_until_expiry <= 30) {
      stats.byStatus.expiring_soon++
    } else {
      stats.byStatus.upcoming++
    }

    // By category
    stats.byCategory[cert.check_category] = (stats.byCategory[cert.check_category] || 0) + 1

    // By roster period
    stats.byRosterPeriod[cert.expiry_roster_period] = (stats.byRosterPeriod[cert.expiry_roster_period] || 0) + 1
  })

  return stats
}

/**
 * Group certifications by category
 */
function groupCertificationsByCategory(certifications: ExpiringCertification[]): CertificationsByCategory {
  return certifications.reduce((groups, cert) => {
    const category = cert.check_category
    if (!groups[category]) {
      groups[category] = []
    }
    groups[category].push(cert)
    return groups
  }, {} as CertificationsByCategory)
}

/**
 * Format date for display
 */
function formatExpiryDate(dateString: string): string {
  try {
    const date = parseISO(dateString)
    return format(date, 'dd MMM yyyy')
  } catch (error) {
    return dateString
  }
}

/**
 * Get status label and color
 */
function getStatusInfo(daysUntilExpiry: number) {
  if (daysUntilExpiry < 0) {
    return { label: 'EXPIRED', color: airNiuginiStyles.colors.status.expired }
  } else if (daysUntilExpiry <= 30) {
    return { label: 'EXPIRING SOON', color: airNiuginiStyles.colors.status.expiring }
  } else {
    return { label: 'UPCOMING', color: airNiuginiStyles.colors.status.current }
  }
}

/**
 * Analyze training priorities and recommendations
 */
function analyzeTrainingPriorities(certifications: ExpiringCertification[]): string[] {
  const priorities: string[] = []

  // Count expired certifications
  const expired = certifications.filter(c => c.days_until_expiry < 0)
  if (expired.length > 0) {
    priorities.push(`${expired.length} certifications are already expired and require immediate attention`)
  }

  // Count critical (≤14 days)
  const critical = certifications.filter(c => c.days_until_expiry >= 0 && c.days_until_expiry <= 14)
  if (critical.length > 0) {
    priorities.push(`${critical.length} certifications expire within 14 days - urgent training required`)
  }

  // Count by roster period for planning
  const rosterCounts = certifications.reduce((counts, cert) => {
    counts[cert.expiry_roster_period] = (counts[cert.expiry_roster_period] || 0) + 1
    return counts
  }, {} as Record<string, number>)

  const heavyRosters = Object.entries(rosterCounts).filter(([_, count]) => count >= 5)
  if (heavyRosters.length > 0) {
    priorities.push(`High training load in roster periods: ${heavyRosters.map(([roster, count]) => `${roster} (${count} certs)`).join(', ')}`)
  }

  // Category-specific recommendations
  const categoryGroups = groupCertificationsByCategory(certifications)
  Object.entries(categoryGroups).forEach(([category, certs]) => {
    const urgent = certs.filter(c => c.days_until_expiry <= 30).length
    if (urgent >= 3) {
      priorities.push(`${category} category has ${urgent} certifications requiring training within 30 days`)
    }
  })

  return priorities
}

// =============================================================================
// CERTIFICATION EXPIRY REPORT STYLES
// =============================================================================

const certificationExpiryStyles = StyleSheet.create({
  prioritySection: {
    backgroundColor: '#FFF3CD',
    borderColor: '#FFEAA7',
    borderWidth: 1,
    borderRadius: 4,
    padding: 12,
    marginBottom: 15,
  },

  priorityTitle: {
    fontSize: airNiuginiStyles.fonts.sizes.heading,
    fontWeight: 'bold',
    color: '#856404',
    marginBottom: 8,
  },

  priorityItem: {
    fontSize: airNiuginiStyles.fonts.sizes.body,
    color: '#856404',
    marginBottom: 4,
    paddingLeft: 8,
  },

  rosterPeriodTag: {
    backgroundColor: airNiuginiStyles.colors.primary + '20',
    color: airNiuginiStyles.colors.primary,
    borderRadius: 2,
    paddingHorizontal: 4,
    paddingVertical: 2,
    fontSize: 8,
    fontWeight: 'bold',
  },

  statusTag: {
    borderRadius: 2,
    paddingHorizontal: 4,
    paddingVertical: 2,
    fontSize: 8,
    fontWeight: 'bold',
  },

  metricCard: {
    backgroundColor: airNiuginiStyles.colors.gray.light,
    borderRadius: 4,
    padding: 8,
    marginRight: 8,
    minWidth: 60,
    alignItems: 'center',
  },

  metricNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: airNiuginiStyles.colors.primary,
  },

  metricLabel: {
    fontSize: 8,
    color: airNiuginiStyles.colors.gray.dark,
    textAlign: 'center',
  },
})

// =============================================================================
// PDF REPORT COMPONENTS
// =============================================================================

/**
 * Executive Summary Section
 */
interface ExecutiveSummaryProps {
  timeframeDays: number
  statistics: CertificationStatistics
}

const ExecutiveSummary: React.FC<ExecutiveSummaryProps> = ({ timeframeDays, statistics }) => (
  <Section title="Executive Summary">
    <View style={certificationExpiryStyles.prioritySection}>
      <Text style={[pdfStyles.sectionSubtitle, { marginBottom: 8 }]}>
        Certification Expiry Analysis - Next {timeframeDays} Days
      </Text>

      <Text style={[{ fontSize: airNiuginiStyles.fonts.sizes.body, marginBottom: 8, lineHeight: 1.4 }]}>
        Analysis Period: {format(new Date(), 'dd MMM yyyy')} - {format(new Date(Date.now() + timeframeDays * 24 * 60 * 60 * 1000), 'dd MMM yyyy')}
      </Text>

      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
        <View style={certificationExpiryStyles.metricCard}>
          <Text style={certificationExpiryStyles.metricNumber}>{statistics.totalCertifications}</Text>
          <Text style={certificationExpiryStyles.metricLabel}>Total Expiring</Text>
        </View>

        <View style={certificationExpiryStyles.metricCard}>
          <Text style={certificationExpiryStyles.metricNumber}>{statistics.totalPilots}</Text>
          <Text style={certificationExpiryStyles.metricLabel}>Pilots Affected</Text>
        </View>

        <View style={certificationExpiryStyles.metricCard}>
          <Text style={[certificationExpiryStyles.metricNumber, { color: '#DC2626' }]}>{statistics.byStatus.expired}</Text>
          <Text style={certificationExpiryStyles.metricLabel}>Expired</Text>
        </View>

        <View style={certificationExpiryStyles.metricCard}>
          <Text style={[certificationExpiryStyles.metricNumber, { color: '#D97706' }]}>{statistics.byStatus.expiring_soon}</Text>
          <Text style={certificationExpiryStyles.metricLabel}>Expiring Soon</Text>
        </View>

        <View style={certificationExpiryStyles.metricCard}>
          <Text style={[certificationExpiryStyles.metricNumber, { color: '#059669' }]}>{statistics.byStatus.upcoming}</Text>
          <Text style={certificationExpiryStyles.metricLabel}>Upcoming</Text>
        </View>
      </View>
    </View>
  </Section>
)

/**
 * Training Priorities Section
 */
interface TrainingPrioritiesProps {
  priorities: string[]
}

const TrainingPriorities: React.FC<TrainingPrioritiesProps> = ({ priorities }) => (
  <Section title="Training Priorities & Recommendations">
    {priorities.length === 0 ? (
      <AlertBox type="info" title="No Critical Priorities">
        <Text>No urgent training priorities identified for the selected timeframe.</Text>
      </AlertBox>
    ) : (
      <AlertBox type="warning" title="Training Action Required">
        <Text style={{ marginBottom: 6 }}>The following training priorities require attention:</Text>
        {priorities.map((priority, index) => (
          <Text key={index} style={certificationExpiryStyles.priorityItem}>
            • {priority}
          </Text>
        ))}
      </AlertBox>
    )}
  </Section>
)

/**
 * Roster Period Breakdown
 */
interface RosterBreakdownProps {
  statistics: CertificationStatistics
}

const RosterBreakdown: React.FC<RosterBreakdownProps> = ({ statistics }) => {
  const rosterStats = Object.entries(statistics.byRosterPeriod)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([period, count]) => ({ label: period, value: count }))

  return (
    <Section title="Roster Period Planning">
      <Text style={[pdfStyles.sectionSubtitle, { marginBottom: 6 }]}>
        Certifications Expiring by Roster Period
      </Text>
      <SummaryStats stats={rosterStats} />
    </Section>
  )
}

/**
 * Certification Table Section
 */
interface CertificationTableProps {
  certifications: ExpiringCertification[]
  title: string
  category: string
}

const CertificationTable: React.FC<CertificationTableProps> = ({ certifications, title, category }) => {
  const tableData = certifications
    .sort((a, b) => a.days_until_expiry - b.days_until_expiry)
    .map(cert => {
      const statusInfo = getStatusInfo(cert.days_until_expiry)
      return [
        cert.pilot_name || 'Unknown',
        cert.employee_id || 'N/A',
        cert.check_type_name,
        formatExpiryDate(cert.expiry_date),
        cert.expiry_roster_period,
        cert.days_until_expiry < 0
          ? `${Math.abs(cert.days_until_expiry)} days overdue`
          : `${cert.days_until_expiry} days`,
        statusInfo.label
      ]
    })

  return (
    <Section title={title} subtitle={`${certifications.length} certification${certifications.length !== 1 ? 's' : ''} - ${category} category`}>
      <PDFTable
        headers={['Pilot Name', 'Employee ID', 'Check Type', 'Expiry Date', 'Roster Period', 'Days Until Expiry', 'Status']}
        data={tableData}
        columnWidths={['15%', '10%', '18%', '12%', '10%', '12%', '13%']}
        statusColumn={6}
        highlightColumn={0}
      />
    </Section>
  )
}

// =============================================================================
// MAIN PDF DOCUMENT
// =============================================================================

/**
 * Create certification expiry report PDF document
 */
export function createCertificationExpiryReportDocument(data: CertificationExpiryReportData) {
  const { timeframeDays, expiringCertifications, generatedBy, generatedAt } = data

  const metadata: PDFReportMetadata = {
    reportType: 'certification-expiry-planning',
    title: 'Certification Expiry Planning Report',
    subtitle: `Expiring certifications for next ${timeframeDays} days`,
    companyName: 'Air Niugini',
    fleetType: 'B767',
    generatedAt: generatedAt.toISOString(),
    generatedBy,
    rosterPeriod: `${timeframeDays}-day planning window`,
    reportPeriod: `${format(new Date(), 'dd MMM yyyy')} - ${format(new Date(Date.now() + timeframeDays * 24 * 60 * 60 * 1000), 'dd MMM yyyy')}`
  }

  const statistics = calculateCertificationStatistics(expiringCertifications)
  const groupedCertifications = groupCertificationsByCategory(expiringCertifications)
  const priorities = analyzeTrainingPriorities(expiringCertifications)

  const totalPages = 1 + Object.keys(groupedCertifications).length

  return (
    <Document
      title={`${metadata.title} - ${timeframeDays} Days`}
      author="Air Niugini Pilot Management System"
      subject={`Certification expiry planning report for next ${timeframeDays} days`}
      keywords="Air Niugini, certification, expiry, training, planning, B767, pilot management"
      creator="Air Niugini PMS"
      producer="Air Niugini PMS"
    >
      {/* Summary Page */}
      <Page size="A4" style={pdfStyles.page}>
        <PDFHeader metadata={metadata} />

        <ExecutiveSummary timeframeDays={timeframeDays} statistics={statistics} />

        <TrainingPriorities priorities={priorities} />

        <RosterBreakdown statistics={statistics} />

        <PDFFooter pageNumber={1} totalPages={totalPages} />
      </Page>

      {/* Detailed pages for each category */}
      {Object.entries(groupedCertifications).map(([category, certifications], index) => (
        <Page key={category} size="A4" style={pdfStyles.page}>
          <PDFHeader metadata={metadata} />

          <CertificationTable
            certifications={certifications}
            title={`${category} Certifications`}
            category={category}
          />

          <PDFFooter pageNumber={index + 2} totalPages={totalPages} />
        </Page>
      ))}
    </Document>
  )
}

/**
 * Certification Expiry PDF Report Document (for backwards compatibility)
 */
export const CertificationExpiryReportDocument = createCertificationExpiryReportDocument

// =============================================================================
// EXPORT UTILITIES
// =============================================================================

/**
 * Generate PDF filename for the certification expiry report
 */
export function generateCertificationExpiryReportFilename(timeframeDays: number): string {
  const timestamp = format(new Date(), 'yyyyMMdd_HHmm')
  return `Air_Niugini_Certification_Expiry_${timeframeDays}days_${timestamp}.pdf`
}

/**
 * Create certification expiry report data structure
 */
export function createCertificationExpiryReportData(
  timeframeDays: number,
  expiringCertifications: ExpiringCertification[],
  generatedBy: string
): CertificationExpiryReportData {
  return {
    timeframeDays,
    expiringCertifications,
    generatedBy,
    generatedAt: new Date()
  }
}