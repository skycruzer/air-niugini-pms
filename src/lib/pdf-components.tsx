/**
 * @fileoverview PDF Document Components for Air Niugini B767 PMS
 * React PDF components with Air Niugini branding and professional formatting
 *
 * @author Air Niugini Development Team
 * @version 1.0.0
 * @since 2025-09-27
 */

import React from 'react';
import { Document, Page, Text, View, StyleSheet, Image, Font } from '@react-pdf/renderer';
import { format } from 'date-fns';
import { PDFReportMetadata, AirNiuginiStyles } from '@/types/pdf-reports';

// =============================================================================
// AIR NIUGINI BRAND STYLES
// =============================================================================

/**
 * Air Niugini brand color palette and styling configuration
 */
export const airNiuginiStyles: AirNiuginiStyles = {
  colors: {
    primary: '#E4002B', // Air Niugini Red
    secondary: '#FFC72C', // Air Niugini Gold
    black: '#000000', // Brand Black
    white: '#FFFFFF', // Background
    gray: {
      light: '#F5F5F5',
      medium: '#666666',
      dark: '#333333',
    },
    status: {
      current: '#059669', // Green
      expiring: '#D97706', // Yellow/Orange
      expired: '#DC2626', // Red
      critical: '#991B1B', // Dark Red
    },
  },
  fonts: {
    primary: 'Helvetica',
    sizes: {
      title: 18,
      heading: 14,
      subheading: 12,
      body: 10,
      caption: 8,
    },
  },
  spacing: {
    page: 30,
    section: 15,
    element: 8,
  },
};

/**
 * PDF stylesheet with Air Niugini branding
 */
