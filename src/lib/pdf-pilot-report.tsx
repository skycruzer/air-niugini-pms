/**
 * @fileoverview Pilot Reports PDF Generator
 * Generates individual and summary pilot reports with certification details
 *
 * @author Air Niugini Development Team
 * @version 1.0.0
 * @since 2025-09-27
 */

import React from 'react';
import { Document, Page, Text, View } from '@react-pdf/renderer';
import { format, differenceInYears, differenceInDays } from 'date-fns';
import {
  PDFHeader,
  PDFFooter,
  SummaryStats,
  PDFTable,
  AlertBox,
  BulletList,
  Section,
  StatusBadge,
  pdfStyles,
} from './pdf-components';
import { PilotReportData, DetailedPilotRecord, PilotSummary } from '@/types/pdf-reports';

/**
 * Individual Pilot PDF Report Document
 */
interface IndividualPilotPDFProps {
  pilotRecord: DetailedPilotRecord;
  metadata: any;
}

export const IndividualPilotPDFDocument: React.FC<IndividualPilotPDFProps> = ({
  pilotRecord,
  metadata,
}) => {
  const { pilot, summary, certificationHistory, leaveHistory, performanceMetrics } = pilotRecord;

  // Calculate additional metrics
  const currentAge = pilot.date_of_birth
    ? differenceInYears(new Date(), new Date(pilot.date_of_birth))
    : null;
  const serviceYears = pilot.commencement_date
    ? differenceInYears(new Date(), new Date(pilot.commencement_date))
    : null;
  const retirementAge = 65; // Standard ICAO retirement age
  const yearsToRetirement = currentAge ? retirementAge - currentAge : null;

  return (
    <Document>
      {/* Page 1: Pilot Profile & Summary */}
      <Page size="A4" style={pdfStyles.page}>
        <PDFHeader
          metadata={{
            ...metadata,
            title: `Pilot Record: ${pilot.first_name} ${pilot.last_name}`,
            subtitle: `Employee ID: ${pilot.employee_id} | ${pilot.role}`,
          }}
        />

        {/* Pilot Information */}
        <Section title="Pilot Profile">
          <View style={[pdfStyles.flexRow, { marginBottom: 15 }]}>
            <View style={{ width: '50%' }}>
              <View style={pdfStyles.summaryCard}>
                <Text style={pdfStyles.sectionSubtitle}>Personal Information</Text>
                <View style={{ marginTop: 8 }}>
                  <Text style={pdfStyles.bulletText}>
                    <Text style={pdfStyles.bold}>Full Name:</Text> {pilot.first_name}{' '}
                    {pilot.middle_name ? pilot.middle_name + ' ' : ''}
                    {pilot.last_name}
                  </Text>
                  <Text style={pdfStyles.bulletText}>
                    <Text style={pdfStyles.bold}>Employee ID:</Text> {pilot.employee_id}
                  </Text>
                  <Text style={pdfStyles.bulletText}>
                    <Text style={pdfStyles.bold}>Role:</Text> {pilot.role}
                  </Text>
                  {pilot.nationality && (
                    <Text style={pdfStyles.bulletText}>
                      <Text style={pdfStyles.bold}>Nationality:</Text> {pilot.nationality}
                    </Text>
                  )}
                  {currentAge && (
                    <Text style={pdfStyles.bulletText}>
                      <Text style={pdfStyles.bold}>Age:</Text> {currentAge} years
                    </Text>
                  )}
                  {pilot.contract_type && (
                    <Text style={pdfStyles.bulletText}>
                      <Text style={pdfStyles.bold}>Contract Type:</Text> {pilot.contract_type}
                    </Text>
                  )}
                </View>
              </View>
            </View>

            <View style={{ width: '45%', marginLeft: '5%' }}>
              <View style={pdfStyles.summaryCard}>
                <Text style={pdfStyles.sectionSubtitle}>Service Information</Text>
                <View style={{ marginTop: 8 }}>
                  {pilot.commencement_date && (
                    <Text style={pdfStyles.bulletText}>
                      <Text style={pdfStyles.bold}>Commencement:</Text>{' '}
                      {format(new Date(pilot.commencement_date), 'dd/MM/yyyy')}
                    </Text>
                  )}
                  {serviceYears && (
                    <Text style={pdfStyles.bulletText}>
                      <Text style={pdfStyles.bold}>Years of Service:</Text> {serviceYears} years
                    </Text>
                  )}
                  {pilot.seniority_number && (
                    <Text style={pdfStyles.bulletText}>
                      <Text style={pdfStyles.bold}>Seniority Number:</Text> {pilot.seniority_number}
                    </Text>
                  )}
                  {yearsToRetirement && (
                    <Text style={pdfStyles.bulletText}>
                      <Text style={pdfStyles.bold}>Years to Retirement:</Text> {yearsToRetirement}{' '}
                      years
                    </Text>
                  )}
                  <Text style={pdfStyles.bulletText}>
                    <Text style={pdfStyles.bold}>Status:</Text>{' '}
                    {pilot.is_active ? 'Active' : 'Inactive'}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </Section>

        {/* Certification Overview */}
        <Section title="Certification Overview">
          <SummaryStats
            stats={[
              { label: 'Total Certifications', value: summary.totalCertifications },
              { label: 'Current', value: summary.currentCertifications, status: 'current' },
              { label: 'Expiring', value: summary.expiringCertifications, status: 'expiring' },
              { label: 'Expired', value: summary.expiredCertifications, status: 'expired' },
              {
                label: 'Compliance Status',
                value: summary.complianceStatus,
                status:
                  summary.complianceStatus === 'COMPLIANT'
                    ? 'current'
                    : summary.complianceStatus === 'AT_RISK'
                      ? 'expiring'
                      : 'expired',
              },
            ]}
          />
        </Section>

        {/* Captain Qualifications */}
        {pilot.role === 'Captain' && summary.captainQualifications.length > 0 && (
          <Section title="Captain Qualifications">
            <View style={[pdfStyles.flexRow, pdfStyles.marginBottom]}>
              {summary.captainQualifications.map((qual, index) => (
                <View
                  key={index}
                  style={[pdfStyles.summaryCard, { width: 'auto', marginRight: 10 }]}
                >
                  <Text style={[pdfStyles.bulletText, pdfStyles.bold]}>{qual}</Text>
                </View>
              ))}
            </View>
            {pilot.rhs_captain_expiry && (
              <Text style={pdfStyles.bulletText}>
                <Text style={pdfStyles.bold}>RHS Captain Authority Expires:</Text>{' '}
                {format(new Date(pilot.rhs_captain_expiry), 'dd/MM/yyyy')}
              </Text>
            )}
            {pilot.qualification_notes && (
              <Text style={pdfStyles.bulletText}>
                <Text style={pdfStyles.bold}>Notes:</Text> {pilot.qualification_notes}
              </Text>
            )}
          </Section>
        )}

        {/* Compliance Alerts */}
        {summary.expiredCertifications > 0 && (
          <AlertBox type="critical" title="🚨 Expired Certifications">
            <Text>
              This pilot has {summary.expiredCertifications} expired certification(s) that require
              immediate renewal to maintain operational eligibility and regulatory compliance.
            </Text>
          </AlertBox>
        )}

        {summary.expiringCertifications > 0 && (
          <AlertBox type="warning" title="⏰ Expiring Certifications">
            <Text>
              {summary.expiringCertifications} certification(s) are expiring soon and need to be
              scheduled for renewal.
            </Text>
          </AlertBox>
        )}

        <PDFFooter pageNumber={1} totalPages={leaveHistory && leaveHistory.length > 0 ? 3 : 2} />
      </Page>

      {/* Page 2: Certification Details */}
      <Page size="A4" style={pdfStyles.page}>
        <PDFHeader
          metadata={{
            ...metadata,
            title: `Certification History: ${pilot.first_name} ${pilot.last_name}`,
            subtitle: `Complete certification record and status`,
          }}
        />

        {/* Current Certifications */}
        <Section title="Current Certification Status">
          <PDFTable
            headers={['Certification', 'Completed Date', 'Expiry Date', 'Status', 'Days to Expiry']}
            columnWidths={['35%', '16%', '16%', '16%', '17%']}
            data={certificationHistory.map((cert) => [
              cert.checkType,
              cert.completedDate
                ? format(new Date(cert.completedDate), 'dd/MM/yyyy')
                : 'Not Completed',
              cert.expiryDate ? format(new Date(cert.expiryDate), 'dd/MM/yyyy') : 'N/A',
              cert.status,
              cert.daysUntilExpiry?.toString() || 'N/A',
            ])}
            statusColumn={3}
          />
        </Section>

        {/* Training Requirements */}
        {summary.nextRequiredTraining && (
          <Section title="Upcoming Training Requirements">
            <AlertBox type="info" title="Next Required Training">
              <Text>{summary.nextRequiredTraining}</Text>
            </AlertBox>
          </Section>
        )}

        {/* Detailed Certification Breakdown */}
        <Section title="Certification Categories">
          {/* Group certifications by category for better organization */}
          {(() => {
            const categories = Array.from(
              new Set(
                certificationHistory.map((cert) => {
                  // Extract category from checkType - simplified categorization
                  if (cert.checkType.includes('PC') || cert.checkType.includes('Proficiency'))
                    return 'Proficiency Checks';
                  if (cert.checkType.includes('LPC') || cert.checkType.includes('Line'))
                    return 'Line Checks';
                  if (cert.checkType.includes('Medical') || cert.checkType.includes('Health'))
                    return 'Medical';
                  if (cert.checkType.includes('SEP') || cert.checkType.includes('Safety'))
                    return 'Safety & Emergency';
                  if (cert.checkType.includes('Training') || cert.checkType.includes('Course'))
                    return 'Training Courses';
                  return 'Other';
                })
              )
            );

            return categories.map((category) => {
              const categoryCerts = certificationHistory.filter((cert) => {
                if (category === 'Proficiency Checks')
                  return cert.checkType.includes('PC') || cert.checkType.includes('Proficiency');
                if (category === 'Line Checks')
                  return cert.checkType.includes('LPC') || cert.checkType.includes('Line');
                if (category === 'Medical')
                  return cert.checkType.includes('Medical') || cert.checkType.includes('Health');
                if (category === 'Safety & Emergency')
                  return cert.checkType.includes('SEP') || cert.checkType.includes('Safety');
                if (category === 'Training Courses')
                  return cert.checkType.includes('Training') || cert.checkType.includes('Course');
                return (
                  !cert.checkType.includes('PC') &&
                  !cert.checkType.includes('LPC') &&
                  !cert.checkType.includes('Medical') &&
                  !cert.checkType.includes('SEP') &&
                  !cert.checkType.includes('Training')
                );
              });

              if (categoryCerts.length === 0) return null;

              const currentCount = categoryCerts.filter((c) => c.status === 'CURRENT').length;
              const expiringCount = categoryCerts.filter((c) => c.status === 'EXPIRING').length;
              const expiredCount = categoryCerts.filter((c) => c.status === 'EXPIRED').length;

              return (
                <View key={category} style={pdfStyles.marginBottom}>
                  <Text style={pdfStyles.sectionSubtitle}>{category}</Text>
                  <View style={[pdfStyles.flexRow, { marginTop: 5, marginBottom: 8 }]}>
                    <Text style={[pdfStyles.statusCurrent, { marginRight: 15 }]}>
                      Current: {currentCount}
                    </Text>
                    <Text style={[pdfStyles.statusExpiring, { marginRight: 15 }]}>
                      Expiring: {expiringCount}
                    </Text>
                    <Text style={pdfStyles.statusExpired}>Expired: {expiredCount}</Text>
                  </View>
                  <BulletList
                    items={categoryCerts.map(
                      (cert) =>
                        `${cert.checkType} - ${cert.status}${cert.expiryDate ? ` (Expires: ${format(new Date(cert.expiryDate), 'dd/MM/yyyy')})` : ''}`
                    )}
                  />
                </View>
              );
            });
          })()}
        </Section>

        <PDFFooter pageNumber={2} totalPages={leaveHistory && leaveHistory.length > 0 ? 3 : 2} />
      </Page>

      {/* Page 3: Leave History & Performance (Optional) */}
      {leaveHistory && leaveHistory.length > 0 && (
        <Page size="A4" style={pdfStyles.page}>
          <PDFHeader
            metadata={{
              ...metadata,
              title: `Leave History: ${pilot.first_name} ${pilot.last_name}`,
              subtitle: `Leave utilization and performance metrics`,
            }}
          />

          {/* Leave History */}
          <Section title="Recent Leave History">
            <PDFTable
              headers={['Type', 'Start Date', 'End Date', 'Days', 'Status', 'Roster Period']}
              columnWidths={['18%', '16%', '16%', '10%', '15%', '25%']}
              data={leaveHistory
                .slice(0, 10)
                .map((leave) => [
                  leave.requestType,
                  format(new Date(leave.startDate), 'dd/MM/yyyy'),
                  format(new Date(leave.endDate), 'dd/MM/yyyy'),
                  leave.daysCount.toString(),
                  leave.status,
                  leave.rosterPeriod,
                ])}
            />
          </Section>

          {/* Performance Metrics */}
          {performanceMetrics && (
            <Section title="Performance Metrics">
              <SummaryStats
                stats={[
                  {
                    label: 'On-time Compliance',
                    value: `${performanceMetrics.onTimeComplianceRate}%`,
                    status: performanceMetrics.onTimeComplianceRate >= 95 ? 'current' : 'expiring',
                  },
                  {
                    label: 'Training Completion',
                    value: `${performanceMetrics.trainingCompletionRate}%`,
                    status:
                      performanceMetrics.trainingCompletionRate >= 90 ? 'current' : 'expiring',
                  },
                  { label: 'Leave Utilization', value: `${performanceMetrics.leaveUtilization}%` },
                ]}
              />
            </Section>
          )}

          {/* Notes and Recommendations */}
          <Section title="Notes and Recommendations">
            <View style={pdfStyles.bulletList}>
              {summary.complianceStatus !== 'COMPLIANT' && (
                <View style={pdfStyles.bulletItem}>
                  <Text style={pdfStyles.bullet}>•</Text>
                  <Text style={pdfStyles.bulletText}>
                    Priority focus on expired certifications to restore compliance status
                  </Text>
                </View>
              )}
              {summary.expiringCertifications > 0 && (
                <View style={pdfStyles.bulletItem}>
                  <Text style={pdfStyles.bullet}>•</Text>
                  <Text style={pdfStyles.bulletText}>
                    Schedule renewal training for expiring certifications within the next 30 days
                  </Text>
                </View>
              )}
              {yearsToRetirement && yearsToRetirement <= 5 && (
                <View style={pdfStyles.bulletItem}>
                  <Text style={pdfStyles.bullet}>•</Text>
                  <Text style={pdfStyles.bulletText}>
                    Consider succession planning - pilot approaching retirement age
                  </Text>
                </View>
              )}
            </View>
          </Section>

          <PDFFooter pageNumber={3} totalPages={3} />
        </Page>
      )}
    </Document>
  );
};

