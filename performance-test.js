#!/usr/bin/env node

/**
 * Performance Testing Script for Air Niugini PMS
 * Tests critical performance metrics after optimization
 */

const { performance } = require('perf_hooks')

// Test configuration
const TEST_CONFIG = {
  baseUrl: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  timeout: 10000,
  maxResponseTime: {
    login: 2000,    // Login should load under 2 seconds
    api: 1000,      // API calls should respond under 1 second
    reports: 5000   // Reports can take up to 5 seconds
  }
}

/**
 * Test performance of a specific endpoint
 */
async function testEndpoint(name, url, options = {}) {
  console.log(`🧪 Testing ${name}...`)

  const start = performance.now()

  try {
    const response = await fetch(url, {
      timeout: TEST_CONFIG.timeout,
      ...options
    })

    const end = performance.now()
    const duration = Math.round(end - start)

    const result = {
      name,
      success: response.ok,
      status: response.status,
      duration,
      url
    }

    if (response.ok) {
      console.log(`✅ ${name}: ${duration}ms (${response.status})`)
    } else {
      console.log(`❌ ${name}: ${duration}ms (${response.status})`)
    }

    return result
  } catch (error) {
    const end = performance.now()
    const duration = Math.round(end - start)

    console.log(`💥 ${name}: ${duration}ms (ERROR: ${error.message})`)

    return {
      name,
      success: false,
      status: 0,
      duration,
      error: error.message,
      url
    }
  }
}

/**
 * Test suite for login page performance
 */
async function testLoginPerformance() {
  console.log('\n📝 Testing Login Page Performance...')

  const result = await testEndpoint(
    'Login Page Load',
    `${TEST_CONFIG.baseUrl}/login`
  )

  const isWithinLimit = result.duration <= TEST_CONFIG.maxResponseTime.login

  if (isWithinLimit) {
    console.log(`✅ Login performance: PASS (${result.duration}ms <= ${TEST_CONFIG.maxResponseTime.login}ms)`)
  } else {
    console.log(`⚠️ Login performance: SLOW (${result.duration}ms > ${TEST_CONFIG.maxResponseTime.login}ms)`)
  }

  return { ...result, withinLimit: isWithinLimit }
}

/**
 * Test suite for API endpoint performance
 */
async function testAPIPerformance() {
  console.log('\n🔌 Testing API Performance...')

  const endpoints = [
    { name: 'Pilots API', path: '/api/pilots' },
    { name: 'Settings API', path: '/api/settings' },
    { name: 'Check Types API', path: '/api/check-types' },
    { name: 'Dashboard Stats API', path: '/api/dashboard/stats' }
  ]

  const results = []

  for (const endpoint of endpoints) {
    const result = await testEndpoint(
      endpoint.name,
      `${TEST_CONFIG.baseUrl}${endpoint.path}`
    )

    const isWithinLimit = result.duration <= TEST_CONFIG.maxResponseTime.api

    if (isWithinLimit) {
      console.log(`✅ ${endpoint.name}: FAST`)
    } else {
      console.log(`⚠️ ${endpoint.name}: SLOW`)
    }

    results.push({ ...result, withinLimit: isWithinLimit })
  }

  return results
}

/**
 * Test suite for report generation performance
 */
async function testReportPerformance() {
  console.log('\n📊 Testing Report Generation Performance...')

  const reportTypes = [
    'fleet-compliance',
    'pilot-summary',
    'risk-assessment',
    'planning-rostering'
  ]

  const results = []

  for (const reportType of reportTypes) {
    const result = await testEndpoint(
      `${reportType} Report`,
      `${TEST_CONFIG.baseUrl}/api/reports?type=${reportType}`
    )

    const isWithinLimit = result.duration <= TEST_CONFIG.maxResponseTime.reports

    if (isWithinLimit) {
      console.log(`✅ ${reportType} report: ACCEPTABLE`)
    } else {
      console.log(`⚠️ ${reportType} report: SLOW`)
    }

    results.push({ ...result, withinLimit: isWithinLimit })
  }

  return results
}

/**
 * Test database query optimization
 */
