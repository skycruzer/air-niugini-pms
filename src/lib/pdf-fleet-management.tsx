/**
 * @fileoverview Fleet Management PDF Reports Generator
 * Generates comprehensive fleet management reports including roster analysis, captain qualifications, and operational readiness
 *
 * @author Air Niugini Development Team
 * @version 1.0.0
 * @since 2025-09-27
 */

import React from 'react';
import { Document, Page, Text, View } from '@react-pdf/renderer';
import { format, differenceInYears } from 'date-fns';
import {
  PDFHeader,
  PDFFooter,
  SummaryStats,
  PDFTable,
  AlertBox,
  BulletList,
  Section,
  pdfStyles,
} from './pdf-components';
import {
  FleetManagementReportData,
  CaptainQualification,
  LeaveAnalysis,
  OperationalReadiness,
} from '@/types/pdf-reports';

/**
 * Complete Fleet Management Report
 */
interface FleetManagementPDFProps {
  reportData: FleetManagementReportData;
}

export const FleetManagementPDFDocument: React.FC<FleetManagementPDFProps> = ({ reportData }) => {
  const {
    metadata,
    rosterAnalysis,
    captainQualifications,
    leaveAnalysis,
    operationalReadiness,
    upcomingRetirements,
    recommendations,
  } = reportData;

  return (
    <Document>
      {/* Page 1: Fleet Overview & Roster Analysis */}
      <Page size="A4" style={pdfStyles.page}>
        <PDFHeader metadata={metadata} />

        {/* Fleet Overview */}
        <Section title="Fleet Roster Overview">
          <SummaryStats
            stats={[
              { label: 'Total Pilots', value: rosterAnalysis.totalPilots },
              { label: 'Active Pilots', value: rosterAnalysis.activePilots, status: 'current' },
              { label: 'Captains', value: rosterAnalysis.captains },
              { label: 'First Officers', value: rosterAnalysis.firstOfficers },
              {
                label: 'Inactive Pilots',
                value: rosterAnalysis.inactivePilots,
                status: rosterAnalysis.inactivePilots > 0 ? 'expiring' : 'current',
              },
            ]}
          />
        </Section>

        {/* Contract Type Distribution */}
        <Section title="Contract Type Distribution">
          <View style={[pdfStyles.flexRow, { marginBottom: 15 }]}>
            <View style={{ width: '30%' }}>
              <View style={pdfStyles.summaryCard}>
                <Text style={pdfStyles.summaryValue}>{rosterAnalysis.contractTypes.fulltime}</Text>
                <Text style={pdfStyles.summaryLabel}>Full-time</Text>
              </View>
            </View>
            <View style={{ width: '30%', marginLeft: '5%' }}>
              <View style={pdfStyles.summaryCard}>
                <Text style={pdfStyles.summaryValue}>{rosterAnalysis.contractTypes.contract}</Text>
                <Text style={pdfStyles.summaryLabel}>Contract</Text>
              </View>
            </View>
            <View style={{ width: '30%', marginLeft: '5%' }}>
              <View style={pdfStyles.summaryCard}>
                <Text style={pdfStyles.summaryValue}>{rosterAnalysis.contractTypes.casual}</Text>
                <Text style={pdfStyles.summaryLabel}>Casual</Text>
              </View>
            </View>
          </View>
        </Section>

        {/* Seniority Distribution */}
        <Section title="Seniority Distribution">
          <PDFTable
            headers={['Seniority Range', 'Number of Pilots', 'Percentage']}
            columnWidths={['40%', '30%', '30%']}
            data={rosterAnalysis.seniorityDistribution.map((dist) => [
              dist.range,
              dist.count.toString(),
              `${Math.round((dist.count / rosterAnalysis.totalPilots) * 100)}%`,
            ])}
          />
        </Section>

        {/* Age Distribution */}
        <Section title="Age Distribution">
          <PDFTable
            headers={['Age Range', 'Number of Pilots', 'Percentage']}
            columnWidths={['40%', '30%', '30%']}
            data={rosterAnalysis.ageDistribution.map((dist) => [
              dist.range,
              dist.count.toString(),
              `${Math.round((dist.count / rosterAnalysis.totalPilots) * 100)}%`,
            ])}
          />
        </Section>

        {/* Operational Readiness Alert */}
        {operationalReadiness.riskAssessment !== 'LOW' && (
          <AlertBox
            type={operationalReadiness.riskAssessment === 'CRITICAL' ? 'critical' : 'warning'}
            title={`${operationalReadiness.riskAssessment} Risk Level Identified`}
          >
            <Text>
              Fleet operational readiness is at {operationalReadiness.riskAssessment} risk level.
              Immediate attention required to maintain operational capacity.
            </Text>
          </AlertBox>
        )}

        <PDFFooter pageNumber={1} totalPages={4} />
      </Page>

      {/* Page 2: Captain Qualifications Matrix */}
      <Page size="A4" style={pdfStyles.page}>
        <PDFHeader
          metadata={{
            ...metadata,
            title: 'Captain Qualifications Matrix',
            subtitle: 'B767 Captain Authority and Qualifications Overview',
          }}
        />

        <Section title="Captain Qualifications Overview">
          <Text style={pdfStyles.sectionSubtitle}>
            Complete breakdown of captain qualifications and authorities within the B767 fleet
          </Text>

          <PDFTable
            headers={[
              'Captain Name',
              'Employee ID',
              'Line Capt',
              'Training Capt',
              'Examiner',
              'Instructor',
              'Check Airman',
              'Total Quals',
            ]}
            columnWidths={['20%', '12%', '11%', '11%', '11%', '11%', '12%', '12%']}
            data={captainQualifications.map((qual) => [
              `${qual.pilot.first_name} ${qual.pilot.last_name}`,
              qual.pilot.employee_id,
              qual.lineCaptain ? '✓' : '✗',
              qual.trainingCaptain ? '✓' : '✗',
              qual.examiner ? '✓' : '✗',
              qual.instructor ? '✓' : '✗',
              qual.checkAirman ? '✓' : '✗',
              qual.totalQualifications.toString(),
            ])}
            highlightColumn={7}
          />
        </Section>

        {/* RHS Captain Authority Expiries */}
        {captainQualifications.filter((q) => q.rhsCaptainExpiry).length > 0 && (
          <Section title="RHS Captain Authority Expiries">
            <PDFTable
              headers={['Captain', 'Employee ID', 'RHS Expiry Date', 'Days Remaining', 'Status']}
              columnWidths={['25%', '15%', '20%', '20%', '20%']}
              data={captainQualifications
                .filter((q) => q.rhsCaptainExpiry)
                .map((qual) => {
                  const expiryDate = new Date(qual.rhsCaptainExpiry!);
                  const daysRemaining = Math.ceil(
                    (expiryDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
                  );
                  const status =
                    daysRemaining < 0 ? 'EXPIRED' : daysRemaining <= 30 ? 'EXPIRING' : 'CURRENT';

                  return [
                    `${qual.pilot.first_name} ${qual.pilot.last_name}`,
                    qual.pilot.employee_id,
                    format(expiryDate, 'dd/MM/yyyy'),
                    daysRemaining.toString(),
                    status,
                  ];
                })}
              statusColumn={4}
            />
          </Section>
        )}

        {/* Qualification Statistics */}
        <Section title="Qualification Statistics">
          <SummaryStats
            stats={[
              {
                label: 'Line Captains',
                value: captainQualifications.filter((q) => q.lineCaptain).length,
              },
              {
                label: 'Training Captains',
                value: captainQualifications.filter((q) => q.trainingCaptain).length,
              },
              { label: 'Examiners', value: captainQualifications.filter((q) => q.examiner).length },
              {
                label: 'Instructors',
                value: captainQualifications.filter((q) => q.instructor).length,
              },
              {
                label: 'Check Airmen',
                value: captainQualifications.filter((q) => q.checkAirman).length,
              },
            ]}
          />
        </Section>

        {/* Qualification Notes */}
        {captainQualifications.filter((q) => q.qualificationNotes).length > 0 && (
          <Section title="Special Qualification Notes">
            <View style={pdfStyles.bulletList}>
              {captainQualifications
                .filter((q) => q.qualificationNotes)
                .slice(0, 8)
                .map((qual, index) => (
                  <View key={index} style={pdfStyles.bulletItem}>
                    <Text style={pdfStyles.bullet}>•</Text>
                    <Text style={pdfStyles.bulletText}>
                      <Text style={pdfStyles.bold}>
                        {qual.pilot.first_name} {qual.pilot.last_name}:
                      </Text>{' '}
                      {qual.qualificationNotes}
                    </Text>
                  </View>
                ))}
            </View>
          </Section>
        )}

        <PDFFooter pageNumber={2} totalPages={4} />
      </Page>

      {/* Page 3: Leave Analysis & Operational Readiness */}
      <Page size="A4" style={pdfStyles.page}>
        <PDFHeader
          metadata={{
            ...metadata,
            title: 'Leave Analysis & Operational Readiness',
            subtitle: `Roster Period: ${leaveAnalysis.rosterPeriod}`,
          }}
        />

        {/* Leave Request Summary */}
        <Section title="Leave Request Analysis">
          <SummaryStats
            stats={[
              { label: 'Total Requests', value: leaveAnalysis.totalRequests },
              { label: 'Approved', value: leaveAnalysis.approvedRequests, status: 'current' },
              { label: 'Pending', value: leaveAnalysis.pendingRequests, status: 'expiring' },
              { label: 'Rejected', value: leaveAnalysis.rejectedRequests, status: 'expired' },
              { label: 'Total Leave Days', value: leaveAnalysis.totalLeaveDays },
            ]}
          />
        </Section>

        {/* Leave by Type */}
        <Section title="Leave Breakdown by Type">
          <PDFTable
            headers={['Leave Type', 'Number of Requests', 'Total Days', 'Average Duration']}
            columnWidths={['35%', '25%', '20%', '20%']}
            data={leaveAnalysis.leaveByType.map((type) => [
              type.type,
              type.count.toString(),
              type.totalDays.toString(),
              `${Math.round((type.totalDays / type.count) * 10) / 10} days`,
            ])}
          />
        </Section>

        {/* Operational Readiness */}
        <Section title="Current Operational Readiness">
          <View style={[pdfStyles.flexRow, { marginBottom: 15 }]}>
            <View style={{ width: '48%' }}>
              <View style={pdfStyles.summaryCard}>
                <Text style={pdfStyles.sectionSubtitle}>Availability Metrics</Text>
                <View style={{ marginTop: 8 }}>
                  <Text style={pdfStyles.bulletText}>
                    <Text style={pdfStyles.bold}>Overall Availability:</Text>{' '}
                    {operationalReadiness.overallAvailability}%
                  </Text>
                  <Text style={pdfStyles.bulletText}>
                    <Text style={pdfStyles.bold}>Captain Availability:</Text>{' '}
                    {operationalReadiness.captainAvailability}%
                  </Text>
                  <Text style={pdfStyles.bulletText}>
                    <Text style={pdfStyles.bold}>First Officer Availability:</Text>{' '}
                    {operationalReadiness.firstOfficerAvailability}%
                  </Text>
                </View>
              </View>
            </View>

            <View style={{ width: '48%', marginLeft: '4%' }}>
              <View style={pdfStyles.summaryCard}>
                <Text style={pdfStyles.sectionSubtitle}>Crew Requirements</Text>
                <View style={{ marginTop: 8 }}>
                  <Text style={pdfStyles.bulletText}>
                    <Text style={pdfStyles.bold}>Required Captains:</Text>{' '}
                    {operationalReadiness.minimumCrewRequirement.captains}
                  </Text>
                  <Text style={pdfStyles.bulletText}>
                    <Text style={pdfStyles.bold}>Available Captains:</Text>{' '}
                    {operationalReadiness.currentCertifiedCrew.captains}
                  </Text>
                  <Text style={pdfStyles.bulletText}>
                    <Text style={pdfStyles.bold}>Required F/Os:</Text>{' '}
                    {operationalReadiness.minimumCrewRequirement.firstOfficers}
                  </Text>
                  <Text style={pdfStyles.bulletText}>
                    <Text style={pdfStyles.bold}>Available F/Os:</Text>{' '}
                    {operationalReadiness.currentCertifiedCrew.firstOfficers}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* Crew Shortfall Alerts */}
          {(operationalReadiness.shortfall.captains > 0 ||
            operationalReadiness.shortfall.firstOfficers > 0) && (
            <AlertBox type="critical" title="🚨 Crew Shortfall Identified">
              <Text>
                {operationalReadiness.shortfall.captains > 0 &&
                  `Captain shortfall: ${operationalReadiness.shortfall.captains}`}
                {operationalReadiness.shortfall.captains > 0 &&
                  operationalReadiness.shortfall.firstOfficers > 0 &&
                  ', '}
                {operationalReadiness.shortfall.firstOfficers > 0 &&
                  `First Officer shortfall: ${operationalReadiness.shortfall.firstOfficers}`}
              </Text>
            </AlertBox>
          )}
        </Section>

        {/* Availability Impact */}
        <Section title="Leave Impact Assessment">
          <Text style={pdfStyles.sectionSubtitle}>
            Current period availability: {leaveAnalysis.availabilityImpact.availabilityPercentage}%
          </Text>
          <Text style={pdfStyles.bulletText}>
            Pilots on leave: {leaveAnalysis.availabilityImpact.pilotsOnLeave}
          </Text>

          {leaveAnalysis.availabilityImpact.criticalPeriods.length > 0 && (
            <View style={{ marginTop: 10 }}>
              <Text style={pdfStyles.sectionSubtitle}>Critical Periods:</Text>
              <BulletList items={leaveAnalysis.availabilityImpact.criticalPeriods} />
            </View>
          )}
        </Section>

        {/* Mitigation Actions */}
        {operationalReadiness.mitigationActions.length > 0 && (
          <Section title="Recommended Mitigation Actions">
            <BulletList items={operationalReadiness.mitigationActions} />
          </Section>
        )}

        <PDFFooter pageNumber={3} totalPages={4} />
      </Page>

      {/* Page 4: Retirement Planning & Recommendations */}
      <Page size="A4" style={pdfStyles.page}>
        <PDFHeader
          metadata={{
            ...metadata,
            title: 'Succession Planning & Recommendations',
            subtitle: 'Long-term fleet planning and strategic recommendations',
          }}
        />

        {/* Upcoming Retirements */}
        {upcomingRetirements.length > 0 && (
          <Section title="Upcoming Retirements (Next 5 Years)">
            <PDFTable
              headers={[
                'Pilot',
                'Employee ID',
                'Role',
                'Retirement Date',
                'Years Remaining',
                'Replacement Plan',
              ]}
              columnWidths={['18%', '12%', '12%', '18%', '15%', '25%']}
              data={upcomingRetirements.map((retirement) => [
                `${retirement.pilot.first_name} ${retirement.pilot.last_name}`,
                retirement.pilot.employee_id,
                retirement.pilot.role,
                format(new Date(retirement.retirementDate), 'dd/MM/yyyy'),
                retirement.yearsToRetirement.toString(),
                retirement.replacementPlan || 'Not planned',
              ])}
            />

            {upcomingRetirements.filter((r) => r.yearsToRetirement <= 2).length > 0 && (
              <AlertBox type="warning" title="⏰ Immediate Succession Planning Required">
                <Text>
                  {upcomingRetirements.filter((r) => r.yearsToRetirement <= 2).length} pilot(s) will
                  retire within 2 years. Immediate succession planning and recruitment should be
                  initiated.
                </Text>
              </AlertBox>
            )}
          </Section>
        )}

        {/* Strategic Recommendations */}
        <Section title="Strategic Fleet Management Recommendations">
          <BulletList items={recommendations} />
        </Section>

        {/* Fleet Health Summary */}
        <Section title="Fleet Health Summary">
          <View style={pdfStyles.summaryCard}>
            <Text style={pdfStyles.sectionSubtitle}>Overall Assessment</Text>
            <View style={{ marginTop: 8 }}>
              <Text
                style={[
                  pdfStyles.summaryValue,
                  operationalReadiness.riskAssessment === 'LOW'
                    ? pdfStyles.statusCurrent
                    : operationalReadiness.riskAssessment === 'MEDIUM'
                      ? pdfStyles.statusExpiring
                      : operationalReadiness.riskAssessment === 'HIGH'
                        ? pdfStyles.statusExpired
                        : pdfStyles.statusCritical,
                ]}
              >
                {operationalReadiness.riskAssessment} RISK
              </Text>
              <Text style={pdfStyles.summaryLabel}>Operational Readiness Status</Text>
              <Text style={pdfStyles.bulletText}>
                Fleet availability: {operationalReadiness.overallAvailability}% | Leave impact:{' '}
                {100 - leaveAnalysis.availabilityImpact.availabilityPercentage}% | Upcoming
                retirements: {upcomingRetirements.filter((r) => r.yearsToRetirement <= 5).length}
              </Text>
            </View>
          </View>
        </Section>

        {/* Report Footer Information */}
        <View style={{ position: 'absolute', bottom: 80, left: 0, right: 0 }}>
          <AlertBox type="info" title="Report Information">
            <Text>
              • This fleet management report provides strategic insights for B767 operations
              planning.
              {'\n'}• Data includes active pilots, current qualifications, and approved leave
              requests.
              {'\n'}• Operational readiness calculated based on minimum crew requirements and
              current availability.
              {'\n'}• Succession planning recommendations based on retirement projections and
              qualification gaps.
              {'\n'}• This document contains sensitive operational information and should be treated
              as confidential.
            </Text>
          </AlertBox>
        </View>

        <PDFFooter pageNumber={4} totalPages={4} />
      </Page>
    </Document>
  );
};