export const pdfStyles = StyleSheet.create({
  // Page layout
  page: {
    flexDirection: 'column',
    backgroundColor: airNiuginiStyles.colors.white,
    padding: airNiuginiStyles.spacing.page,
    fontSize: airNiuginiStyles.fonts.sizes.body,
    fontFamily: airNiuginiStyles.fonts.primary,
    color: airNiuginiStyles.colors.black,
  },

  // Header components
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
    borderBottomWidth: 2,
    borderBottomColor: airNiuginiStyles.colors.primary,
    paddingBottom: 10,
  },

  headerLeft: {
    flexDirection: 'column',
    flex: 1,
  },

  headerRight: {
    flexDirection: 'column',
    alignItems: 'flex-end',
    minWidth: 150,
  },

  companyName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: airNiuginiStyles.colors.primary,
    marginBottom: 2,
  },

  fleetType: {
    fontSize: 10,
    color: airNiuginiStyles.colors.gray.medium,
    marginBottom: 8,
  },

  reportTitle: {
    fontSize: airNiuginiStyles.fonts.sizes.title,
    fontWeight: 'bold',
    color: airNiuginiStyles.colors.primary,
    marginBottom: 2,
  },

  reportSubtitle: {
    fontSize: airNiuginiStyles.fonts.sizes.subheading,
    color: airNiuginiStyles.colors.gray.medium,
  },

  metadata: {
    fontSize: airNiuginiStyles.fonts.sizes.caption,
    color: airNiuginiStyles.colors.gray.medium,
    textAlign: 'right',
  },

  // Content sections
  section: {
    marginBottom: airNiuginiStyles.spacing.section,
  },

  sectionTitle: {
    fontSize: airNiuginiStyles.fonts.sizes.heading,
    fontWeight: 'bold',
    color: airNiuginiStyles.colors.primary,
    marginBottom: airNiuginiStyles.spacing.element,
    borderBottomWidth: 1,
    borderBottomColor: airNiuginiStyles.colors.secondary,
    paddingBottom: 3,
  },

  sectionSubtitle: {
    fontSize: airNiuginiStyles.fonts.sizes.subheading,
    fontWeight: 'bold',
    color: airNiuginiStyles.colors.black,
    marginBottom: 6,
  },

  // Grid layouts
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 10,
  },

  summaryCard: {
    width: '20%',
    marginBottom: 8,
    padding: 6,
    backgroundColor: airNiuginiStyles.colors.gray.light,
    borderRadius: 3,
    marginRight: 8,
  },

  summaryValue: {
    fontSize: airNiuginiStyles.fonts.sizes.subheading,
    fontWeight: 'bold',
    color: airNiuginiStyles.colors.primary,
    marginBottom: 2,
  },

  summaryLabel: {
    fontSize: airNiuginiStyles.fonts.sizes.caption,
    color: airNiuginiStyles.colors.gray.medium,
  },

  // Tables
  table: {
    display: 'flex',
    width: 'auto',
    borderStyle: 'solid',
    borderWidth: 1,
    borderColor: airNiuginiStyles.colors.gray.medium,
    borderRadius: 3,
    marginBottom: 10,
  },

  tableHeader: {
    flexDirection: 'row',
    backgroundColor: airNiuginiStyles.colors.gray.light,
    borderBottomWidth: 1,
    borderBottomColor: airNiuginiStyles.colors.gray.medium,
  },

  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 0.5,
    borderBottomColor: airNiuginiStyles.colors.gray.light,
  },

  tableRowAlternate: {
    flexDirection: 'row',
    backgroundColor: '#FAFAFA',
    borderBottomWidth: 0.5,
    borderBottomColor: airNiuginiStyles.colors.gray.light,
  },

  tableCell: {
    padding: 6,
    fontSize: airNiuginiStyles.fonts.sizes.caption,
    borderRightWidth: 0.5,
    borderRightColor: airNiuginiStyles.colors.gray.light,
    justifyContent: 'center',
  },

  tableCellHeader: {
    padding: 6,
    fontSize: airNiuginiStyles.fonts.sizes.caption,
    fontWeight: 'bold',
    borderRightWidth: 0.5,
    borderRightColor: airNiuginiStyles.colors.gray.medium,
    justifyContent: 'center',
  },

  // Status indicators
  statusCurrent: {
    color: airNiuginiStyles.colors.status.current,
    fontWeight: 'bold',
  },

  statusExpiring: {
    color: airNiuginiStyles.colors.status.expiring,
    fontWeight: 'bold',
  },

  statusExpired: {
    color: airNiuginiStyles.colors.status.expired,
    fontWeight: 'bold',
  },

  statusCritical: {
    color: airNiuginiStyles.colors.status.critical,
    fontWeight: 'bold',
  },

  // Alert boxes
  alertBox: {
    padding: 10,
    borderRadius: 3,
    marginBottom: 10,
  },

  alertCritical: {
    backgroundColor: '#FEF2F2',
    borderLeftWidth: 4,
    borderLeftColor: airNiuginiStyles.colors.status.expired,
  },

  alertWarning: {
    backgroundColor: '#FFFBEB',
    borderLeftWidth: 4,
    borderLeftColor: airNiuginiStyles.colors.status.expiring,
  },

  alertInfo: {
    backgroundColor: '#F0F9FF',
    borderLeftWidth: 4,
    borderLeftColor: '#0EA5E9',
  },

  alertTitle: {
    fontSize: airNiuginiStyles.fonts.sizes.subheading,
    fontWeight: 'bold',
    marginBottom: 4,
  },

  alertText: {
    fontSize: airNiuginiStyles.fonts.sizes.body,
    lineHeight: 1.4,
  },

  // Lists and text
  bulletList: {
    marginLeft: 10,
  },

  bulletItem: {
    flexDirection: 'row',
    marginBottom: 3,
  },

  bullet: {
    width: 15,
    fontSize: airNiuginiStyles.fonts.sizes.body,
    color: airNiuginiStyles.colors.secondary,
  },

  bulletText: {
    flex: 1,
    fontSize: airNiuginiStyles.fonts.sizes.body,
    lineHeight: 1.3,
  },

  // Footer
  footer: {
    position: 'absolute',
    bottom: 20,
    left: airNiuginiStyles.spacing.page,
    right: airNiuginiStyles.spacing.page,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: airNiuginiStyles.colors.gray.light,
    paddingTop: 10,
  },

  footerText: {
    fontSize: airNiuginiStyles.fonts.sizes.caption,
    color: airNiuginiStyles.colors.gray.medium,
  },

  pageNumber: {
    fontSize: airNiuginiStyles.fonts.sizes.caption,
    color: airNiuginiStyles.colors.gray.medium,
  },

  // Utility classes
  flexRow: {
    flexDirection: 'row',
  },

  flexColumn: {
    flexDirection: 'column',
  },

  justifyBetween: {
    justifyContent: 'space-between',
  },

  alignCenter: {
    alignItems: 'center',
  },

  textCenter: {
    textAlign: 'center',
  },

  textRight: {
    textAlign: 'right',
  },

  marginBottom: {
    marginBottom: airNiuginiStyles.spacing.element,
  },

  bold: {
    fontWeight: 'bold',
  },
});

