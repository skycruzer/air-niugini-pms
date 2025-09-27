import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'
import React from 'react'
import { renderToBuffer } from '@react-pdf/renderer'
import { pdfReportDataService } from '@/lib/pdf-data-service'
import { CompliancePDFDocument, RiskAssessmentPDFDocument } from '@/lib/pdf-compliance-report'
import { IndividualPilotPDFDocument, PilotSummaryPDFDocument } from '@/lib/pdf-pilot-report'
import { FleetManagementPDFDocument, OperationalReadinessPDFDocument } from '@/lib/pdf-fleet-management'
import { validatePDFRequest, validateReportType, validateUUID } from '@/lib/pdf-validation'

/**
 * PDF Report Generation API Endpoint
 * Generates professional PDF reports for Air Niugini B767 fleet operations
 */
export async function POST(request: NextRequest) {
  try {
    const requestData = await request.json()

    // Validate request structure
    try {
      validatePDFRequest(requestData)
    } catch (validationError) {
      console.error('❌ API /reports/pdf: Validation error:', validationError)
      return NextResponse.json({
        success: false,
        error: validationError instanceof Error ? validationError.message : 'Invalid request format'
      }, { status: 400 })
    }

    const { reportType, pilotId, generatedBy = 'System' } = requestData

    console.log(`🔍 API /reports/pdf: Generating ${reportType} PDF report`)

    // Validate report type
    try {
      validateReportType(reportType)
    } catch (error) {
      return NextResponse.json({
        success: false,
        error: error instanceof Error ? error.message : 'Invalid report type'
      }, { status: 400 })
    }

    // Validate pilot ID if provided
    if (pilotId) {
      try {
        validateUUID(pilotId)
      } catch (error) {
        return NextResponse.json({
          success: false,
          error: 'Invalid pilot ID format'
        }, { status: 400 })
      }
    }

    let pdfBuffer: Buffer
    let filename: string

    // Generate PDF based on report type
    switch (reportType) {
      case 'fleet-compliance': {
        const reportData = await pdfReportDataService.generateComplianceReportData(
          reportType,
          generatedBy
        )
        pdfBuffer = await renderToBuffer(CompliancePDFDocument({ reportData }) as React.ReactElement)
        filename = `fleet-compliance-report-${new Date().toISOString().split('T')[0]}.pdf`
        break
      }

      case 'risk-assessment': {
        const reportData = await pdfReportDataService.generateComplianceReportData(
          reportType,
          generatedBy
        )
        pdfBuffer = await renderToBuffer(RiskAssessmentPDFDocument({ reportData }) as React.ReactElement)
        filename = `risk-assessment-report-${new Date().toISOString().split('T')[0]}.pdf`
        break
      }

      case 'pilot-summary': {
        const reportData = await pdfReportDataService.generatePilotReportData(
          reportType,
          generatedBy
        )
        pdfBuffer = await renderToBuffer(PilotSummaryPDFDocument({ reportData }) as React.ReactElement)
        filename = `pilot-summary-report-${new Date().toISOString().split('T')[0]}.pdf`
        break
      }

      case 'pilot-individual': {
        if (!pilotId) {
          return NextResponse.json({
            success: false,
            error: 'Pilot ID is required for individual pilot reports'
          }, { status: 400 })
        }

        const reportData = await pdfReportDataService.generatePilotReportData(
          reportType,
          generatedBy,
          pilotId
        )

        if (reportData.pilots.length === 0) {
          return NextResponse.json({
            success: false,
            error: 'Pilot not found'
          }, { status: 404 })
        }

        const pilotRecord = reportData.pilots[0]
        pdfBuffer = await renderToBuffer(
          IndividualPilotPDFDocument({
            pilotRecord,
            metadata: reportData.metadata
          }) as React.ReactElement
        )
        filename = `pilot-${pilotRecord.pilot.employee_id}-report-${new Date().toISOString().split('T')[0]}.pdf`
        break
      }

      case 'fleet-management': {
        const reportData = await pdfReportDataService.generateFleetManagementReportData(
          reportType,
          generatedBy
        )
        pdfBuffer = await renderToBuffer(FleetManagementPDFDocument({ reportData }) as React.ReactElement)
        filename = `fleet-management-report-${new Date().toISOString().split('T')[0]}.pdf`
        break
      }

      case 'operational-readiness': {
        const reportData = await pdfReportDataService.generateFleetManagementReportData(
          reportType,
          generatedBy
        )
        pdfBuffer = await renderToBuffer(
          OperationalReadinessPDFDocument({
            operationalReadiness: reportData.operationalReadiness,
            metadata: reportData.metadata
          }) as React.ReactElement
        )
        filename = `operational-readiness-report-${new Date().toISOString().split('T')[0]}.pdf`
        break
      }

      default:
        return NextResponse.json({
          success: false,
          error: 'Report type not implemented'
        }, { status: 501 })
    }

    console.log(`✅ API /reports/pdf: Successfully generated ${reportType} PDF (${pdfBuffer.length} bytes)`)

    // Return PDF as response
    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Length': pdfBuffer.length.toString(),
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    })

  } catch (error) {
    console.error('🚨 API /reports/pdf: Error generating PDF:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : String(error)
    })

    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate PDF report'
    }, { status: 500 })
  }
}