/**
 * Operational Readiness Summary Report (Single Page)
 */
interface OperationalReadinessPDFProps {
  operationalReadiness: OperationalReadiness;
  metadata: any;
}

export const OperationalReadinessPDFDocument: React.FC<OperationalReadinessPDFProps> = ({
  operationalReadiness,
  metadata,
}) => {
  return (
    <Document>
      <Page size="A4" style={pdfStyles.page}>
        <PDFHeader
          metadata={{
            ...metadata,
            title: 'Operational Readiness Report',
            subtitle: 'Current fleet operational capacity assessment',
          }}
        />

        {/* Readiness Overview */}
        <Section title="Current Operational Status">
          <SummaryStats
            stats={[
              {
                label: 'Overall Availability',
                value: `${operationalReadiness.overallAvailability}%`,
                status:
                  operationalReadiness.overallAvailability >= 90
                    ? 'current'
                    : operationalReadiness.overallAvailability >= 75
                      ? 'expiring'
                      : 'expired',
              },
              {
                label: 'Captain Availability',
                value: `${operationalReadiness.captainAvailability}%`,
                status: operationalReadiness.captainAvailability >= 90 ? 'current' : 'expiring',
              },
              {
                label: 'F/O Availability',
                value: `${operationalReadiness.firstOfficerAvailability}%`,
                status:
                  operationalReadiness.firstOfficerAvailability >= 90 ? 'current' : 'expiring',
              },
              {
                label: 'Risk Level',
                value: operationalReadiness.riskAssessment,
                status:
                  operationalReadiness.riskAssessment === 'LOW'
                    ? 'current'
                    : operationalReadiness.riskAssessment === 'MEDIUM'
                      ? 'expiring'
                      : 'expired',
              },
            ]}
          />
        </Section>

        {/* Crew Requirements Analysis */}
        <Section title="Crew Requirements vs. Availability">
          <PDFTable
            headers={['Position', 'Required', 'Available', 'Shortfall', 'Status']}
            columnWidths={['25%', '20%', '20%', '15%', '20%']}
            data={[
              [
                'Captains',
                operationalReadiness.minimumCrewRequirement.captains.toString(),
                operationalReadiness.currentCertifiedCrew.captains.toString(),
                operationalReadiness.shortfall.captains.toString(),
                operationalReadiness.shortfall.captains > 0 ? 'SHORTFALL' : 'ADEQUATE',
              ],
              [
                'First Officers',
                operationalReadiness.minimumCrewRequirement.firstOfficers.toString(),
                operationalReadiness.currentCertifiedCrew.firstOfficers.toString(),
                operationalReadiness.shortfall.firstOfficers.toString(),
                operationalReadiness.shortfall.firstOfficers > 0 ? 'SHORTFALL' : 'ADEQUATE',
              ],
            ]}
            statusColumn={4}
          />
        </Section>

        {/* Critical Alerts */}
        {operationalReadiness.riskAssessment !== 'LOW' && (
          <AlertBox
            type={operationalReadiness.riskAssessment === 'CRITICAL' ? 'critical' : 'warning'}
            title={`${operationalReadiness.riskAssessment} Risk Level Identified`}
          >
            <Text>
              Fleet operational readiness is currently at {operationalReadiness.riskAssessment}{' '}
              risk.
              {operationalReadiness.shortfall.captains > 0 &&
                ` Captain shortfall: ${operationalReadiness.shortfall.captains}.`}
              {operationalReadiness.shortfall.firstOfficers > 0 &&
                ` First Officer shortfall: ${operationalReadiness.shortfall.firstOfficers}.`}
            </Text>
          </AlertBox>
        )}

        {/* Mitigation Actions */}
        <Section title="Recommended Actions">
          <BulletList items={operationalReadiness.mitigationActions} />
        </Section>

        <PDFFooter pageNumber={1} totalPages={1} />
      </Page>
    </Document>
  );
};