async function testDatabaseOptimization() {
  console.log('\n🗄️ Testing Database Query Optimization...')

  // Test multiple parallel requests to detect N+1 issues
  const parallelRequests = 5
  const start = performance.now()

  const promises = Array(parallelRequests).fill().map(() =>
    fetch(`${TEST_CONFIG.baseUrl}/api/pilots`)
  )

  try {
    await Promise.all(promises)
    const end = performance.now()
    const duration = Math.round(end - start)
    const avgDuration = Math.round(duration / parallelRequests)

    console.log(`✅ Parallel requests: ${parallelRequests} requests in ${duration}ms (avg: ${avgDuration}ms)`)

    return {
      name: 'Database Optimization',
      success: true,
      parallelRequests,
      totalDuration: duration,
      averageDuration: avgDuration
    }
  } catch (error) {
    console.log(`❌ Parallel requests failed: ${error.message}`)
    return {
      name: 'Database Optimization',
      success: false,
      error: error.message
    }
  }
}

/**
 * Test cache effectiveness
 */
async function testCacheEffectiveness() {
  console.log('\n🔥 Testing Cache Effectiveness...')

  // First request (cold cache)
  const coldStart = performance.now()
  await fetch(`${TEST_CONFIG.baseUrl}/api/check-types`)
  const coldEnd = performance.now()
  const coldDuration = Math.round(coldEnd - coldStart)

  // Second request (warm cache)
  const warmStart = performance.now()
  await fetch(`${TEST_CONFIG.baseUrl}/api/check-types`)
  const warmEnd = performance.now()
  const warmDuration = Math.round(warmEnd - warmStart)

  const improvement = Math.round(((coldDuration - warmDuration) / coldDuration) * 100)

  console.log(`📊 Cold cache: ${coldDuration}ms`)
  console.log(`📊 Warm cache: ${warmDuration}ms`)
  console.log(`📊 Improvement: ${improvement}%`)

  return {
    name: 'Cache Effectiveness',
    coldDuration,
    warmDuration,
    improvement,
    effective: improvement > 10 // At least 10% improvement expected
  }
}

/**
 * Generate performance report
 */
function generateReport(results) {
  console.log('\n📋 PERFORMANCE REPORT')
  console.log('=' .repeat(50))

  let totalTests = 0
  let passedTests = 0
  let issues = []

  // Analyze results
  Object.entries(results).forEach(([category, data]) => {
    console.log(`\n${category.toUpperCase()}:`)

    if (Array.isArray(data)) {
      data.forEach(test => {
        totalTests++
        if (test.success && test.withinLimit !== false) {
          passedTests++
          console.log(`  ✅ ${test.name}`)
        } else {
          console.log(`  ❌ ${test.name}`)
          issues.push(`${category}: ${test.name} - ${test.error || 'Performance issue'}`)
        }
      })
    } else {
      totalTests++
      if (data.success && data.withinLimit !== false && data.effective !== false) {
        passedTests++
        console.log(`  ✅ ${data.name}`)
      } else {
        console.log(`  ❌ ${data.name}`)
        issues.push(`${category}: ${data.name} - ${data.error || 'Performance issue'}`)
      }
    }
  })

  // Summary
  console.log('\nSUMMARY:')
  console.log(`Tests passed: ${passedTests}/${totalTests}`)
  console.log(`Success rate: ${Math.round((passedTests / totalTests) * 100)}%`)

  if (issues.length > 0) {
    console.log('\nISSUES TO INVESTIGATE:')
    issues.forEach(issue => console.log(`  • ${issue}`))
  }

  // Overall grade
  const successRate = (passedTests / totalTests) * 100
  if (successRate >= 90) {
    console.log('\n🎉 OVERALL GRADE: EXCELLENT')
  } else if (successRate >= 75) {
    console.log('\n👍 OVERALL GRADE: GOOD')
  } else if (successRate >= 60) {
    console.log('\n⚠️ OVERALL GRADE: NEEDS IMPROVEMENT')
  } else {
    console.log('\n🚨 OVERALL GRADE: CRITICAL ISSUES')
  }
}

/**
 * Main test runner
 */
async function runPerformanceTests() {
  console.log('🚀 Air Niugini PMS Performance Test Suite')
  console.log('=' .repeat(50))
  console.log(`Base URL: ${TEST_CONFIG.baseUrl}`)
  console.log(`Timeout: ${TEST_CONFIG.timeout}ms`)
  console.log('')

  const results = {}

  try {
    // Run all test suites
    results.login = await testLoginPerformance()
    results.api = await testAPIPerformance()
    results.reports = await testReportPerformance()
    results.database = await testDatabaseOptimization()
    results.cache = await testCacheEffectiveness()

    // Generate comprehensive report
    generateReport(results)

  } catch (error) {
    console.error('💥 Test suite failed:', error)
    process.exit(1)
  }
}

// Run tests if called directly
if (require.main === module) {
  runPerformanceTests()
}

module.exports = {
  runPerformanceTests,
  testEndpoint,
  TEST_CONFIG
}