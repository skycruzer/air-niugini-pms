/**
 * @fileoverview Roster Leave Planning PDF Report Generator
 * Professional PDF reports for Air Niugini roster leave planning distribution
 *
 * @author Air Niugini Development Team
 * @version 1.0.0
 * @since 2025-09-28
 */

import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import { format, parseISO } from 'date-fns';
import {
  PDFHeader,
  PDFFooter,
  SummaryStats,
  PDFTable,
  Section,
  AlertBox,
  pdfStyles,
  airNiuginiStyles,
} from './pdf-components';
import { LeaveRequest } from './leave-service';
import { RosterPeriod } from './roster-utils';
import { PDFReportMetadata } from '@/types/pdf-reports';

// =============================================================================
// TYPES AND INTERFACES
// =============================================================================

export interface RosterLeaveReportData {
  rosterPeriod: RosterPeriod;
  leaveRequests: LeaveRequest[];
  generatedBy: string;
  generatedAt: Date;
}

interface LeaveRequestsByType {
  [key: string]: LeaveRequest[];
}

interface LeaveStatistics {
  totalRequests: number;
  totalDays: number;
  byStatus: {
    approved: number;
    pending: number;
    denied: number;
  };
  byType: {
    [key: string]: number;
  };
  pilotsAffected: number;
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Calculate comprehensive leave statistics
 */
function calculateLeaveStatistics(requests: LeaveRequest[]): LeaveStatistics {
  const stats: LeaveStatistics = {
    totalRequests: requests.length,
    totalDays: 0,
    byStatus: { approved: 0, pending: 0, denied: 0 },
    byType: {},
    pilotsAffected: new Set(requests.map((r) => r.pilot_id)).size,
  };

  requests.forEach((request) => {
    // Total days
    stats.totalDays += request.days_count;

    // By status
    switch (request.status) {
      case 'APPROVED':
        stats.byStatus.approved++;
        break;
      case 'PENDING':
        stats.byStatus.pending++;
        break;
      case 'DENIED':
        stats.byStatus.denied++;
        break;
    }

    // By type
    stats.byType[request.request_type] = (stats.byType[request.request_type] || 0) + 1;
  });

  return stats;
}

/**
 * Group leave requests by type
 */
function groupRequestsByType(requests: LeaveRequest[]): LeaveRequestsByType {
  return requests.reduce((groups, request) => {
    const type = request.request_type;
    if (!groups[type]) {
      groups[type] = [];
    }
    groups[type].push(request);
    return groups;
  }, {} as LeaveRequestsByType);
}

/**
 * Format date range for display
 */
function formatDateRange(startDate: string, endDate: string): string {
  try {
    const start = parseISO(startDate);
    const end = parseISO(endDate);

    if (format(start, 'yyyy-MM') === format(end, 'yyyy-MM')) {
      return `${format(start, 'dd')} - ${format(end, 'dd MMM yyyy')}`;
    } else {
      return `${format(start, 'dd MMM')} - ${format(end, 'dd MMM yyyy')}`;
    }
  } catch (error) {
    return `${startDate} - ${endDate}`;
  }
}

/**
 * Check for potential conflicts or issues
 */
function analyzeLeaveConflicts(requests: LeaveRequest[]): string[] {
  const issues: string[] = [];

  // Group by pilot to check for multiple requests
  const requestsByPilot = requests.reduce(
    (groups, request) => {
      const pilotId = request.pilot_id;
      if (!groups[pilotId]) {
        groups[pilotId] = [];
      }
      groups[pilotId].push(request);
      return groups;
    },
    {} as Record<string, LeaveRequest[]>
  );

  // Check for pilots with multiple leave requests
  Object.entries(requestsByPilot).forEach(([pilotId, pilotRequests]) => {
    if (pilotRequests.length > 1) {
      const pilotName = pilotRequests[0]?.pilot_name || 'Unknown Pilot';
      issues.push(`${pilotName} has ${pilotRequests.length} leave requests in this period`);
    }
  });

  // Check for high leave concentration
  const approvedRequests = requests.filter((r) => r.status === 'APPROVED');
  if (approvedRequests.length > 10) {
    issues.push(
      `High number of approved leave requests (${approvedRequests.length}) may affect roster coverage`
    );
  }

  // Check for pending requests requiring attention
  const pendingRequests = requests.filter((r) => r.status === 'PENDING');
  if (pendingRequests.length > 5) {
    issues.push(`${pendingRequests.length} requests are still pending approval`);
  }

  return issues;
}

// =============================================================================
// ROSTER LEAVE REPORT STYLES
// =============================================================================

const rosterLeaveStyles = StyleSheet.create({
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 15,
  },

  calendarDay: {
    width: '14.28%', // 7 days per week
    minHeight: 30,
    border: '1px solid #E5E7EB',
    padding: 2,
    fontSize: 6,
  },

  calendarHeader: {
    backgroundColor: airNiuginiStyles.colors.gray.light,
    fontWeight: 'bold',
    textAlign: 'center',
    padding: 4,
  },

  leaveIndicator: {
    width: 4,
    height: 4,
    borderRadius: 2,
    marginRight: 2,
    marginBottom: 1,
  },

  leaveRDO: {
    backgroundColor: '#3B82F6', // Blue
  },

  leaveANNUAL: {
    backgroundColor: '#8B5CF6', // Purple
  },

  leaveSICK: {
    backgroundColor: '#EF4444', // Red
  },

  leaveOTHER: {
    backgroundColor: '#6B7280', // Gray
  },

  conflictHighlight: {
    backgroundColor: '#FEF2F2',
    borderColor: airNiuginiStyles.colors.status.expired,
  },

  summarySection: {
    marginBottom: 20,
  },

  executiveSummary: {
    backgroundColor: airNiuginiStyles.colors.gray.light,
    padding: 12,
    borderRadius: 4,
    marginBottom: 15,
  },

  keyMetric: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 3,
  },