/**
 * Pilot Summary Report for multiple pilots
 */
interface PilotSummaryPDFProps {
  reportData: PilotReportData;
}

export const PilotSummaryPDFDocument: React.FC<PilotSummaryPDFProps> = ({ reportData }) => {
  const { metadata, pilots, summary } = reportData;

  return (
    <Document>
      <Page size="A4" style={pdfStyles.page}>
        <PDFHeader
          metadata={{
            ...metadata,
            title: 'Pilot Summary Report',
            subtitle: `Complete pilot roster overview (${pilots.length} pilots)`,
          }}
        />

        {/* Fleet Summary */}
        <Section title="Fleet Pilot Summary">
          <SummaryStats
            stats={[
              { label: 'Total Pilots', value: summary.totalPilots },
              { label: 'Average Age', value: `${summary.averageAge} years` },
              { label: 'Average Service', value: `${summary.averageServiceYears} years` },
              {
                label: 'Compliant Pilots',
                value: summary.complianceDistribution.compliant,
                status: 'current',
              },
              {
                label: 'At Risk Pilots',
                value: summary.complianceDistribution.atRisk,
                status: 'expiring',
              },
              {
                label: 'Non-Compliant',
                value: summary.complianceDistribution.nonCompliant,
                status: 'expired',
              },
            ]}
          />
        </Section>

        {/* Pilot Roster Table */}
        <Section title="Complete Pilot Roster">
          <PDFTable
            headers={[
              'Name',
              'ID',
              'Role',
              'Seniority',
              'Age',
              'Service',
              'Current',
              'Expiring',
              'Expired',
              'Status',
            ]}
            columnWidths={['18%', '8%', '10%', '8%', '7%', '8%', '8%', '8%', '8%', '17%']}
            data={pilots.slice(0, 20).map((pilotRecord) => {
              const pilot = pilotRecord.pilot;
              const summary = pilotRecord.summary;
              const age = pilot.date_of_birth
                ? differenceInYears(new Date(), new Date(pilot.date_of_birth))
                : 'N/A';
              const service = pilot.commencement_date
                ? differenceInYears(new Date(), new Date(pilot.commencement_date))
                : 'N/A';

              return [
                `${pilot.first_name} ${pilot.last_name}`,
                pilot.employee_id,
                pilot.role,
                pilot.seniority_number?.toString() || 'N/A',
                age.toString(),
                service.toString(),
                summary.currentCertifications.toString(),
                summary.expiringCertifications.toString(),
                summary.expiredCertifications.toString(),
                summary.complianceStatus,
              ];
            })}
            statusColumn={9}
          />

          {pilots.length > 20 && (
            <Text style={pdfStyles.metadata}>
              Showing first 20 pilots. Complete roster available in individual reports.
            </Text>
          )}
        </Section>

        {/* Non-Compliant Pilots Alert */}
        {summary.complianceDistribution.nonCompliant > 0 && (
          <AlertBox type="critical" title="Non-Compliant Pilots">
            <Text>
              {summary.complianceDistribution.nonCompliant} pilot(s) are currently non-compliant
              with certification requirements. Immediate action is required to restore operational
              capacity.
            </Text>
          </AlertBox>
        )}

        <PDFFooter pageNumber={1} totalPages={1} />
      </Page>
    </Document>
  );
};
