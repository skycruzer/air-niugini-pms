/**
 * @fileoverview Fleet Compliance PDF Report Generator
 * Generates comprehensive compliance reports with certification status analysis
 *
 * @author Air Niugini Development Team
 * @version 1.0.0
 * @since 2025-09-27
 */

import React from 'react'
import { Document, Page, Text, View } from '@react-pdf/renderer'
import { format } from 'date-fns'
import {
  PDFHeader,
  PDFFooter,
  SummaryStats,
  PDFTable,
  AlertBox,
  BulletList,
  Section,
  pdfStyles
} from './pdf-components'
import { ComplianceReportData } from '@/types/pdf-reports'

/**
 * Fleet Compliance PDF Document Component
 */
interface CompliancePDFDocumentProps {
  reportData: ComplianceReportData
}

export const CompliancePDFDocument: React.FC<CompliancePDFDocumentProps> = ({ reportData }) => {
  const { metadata, overview, expirationBreakdown, complianceByCategory, pilotComplianceStatus, expiredCertifications, expiringCertifications, recommendations } = reportData

  return (
    <Document>
      {/* Page 1: Executive Summary */}
      <Page size="A4" style={pdfStyles.page}>
        <PDFHeader metadata={metadata} />

        {/* Fleet Overview Statistics */}
        <Section title="Fleet Compliance Overview">
          <SummaryStats
            stats={[
              { label: 'Total Pilots', value: overview.totalPilots },
              { label: 'Total Certifications', value: overview.totalCertifications },
              { label: 'Current Certifications', value: overview.currentCertifications, status: 'current' },
              { label: 'Expiring Soon', value: overview.expiringCertifications, status: 'expiring' },
              { label: 'Expired', value: overview.expiredCertifications, status: 'expired' },
            ]}
          />

          <View style={[pdfStyles.flexRow, pdfStyles.justifyBetween, { marginTop: 15 }]}>
            <View style={{ width: '45%' }}>
              <Text style={[pdfStyles.summaryValue, { color: overview.complianceRate >= 90 ? '#059669' : overview.complianceRate >= 75 ? '#D97706' : '#DC2626' }]}>
                {overview.complianceRate}%
              </Text>
              <Text style={pdfStyles.summaryLabel}>Overall Compliance Rate</Text>
            </View>
            <View style={{ width: '45%' }}>
              <Text style={pdfStyles.metadata}>
                Last Updated: {format(new Date(overview.lastUpdated), 'dd/MM/yyyy HH:mm')}
              </Text>
            </View>
          </View>
        </Section>

        {/* Expiration Timeline */}
        <Section title="Certification Expiration Timeline">
          <SummaryStats
            stats={[
              { label: 'Next 7 Days', value: expirationBreakdown.next7Days, status: expirationBreakdown.next7Days > 0 ? 'critical' : 'current' },
              { label: 'Next 14 Days', value: expirationBreakdown.next14Days, status: expirationBreakdown.next14Days > 5 ? 'expired' : 'current' },
              { label: 'Next 30 Days', value: expirationBreakdown.next30Days, status: expirationBreakdown.next30Days > 10 ? 'expiring' : 'current' },
              { label: 'Next 60 Days', value: expirationBreakdown.next60Days },
              { label: 'Next 90 Days', value: expirationBreakdown.next90Days },
            ]}
          />
        </Section>

        {/* Critical Alerts */}
        {overview.expiredCertifications > 0 && (
          <AlertBox type="critical" title="🚨 Immediate Action Required">
            <Text>
              {overview.expiredCertifications} certifications have expired and require immediate renewal.
              This affects fleet operational capacity and regulatory compliance.
            </Text>
          </AlertBox>
        )}

        {expirationBreakdown.next7Days > 0 && (
          <AlertBox type="warning" title="⏰ Urgent Renewals">
            <Text>
              {expirationBreakdown.next7Days} certifications expire within the next 7 days.
              Schedule renewal training immediately to avoid operational disruption.
            </Text>
          </AlertBox>
        )}

        {/* Compliance by Category */}
        <Section title="Compliance Status by Certification Category">
          <PDFTable
            headers={['Category', 'Total', 'Current', 'Expiring', 'Expired', 'Compliance %']}
            columnWidths={['30%', '14%', '14%', '14%', '14%', '14%']}
            data={complianceByCategory.map(cat => [
              cat.category,
              cat.totalChecks.toString(),
              cat.currentChecks.toString(),
              cat.expiringChecks.toString(),
              cat.expiredChecks.toString(),
              `${cat.compliancePercentage}%`
            ])}
            statusColumn={5}
          />
        </Section>

        <PDFFooter pageNumber={1} totalPages={3} />
      </Page>

      {/* Page 2: Detailed Compliance Analysis */}
      <Page size="A4" style={pdfStyles.page}>
        <PDFHeader metadata={metadata} />

        {/* Pilot Risk Assessment */}
        <Section title="Pilot Compliance Risk Assessment">
          <Text style={pdfStyles.sectionSubtitle}>
            Individual pilot compliance status and risk categorization
          </Text>

          <PDFTable
            headers={['Pilot Name', 'Employee ID', 'Role', 'Current', 'Expiring', 'Expired', 'Risk Level']}
            columnWidths={['25%', '12%', '13%', '10%', '10%', '10%', '20%']}
            data={pilotComplianceStatus.slice(0, 15).map(pilot => [
              `${pilot.pilot.first_name} ${pilot.pilot.last_name}`,
              pilot.pilot.employee_id,
              pilot.pilot.role,
              pilot.currentChecks.toString(),
              pilot.expiringChecks.toString(),
              pilot.expiredChecks.toString(),
              pilot.riskLevel
            ])}
            statusColumn={6}
          />

          {pilotComplianceStatus.length > 15 && (
            <Text style={[pdfStyles.metadata, { marginTop: 5 }]}>
              Showing first 15 pilots. Complete list available in detailed reports.
            </Text>
          )}
        </Section>

        {/* High Risk Pilots */}
        {pilotComplianceStatus.filter(p => p.riskLevel === 'HIGH' || p.riskLevel === 'CRITICAL').length > 0 && (
          <Section title="High Risk Pilots - Priority Action Required">
            <View style={pdfStyles.bulletList}>
              {pilotComplianceStatus
                .filter(p => p.riskLevel === 'HIGH' || p.riskLevel === 'CRITICAL')
                .slice(0, 8)
                .map((pilot, index) => (
                  <View key={index} style={pdfStyles.bulletItem}>
                    <Text style={pdfStyles.bullet}>•</Text>
                    <Text style={pdfStyles.bulletText}>
                      <Text style={pilot.riskLevel === 'CRITICAL' ? pdfStyles.statusCritical : pdfStyles.statusExpired}>
                        {pilot.pilot.first_name} {pilot.pilot.last_name}
                      </Text>
                      {` (${pilot.pilot.employee_id}) - ${pilot.pilot.role}: `}
                      {pilot.expiredChecks > 0 && `${pilot.expiredChecks} expired, `}
                      {pilot.expiringChecks > 0 && `${pilot.expiringChecks} expiring`}
                      {pilot.priorityActions.length > 0 && ` - ${pilot.priorityActions[0]}`}
                    </Text>
                  </View>
                ))}
            </View>
          </Section>
        )}

        <PDFFooter pageNumber={2} totalPages={3} />
      </Page>

      {/* Page 3: Expired and Expiring Certifications */}
      <Page size="A4" style={pdfStyles.page}>
        <PDFHeader metadata={metadata} />

        {/* Expired Certifications */}
        {expiredCertifications.length > 0 && (
          <Section title="Expired Certifications - Immediate Action Required">
            <AlertBox type="critical" title="Regulatory Compliance Risk">
              <Text>
                The following certifications have expired and must be renewed immediately to maintain
                regulatory compliance and operational capacity.
              </Text>
            </AlertBox>

            <PDFTable
              headers={['Pilot', 'Employee ID', 'Certification', 'Expired Date', 'Days Overdue']}
              columnWidths={['25%', '15%', '25%', '20%', '15%']}
              data={expiredCertifications.slice(0, 12).map(cert => [
                cert.pilot,
                cert.employeeId,
                cert.checkType,
                format(new Date(cert.expiryDate), 'dd/MM/yyyy'),
                cert.daysOverdue.toString()
              ])}
              statusColumn={4}
            />

            {expiredCertifications.length > 12 && (
              <Text style={pdfStyles.metadata}>
                Showing first 12 expired certifications. Total: {expiredCertifications.length}
              </Text>
            )}
          </Section>
        )}

        {/* Expiring Certifications */}
        {expiringCertifications.length > 0 && (
          <Section title="Expiring Certifications - Schedule Renewals">
            <PDFTable
              headers={['Pilot', 'Employee ID', 'Certification', 'Expiry Date', 'Days Remaining']}
              columnWidths={['25%', '15%', '25%', '20%', '15%']}
              data={expiringCertifications.slice(0, 10).map(cert => [
                cert.pilot,
                cert.employeeId,
                cert.checkType,
                format(new Date(cert.expiryDate), 'dd/MM/yyyy'),
                cert.daysUntilExpiry.toString()
              ])}
              statusColumn={4}
            />

            {expiringCertifications.length > 10 && (
              <Text style={pdfStyles.metadata}>
                Showing first 10 expiring certifications. Total: {expiringCertifications.length}
              </Text>
            )}
          </Section>
        )}

        {/* Recommendations */}
        {recommendations.length > 0 && (
          <Section title="Compliance Improvement Recommendations">
            <BulletList items={recommendations} />
          </Section>
        )}

        {/* Report Footer */}
        <View style={{ position: 'absolute', bottom: 80, left: 0, right: 0 }}>
          <AlertBox type="info" title="Report Notes">
            <Text>
              • This report is generated from live database information and reflects current status as of {format(new Date(metadata.generatedAt), 'dd/MM/yyyy HH:mm')}.
              {'\n'}• Compliance percentages are calculated based on current certifications vs. total required certifications.
              {'\n'}• Risk levels: LOW (0 expired), MEDIUM (1-2 expired), HIGH (3-4 expired), CRITICAL (5+ expired).
              {'\n'}• This document contains sensitive operational information and should be treated as confidential.
            </Text>
          </AlertBox>
        </View>

        <PDFFooter pageNumber={3} totalPages={3} />
      </Page>
    </Document>
  )
}