  metricLabel: {
    fontSize: airNiuginiStyles.fonts.sizes.body,
    color: airNiuginiStyles.colors.gray.dark,
  },

  metricValue: {
    fontSize: airNiuginiStyles.fonts.sizes.body,
    fontWeight: 'bold',
    color: airNiuginiStyles.colors.primary,
  },
});

// =============================================================================
// PDF REPORT COMPONENTS
// =============================================================================

/**
 * Executive Summary Section
 */
interface ExecutiveSummaryProps {
  rosterPeriod: RosterPeriod;
  statistics: LeaveStatistics;
}

const ExecutiveSummary: React.FC<ExecutiveSummaryProps> = ({ rosterPeriod, statistics }) => (
  <Section title="Executive Summary">
    <View style={rosterLeaveStyles.executiveSummary}>
      <Text style={[pdfStyles.sectionSubtitle, { marginBottom: 8 }]}>
        Roster Period: {rosterPeriod.code}
      </Text>

      <Text
        style={[{ fontSize: airNiuginiStyles.fonts.sizes.body, marginBottom: 8, lineHeight: 1.4 }]}
      >
        Period Duration: {format(rosterPeriod.startDate, 'dd MMM yyyy')} -{' '}
        {format(rosterPeriod.endDate, 'dd MMM yyyy')} (28 days)
      </Text>

      <View style={rosterLeaveStyles.keyMetric}>
        <Text style={rosterLeaveStyles.metricLabel}>Total Leave Requests:</Text>
        <Text style={rosterLeaveStyles.metricValue}>{statistics.totalRequests}</Text>
      </View>

      <View style={rosterLeaveStyles.keyMetric}>
        <Text style={rosterLeaveStyles.metricLabel}>Total Leave Days:</Text>
        <Text style={rosterLeaveStyles.metricValue}>{statistics.totalDays}</Text>
      </View>

      <View style={rosterLeaveStyles.keyMetric}>
        <Text style={rosterLeaveStyles.metricLabel}>Pilots Affected:</Text>
        <Text style={rosterLeaveStyles.metricValue}>{statistics.pilotsAffected}</Text>
      </View>

      <View style={rosterLeaveStyles.keyMetric}>
        <Text style={rosterLeaveStyles.metricLabel}>Approved Requests:</Text>
        <Text
          style={[rosterLeaveStyles.metricValue, { color: airNiuginiStyles.colors.status.current }]}
        >
          {statistics.byStatus.approved}
        </Text>
      </View>

      <View style={rosterLeaveStyles.keyMetric}>
        <Text style={rosterLeaveStyles.metricLabel}>Pending Approval:</Text>
        <Text
          style={[
            rosterLeaveStyles.metricValue,
            { color: airNiuginiStyles.colors.status.expiring },
          ]}
        >
          {statistics.byStatus.pending}
        </Text>
      </View>
    </View>
  </Section>
);

/**
 * Leave Requests Table Section
 */
interface LeaveRequestsTableProps {
  requests: LeaveRequest[];
  title: string;
}

const LeaveRequestsTable: React.FC<LeaveRequestsTableProps> = ({ requests, title }) => {
  const tableData = requests.map((request) => [
    request.pilot_name || 'Unknown',
    request.employee_id || 'N/A',
    formatDateRange(request.start_date, request.end_date),
    request.days_count.toString(),
    request.status,
    request.request_method || 'N/A',
    request.reason || '-',
  ]);

  return (
    <Section
      title={title}
      subtitle={`${requests.length} request${requests.length !== 1 ? 's' : ''}`}
    >
      <PDFTable
        headers={['Pilot Name', 'Employee ID', 'Dates', 'Days', 'Status', 'Method', 'Reason']}
        data={tableData}
        columnWidths={['18%', '12%', '18%', '8%', '12%', '12%', '20%']}
        statusColumn={4}
        highlightColumn={0}
      />
    </Section>
  );
};

/**
 * Leave Statistics Summary
 */
interface StatisticsSummaryProps {
  statistics: LeaveStatistics;
}

