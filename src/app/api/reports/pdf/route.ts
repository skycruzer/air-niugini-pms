import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'
import { settingsService } from '@/lib/settings-service'
import React from 'react'
import { renderToBuffer } from '@react-pdf/renderer'
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'

export async function POST(request: NextRequest) {
  const supabaseAdmin = getSupabaseAdmin()
  try {
    const { reportType, reportData } = await request.json()

    console.log(`🔍 API /reports/pdf: PDF generation temporarily disabled for ${reportType}`)

    // Temporary response - PDF generation disabled due to JSX syntax issues
    return NextResponse.json({
      success: false,
      error: 'PDF generation temporarily disabled while fixing syntax issues'
    }, { status: 503 })

  } catch (error) {
    console.error('🚨 API /reports/pdf: Error:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      details: error instanceof Error ? error.stack : String(error)
    })

    return NextResponse.json({
      success: false,
      error: 'Failed to generate PDF report'
    }, { status: 500 })
  }
}

// PDF Styles
const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#FFFFFF',
    padding: 30,
    fontSize: 10,
    fontFamily: 'Helvetica',
  },
  header: {
    flexDirection: 'row',
    marginBottom: 20,
    borderBottomWidth: 2,
    borderBottomColor: '#E4002B',
    paddingBottom: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#E4002B',
  },
  subtitle: {
    fontSize: 12,
    color: '#666666',
    marginTop: 5,
  },
  section: {
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#E4002B',
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#FFC72C',
    paddingBottom: 2,
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 10,
  },
  summaryItem: {
    width: '25%',
    marginBottom: 5,
  },
  summaryLabel: {
    fontSize: 8,
    color: '#666666',
  },
  summaryValue: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#000000',
  },
  table: {
    display: 'flex' as const,
    width: 'auto',
    borderStyle: 'solid',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  tableRow: {
    margin: 'auto',
    flexDirection: 'row',
  },
  tableColHeader: {
    width: '20%',
    borderStyle: 'solid',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    backgroundColor: '#F5F5F5',
    padding: 5,
  },
  tableCol: {
    width: '20%',
    borderStyle: 'solid',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    padding: 5,
  },
  tableCellHeader: {
    fontSize: 9,
    fontWeight: 'bold',
  },
  tableCell: {
    fontSize: 8,
  },
  critical: {
    color: '#DC2626',
    fontWeight: 'bold',
  },
  warning: {
    color: '#D97706',
    fontWeight: 'bold',
  },
  normal: {
    color: '#059669',
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 30,
    right: 30,
    textAlign: 'center',
    color: '#666666',
    fontSize: 8,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    paddingTop: 10,
  },
})

// PDF generation functions temporarily disabled due to JSX syntax issues
// Will be re-implemented without JSX syntax

async function generatePlanningRosteringPDF(reportData: any) {
  // Placeholder - to be reimplemented
  return null
}

async function generateFleetCompliancePDF(reportData: any) {
  // Placeholder - to be reimplemented
  return null
}

async function generatePilotSummaryPDF(reportData: any) {
  // Placeholder - to be reimplemented
  return null
}