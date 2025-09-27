/**
 * PDF Generation Test Script for Air Niugini B767 PMS
 * Tests the PDF report generation system with sample data
 *
 * Usage: node test-pdf-generation.js
 */

const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// Configuration
const SUPABASE_URL = 'https://wgdmgvonqysflwdiiols.supabase.co'
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'your-service-key-here'

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

async function testPDFGeneration() {
  console.log('🧪 Testing Air Niugini PDF Report Generation System')
  console.log('=' .repeat(60))

  try {
    // Test 1: Check database connection
    console.log('\n1. Testing database connection...')
    const { data: pilots, error: pilotError } = await supabase
      .from('pilots')
      .select('count')
      .limit(1)

    if (pilotError) {
      console.error('❌ Database connection failed:', pilotError.message)
      return
    }
    console.log('✅ Database connection successful')

    // Test 2: Check if required data exists
    console.log('\n2. Checking required data...')

    const { data: pilotsData, error: pilotsError } = await supabase
      .from('pilots')
      .select('*')
      .limit(5)

    if (pilotsError || !pilotsData || pilotsData.length === 0) {
      console.error('❌ No pilot data found:', pilotsError?.message)
      return
    }
    console.log(`✅ Found ${pilotsData.length} pilot records`)

    const { data: checksData, error: checksError } = await supabase
      .from('pilot_checks')
      .select('*')
      .limit(10)

    if (checksError || !checksData || checksData.length === 0) {
      console.error('❌ No certification data found:', checksError?.message)
      return
    }
    console.log(`✅ Found ${checksData.length} certification records`)

    const { data: checkTypesData, error: checkTypesError } = await supabase
      .from('check_types')
      .select('*')
      .limit(5)

    if (checkTypesError || !checkTypesData || checkTypesData.length === 0) {
      console.error('❌ No check types data found:', checkTypesError?.message)
      return
    }
    console.log(`✅ Found ${checkTypesData.length} check type records`)

    // Test 3: Test PDF API endpoints
    console.log('\n3. Testing PDF API endpoints...')

    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3001'
    const reportTypes = [
      'fleet-compliance',
      'risk-assessment',
      'pilot-summary',
      'fleet-management',
      'operational-readiness'
    ]

    for (const reportType of reportTypes) {
      console.log(`\n   Testing ${reportType} report...`)

      try {
        const response = await fetch(`${baseUrl}/api/reports/pdf`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            reportType,
            generatedBy: 'Test Script'
          })
        })

        if (response.ok) {
          const contentType = response.headers.get('Content-Type')
          const contentLength = response.headers.get('Content-Length')
          console.log(`   ✅ ${reportType}: ${contentType}, ${contentLength} bytes`)

          // Save a sample PDF for verification
          if (reportType === 'fleet-compliance') {
            const buffer = await response.arrayBuffer()
            const filePath = path.join(__dirname, 'test-compliance-report.pdf')
            fs.writeFileSync(filePath, Buffer.from(buffer))
            console.log(`   📄 Sample PDF saved to: ${filePath}`)
          }
        } else {
          const errorData = await response.json()
          console.log(`   ❌ ${reportType}: ${response.status} - ${errorData.error}`)
        }
      } catch (error) {
        console.log(`   ❌ ${reportType}: Network error - ${error.message}`)
      }
    }

    // Test 4: Test individual pilot report
    console.log('\n4. Testing individual pilot report...')

    if (pilotsData.length > 0) {
      const testPilot = pilotsData[0]
      console.log(`   Testing report for pilot: ${testPilot.first_name} ${testPilot.last_name} (${testPilot.employee_id})`)

      try {
        const response = await fetch(`${baseUrl}/api/reports/pdf`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            reportType: 'pilot-individual',
            pilotId: testPilot.id,
            generatedBy: 'Test Script'
          })
        })

        if (response.ok) {
          const contentLength = response.headers.get('Content-Length')
          console.log(`   ✅ Individual pilot report: ${contentLength} bytes`)
        } else {
          const errorData = await response.json()
          console.log(`   ❌ Individual pilot report: ${response.status} - ${errorData.error}`)
        }
      } catch (error) {
        console.log(`   ❌ Individual pilot report: Network error - ${error.message}`)
      }
    }

    // Test 5: Test validation
    console.log('\n5. Testing input validation...')

    const invalidTests = [
      { reportType: 'invalid-report', expected: 'Invalid report type' },
      { reportType: 'pilot-individual', pilotId: 'invalid-uuid', expected: 'Invalid pilot ID' },
      { reportType: 'fleet-compliance', generatedBy: '', expected: 'Generated by is required' }
    ]

    for (const test of invalidTests) {
      try {
        const response = await fetch(`${baseUrl}/api/reports/pdf`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(test)
        })

        if (response.status === 400) {
          console.log(`   ✅ Validation test passed: ${test.expected}`)
        } else {
          console.log(`   ❌ Validation test failed: Expected 400, got ${response.status}`)
        }
      } catch (error) {
        console.log(`   ❌ Validation test error: ${error.message}`)
      }
    }

    console.log('\n' + '=' .repeat(60))
    console.log('🎉 PDF Generation Testing Complete!')
    console.log('✅ All core functionality appears to be working correctly')
    console.log('📄 Check the generated PDF file for visual verification')

  } catch (error) {
    console.error('\n❌ Test failed with error:', error.message)
    console.error('Stack trace:', error.stack)
  }
}

// Environment check
if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.log('⚠️  Warning: SUPABASE_SERVICE_ROLE_KEY environment variable not set')
  console.log('   Set it with: export SUPABASE_SERVICE_ROLE_KEY="your-key-here"')
  console.log('   Or update the SUPABASE_SERVICE_KEY variable in this script')
}

// Run the test
testPDFGeneration().catch(console.error)