const StatisticsSummary: React.FC<StatisticsSummaryProps> = ({ statistics }) => {
  const summaryStats = [
    { label: 'Total Requests', value: statistics.totalRequests },
    { label: 'Total Days', value: statistics.totalDays },
    { label: 'Pilots Affected', value: statistics.pilotsAffected },
    { label: 'Approved', value: statistics.byStatus.approved, status: 'current' as const },
    { label: 'Pending', value: statistics.byStatus.pending, status: 'expiring' as const },
  ];

  const typeStats = Object.entries(statistics.byType).map(([type, count]) => ({
    label: type,
    value: count,
  }));

  return (
    <Section title="Leave Statistics">
      <SummaryStats stats={summaryStats} />

      <Text style={[pdfStyles.sectionSubtitle, { marginTop: 10, marginBottom: 6 }]}>
        Breakdown by Leave Type
      </Text>
      <SummaryStats stats={typeStats} />
    </Section>
  );
};

/**
 * Conflict Analysis Section
 */
interface ConflictAnalysisProps {
  issues: string[];
}

const ConflictAnalysis: React.FC<ConflictAnalysisProps> = ({ issues }) => {
  if (issues.length === 0) {
    return (
      <Section title="Conflict Analysis">
        <AlertBox type="info" title="No Issues Detected">
          <Text>
            No conflicts or potential issues were identified in the leave requests for this roster
            period.
          </Text>
        </AlertBox>
      </Section>
    );
  }

  return (
    <Section title="Conflict Analysis">
      <AlertBox type="warning" title="Potential Issues Identified">
        <Text style={{ marginBottom: 6 }}>The following issues require attention:</Text>
        {issues.map((issue, index) => (
          <Text
            key={index}
            style={{ marginBottom: 3, fontSize: airNiuginiStyles.fonts.sizes.body }}
          >
            • {issue}
          </Text>
        ))}
      </AlertBox>
    </Section>
  );
};

// =============================================================================
// MAIN PDF DOCUMENT
// =============================================================================

/**
 * Create roster leave report PDF document
 */
export function createRosterLeaveReportDocument(data: RosterLeaveReportData) {
  const { rosterPeriod, leaveRequests, generatedBy, generatedAt } = data;

  const metadata: PDFReportMetadata = {
    reportType: 'roster-leave-planning',
    title: 'Roster Leave Planning Report',
    subtitle: `Leave requests for ${rosterPeriod.code}`,
    companyName: 'Air Niugini',
    fleetType: 'B767',
    generatedAt: generatedAt.toISOString(),
    generatedBy,
    rosterPeriod: rosterPeriod.code,
    reportPeriod: `${format(rosterPeriod.startDate, 'dd MMM yyyy')} - ${format(rosterPeriod.endDate, 'dd MMM yyyy')}`,
  };

  const statistics = calculateLeaveStatistics(leaveRequests);
  const groupedRequests = groupRequestsByType(leaveRequests);
  const conflicts = analyzeLeaveConflicts(leaveRequests);

  return (
    <Document
      title={`${metadata.title} - ${rosterPeriod.code}`}
      author="Air Niugini Pilot Management System"
      subject={`Leave planning report for roster period ${rosterPeriod.code}`}
      keywords="Air Niugini, roster, leave, planning, B767, pilot management"
      creator="Air Niugini PMS"
      producer="Air Niugini PMS"
    >
      <Page size="A4" style={pdfStyles.page}>
        <PDFHeader metadata={metadata} />

        <ExecutiveSummary rosterPeriod={rosterPeriod} statistics={statistics} />

        <StatisticsSummary statistics={statistics} />

        <ConflictAnalysis issues={conflicts} />

        <PDFFooter pageNumber={1} totalPages={1} />
      </Page>

      {/* Additional pages for detailed leave requests by type */}
      {Object.entries(groupedRequests).map(([type, requests], index) => (
        <Page key={type} size="A4" style={pdfStyles.page}>
          <PDFHeader metadata={metadata} />

          <LeaveRequestsTable requests={requests} title={`${type} Leave Requests`} />

          <PDFFooter pageNumber={index + 2} totalPages={Object.keys(groupedRequests).length + 1} />
        </Page>
      ))}
    </Document>
  );
}

/**
 * Roster Leave Planning PDF Report Document (for backwards compatibility)
 */
export const RosterLeaveReportDocument = createRosterLeaveReportDocument;

// =============================================================================
// EXPORT UTILITIES
// =============================================================================

/**
 * Generate PDF filename for the roster leave report
 */
export function generateRosterLeaveReportFilename(rosterPeriod: string): string {
  const timestamp = format(new Date(), 'yyyyMMdd_HHmm');
  return `Air_Niugini_Leave_Planning_${rosterPeriod}_${timestamp}.pdf`;
}

/**
 * Create roster leave report data structure
 */
export function createRosterLeaveReportData(
  rosterPeriod: RosterPeriod,
  leaveRequests: LeaveRequest[],
  generatedBy: string
): RosterLeaveReportData {
  return {
    rosterPeriod,
    leaveRequests,
    generatedBy,
    generatedAt: new Date(),
  };
}