// =============================================================================
// REUSABLE PDF COMPONENTS
// =============================================================================

/**
 * Standard PDF page header with Air Niugini branding
 */
interface PDFHeaderProps {
  metadata: PDFReportMetadata;
}

export const PDFHeader: React.FC<PDFHeaderProps> = ({ metadata }) => (
  <View style={pdfStyles.header}>
    <View style={pdfStyles.headerLeft}>
      <Text style={pdfStyles.companyName}>Air Niugini</Text>
      <Text style={pdfStyles.fleetType}>{metadata.fleetType} Fleet Operations</Text>
      <Text style={pdfStyles.reportTitle}>{metadata.title}</Text>
      {metadata.subtitle && <Text style={pdfStyles.reportSubtitle}>{metadata.subtitle}</Text>}
    </View>
    <View style={pdfStyles.headerRight}>
      <Text style={pdfStyles.metadata}>
        Generated: {format(new Date(metadata.generatedAt), 'dd/MM/yyyy HH:mm')}
      </Text>
      <Text style={pdfStyles.metadata}>Generated by: {metadata.generatedBy}</Text>
      {metadata.reportPeriod && (
        <Text style={pdfStyles.metadata}>Period: {metadata.reportPeriod}</Text>
      )}
      {metadata.rosterPeriod && (
        <Text style={pdfStyles.metadata}>Roster: {metadata.rosterPeriod}</Text>
      )}
    </View>
  </View>
);

/**
 * Standard PDF page footer with page numbers
 */
interface PDFFooterProps {
  pageNumber?: number;
  totalPages?: number;
}

export const PDFFooter: React.FC<PDFFooterProps> = ({ pageNumber, totalPages }) => (
  <View style={pdfStyles.footer}>
    <Text style={pdfStyles.footerText}>Air Niugini Pilot Management System - Confidential</Text>
    {pageNumber && totalPages && (
      <Text style={pdfStyles.pageNumber}>
        Page {pageNumber} of {totalPages}
      </Text>
    )}
  </View>
);

/**
 * Summary statistics grid component
 */
interface SummaryStatsProps {
  stats: Array<{
    label: string;
    value: string | number;
    status?: 'current' | 'expiring' | 'expired' | 'critical';
  }>;
}

export const SummaryStats: React.FC<SummaryStatsProps> = ({ stats }) => (
  <View style={pdfStyles.summaryGrid}>
    {stats.map((stat, index) => (
      <View key={index} style={pdfStyles.summaryCard}>
        <Text
          style={[
            pdfStyles.summaryValue,
            ...(stat.status === 'current' ? [pdfStyles.statusCurrent] : []),
            ...(stat.status === 'expiring' ? [pdfStyles.statusExpiring] : []),
            ...(stat.status === 'expired' ? [pdfStyles.statusExpired] : []),
            ...(stat.status === 'critical' ? [pdfStyles.statusCritical] : []),
          ]}
        >
          {stat.value}
        </Text>
        <Text style={pdfStyles.summaryLabel}>{stat.label}</Text>
      </View>
    ))}
  </View>
);

/**
 * Data table component with Air Niugini styling
 */
interface PDFTableProps {
  headers: string[];
  data: (string | number)[][];
  columnWidths?: string[];
  highlightColumn?: number;
  statusColumn?: number;
}