/**
 * Risk Assessment PDF Document for focused risk analysis
 */
interface RiskAssessmentPDFProps {
  reportData: ComplianceReportData
}

export const RiskAssessmentPDFDocument: React.FC<RiskAssessmentPDFProps> = ({ reportData }) => {
  const { metadata, overview, expiredCertifications, expiringCertifications, pilotComplianceStatus } = reportData

  const highRiskPilots = pilotComplianceStatus.filter(p => p.riskLevel === 'HIGH' || p.riskLevel === 'CRITICAL')
  const mediumRiskPilots = pilotComplianceStatus.filter(p => p.riskLevel === 'MEDIUM')

  return (
    <Document>
      <Page size="A4" style={pdfStyles.page}>
        <PDFHeader metadata={{
          ...metadata,
          title: 'Fleet Risk Assessment Report',
          subtitle: 'Critical and High-Risk Certification Analysis'
        }} />

        {/* Risk Overview */}
        <Section title="Risk Assessment Overview">
          <SummaryStats
            stats={[
              { label: 'Critical Risk Pilots', value: pilotComplianceStatus.filter(p => p.riskLevel === 'CRITICAL').length, status: 'critical' },
              { label: 'High Risk Pilots', value: pilotComplianceStatus.filter(p => p.riskLevel === 'HIGH').length, status: 'expired' },
              { label: 'Medium Risk Pilots', value: mediumRiskPilots.length, status: 'expiring' },
              { label: 'Expired Certifications', value: overview.expiredCertifications, status: 'expired' },
              { label: 'Expiring (7 Days)', value: expiredCertifications.filter(c => c.daysOverdue <= 7).length, status: 'critical' },
            ]}
          />
        </Section>

        {/* Critical Alerts */}
        <AlertBox type="critical" title="🚨 IMMEDIATE ACTION REQUIRED">
          <Text>
            {highRiskPilots.length} pilots are classified as HIGH or CRITICAL risk due to expired certifications.
            This poses significant operational and regulatory compliance risks.
          </Text>
        </AlertBox>

        {/* Critical Risk Pilots */}
        {highRiskPilots.length > 0 && (
          <Section title="Critical & High Risk Pilots">
            <PDFTable
              headers={['Pilot', 'Employee ID', 'Role', 'Expired', 'Risk Level', 'Priority Action']}
              columnWidths={['22%', '12%', '12%', '10%', '12%', '32%']}
              data={highRiskPilots.map(pilot => [
                `${pilot.pilot.first_name} ${pilot.pilot.last_name}`,
                pilot.pilot.employee_id,
                pilot.pilot.role,
                pilot.expiredChecks.toString(),
                pilot.riskLevel,
                pilot.priorityActions[0] || 'Schedule immediate renewal'
              ])}
              statusColumn={4}
            />
          </Section>
        )}

        {/* Expired Certifications Detail */}
        <Section title="Expired Certifications by Severity">
          <PDFTable
            headers={['Pilot', 'Certification', 'Expired Date', 'Days Overdue', 'Category', 'Severity']}
            columnWidths={['20%', '20%', '15%', '12%', '18%', '15%']}
            data={expiredCertifications
              .sort((a, b) => b.daysOverdue - a.daysOverdue)
              .slice(0, 15)
              .map(cert => [
                cert.pilot,
                cert.checkType,
                format(new Date(cert.expiryDate), 'dd/MM/yyyy'),
                cert.daysOverdue.toString(),
                cert.category,
                cert.daysOverdue > 30 ? 'CRITICAL' : cert.daysOverdue > 14 ? 'HIGH' : 'MEDIUM'
              ])}
            statusColumn={5}
          />
        </Section>

        <PDFFooter pageNumber={1} totalPages={1} />
      </Page>
    </Document>
  )
}