export const PDFTable: React.FC<PDFTableProps> = ({
  headers,
  data,
  columnWidths,
  highlightColumn,
  statusColumn,
}) => {
  const defaultWidth = `${100 / headers.length}%`;
  const widths = columnWidths || headers.map(() => defaultWidth);

  const getStatusStyle = (value: string | number) => {
    const strValue = String(value).toLowerCase();
    if (strValue.includes('expired') || strValue.includes('overdue')) {
      return pdfStyles.statusExpired;
    }
    if (strValue.includes('expiring') || strValue.includes('due')) {
      return pdfStyles.statusExpiring;
    }
    if (strValue.includes('current') || strValue.includes('valid')) {
      return pdfStyles.statusCurrent;
    }
    return {};
  };

  return (
    <View style={pdfStyles.table}>
      {/* Table Header */}
      <View style={pdfStyles.tableHeader}>
        {headers.map((header, index) => (
          <View key={index} style={[pdfStyles.tableCellHeader, { width: widths[index] }]}>
            <Text>{header}</Text>
          </View>
        ))}
      </View>

      {/* Table Rows */}
      {data.map((row, rowIndex) => (
        <View
          key={rowIndex}
          style={rowIndex % 2 === 0 ? pdfStyles.tableRow : pdfStyles.tableRowAlternate}
        >
          {row.map((cell, cellIndex) => (
            <View key={cellIndex} style={[pdfStyles.tableCell, { width: widths[cellIndex] }]}>
              <Text
                style={[
                  cellIndex === highlightColumn && pdfStyles.bold,
                  cellIndex === statusColumn && getStatusStyle(cell),
                ]}
              >
                {cell}
              </Text>
            </View>
          ))}
        </View>
      ))}
    </View>
  );
};

/**
 * Alert box component for important information
 */
interface AlertBoxProps {
  type: 'critical' | 'warning' | 'info';
  title: string;
  children: React.ReactNode;
}

export const AlertBox: React.FC<AlertBoxProps> = ({ type, title, children }) => {
  const alertStyle = {
    critical: pdfStyles.alertCritical,
    warning: pdfStyles.alertWarning,
    info: pdfStyles.alertInfo,
  }[type];

  const titleColor = {
    critical: airNiuginiStyles.colors.status.expired,
    warning: airNiuginiStyles.colors.status.expiring,
    info: '#0EA5E9',
  }[type];

  return (
    <View style={[pdfStyles.alertBox, alertStyle]}>
      <Text style={[pdfStyles.alertTitle, { color: titleColor }]}>{title}</Text>
      <View style={pdfStyles.alertText}>{children}</View>
    </View>
  );
};

/**
 * Bullet list component
 */
interface BulletListProps {
  items: string[];
}

export const BulletList: React.FC<BulletListProps> = ({ items }) => (
  <View style={pdfStyles.bulletList}>
    {items.map((item, index) => (
      <View key={index} style={pdfStyles.bulletItem}>
        <Text style={pdfStyles.bullet}>•</Text>
        <Text style={pdfStyles.bulletText}>{item}</Text>
      </View>
    ))}
  </View>
);

/**
 * Section divider with title
 */
interface SectionProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}

export const Section: React.FC<SectionProps> = ({ title, subtitle, children }) => (
  <View style={pdfStyles.section}>
    <Text style={pdfStyles.sectionTitle}>{title}</Text>
    {subtitle && <Text style={pdfStyles.sectionSubtitle}>{subtitle}</Text>}
    {children}
  </View>
);

/**
 * Status badge component
 */
interface StatusBadgeProps {
  status: 'current' | 'expiring' | 'expired' | 'critical';
  text: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, text }) => {
  const statusStyles = {
    current: pdfStyles.statusCurrent,
    expiring: pdfStyles.statusExpiring,
    expired: pdfStyles.statusExpired,
    critical: pdfStyles.statusCritical,
  };

  return <Text style={[statusStyles[status], pdfStyles.bold]}>{text}</Text>;
};
