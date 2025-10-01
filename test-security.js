/**
 * Security Testing Script
 *
 * Tests all security features:
 * - Rate limiting
 * - Input sanitization
 * - Security headers
 * - CSRF protection (when implemented)
 *
 * Usage: node test-security.js
 */

const http = require('http');

// Configuration
const BASE_URL = process.env.TEST_URL || 'http://localhost:3000';
const API_ENDPOINTS = {
  pilots: '/api/pilots',
  dashboard: '/api/dashboard/stats',
  certifications: '/api/certifications',
};

// Color codes for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logTest(testName) {
  console.log('\n' + '='.repeat(60));
  log(`Testing: ${testName}`, 'cyan');
  console.log('='.repeat(60));
}

function logResult(passed, message) {
  const icon = passed ? '✅' : '❌';
  const color = passed ? 'green' : 'red';
  log(`${icon} ${message}`, color);
}

/**
 * Make HTTP request
 */
async function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const requestOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port,
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: options.headers || {},
    };

    const req = http.request(requestOptions, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          headers: res.headers,
          body: data,
          json: () => {
            try {
              return JSON.parse(data);
            } catch {
              return null;
            }
          },
        });
      });
    });

    req.on('error', reject);

    if (options.body) {
      req.write(JSON.stringify(options.body));
    }

    req.end();
  });
}

/**
 * Test Rate Limiting
 */
async function testRateLimiting() {
  logTest('Rate Limiting');

  try {
    const endpoint = `${BASE_URL}${API_ENDPOINTS.pilots}`;
    const requests = [];

    // Make 105 requests to trigger rate limit (limit is 100/minute for READ)
    log(`Making 105 requests to ${endpoint}...`, 'blue');

    for (let i = 0; i < 105; i++) {
      requests.push(makeRequest(endpoint));
    }

    const responses = await Promise.all(requests);

    // Check if any requests were rate limited
    const rateLimited = responses.filter((r) => r.status === 429);
    const successful = responses.filter((r) => r.status === 200);

    logResult(
      rateLimited.length > 0,
      `Rate limiting triggered: ${rateLimited.length} requests blocked out of 105`
    );

    // Check rate limit headers
    const lastResponse = responses[responses.length - 1];
    const hasRateLimitHeaders = lastResponse.headers['x-ratelimit-limit'] !== undefined;

    logResult(
      hasRateLimitHeaders,
      `Rate limit headers present: ${hasRateLimitHeaders ? 'Yes' : 'No'}`
    );

    if (hasRateLimitHeaders) {
      log(`  Limit: ${lastResponse.headers['x-ratelimit-limit']}`, 'blue');
      log(`  Remaining: ${lastResponse.headers['x-ratelimit-remaining']}`, 'blue');
      log(`  Reset: ${lastResponse.headers['x-ratelimit-reset']}`, 'blue');
    }

    // Check Retry-After header on 429 response
    if (rateLimited.length > 0) {
      const hasRetryAfter = rateLimited[0].headers['retry-after'] !== undefined;
      logResult(hasRetryAfter, `Retry-After header present: ${hasRetryAfter ? 'Yes' : 'No'}`);
    }

    return {
      passed: rateLimited.length > 0 && hasRateLimitHeaders,
      details: {
        successful: successful.length,
        rateLimited: rateLimited.length,
        hasHeaders: hasRateLimitHeaders,
      },
    };
  } catch (error) {
    log(`Error testing rate limiting: ${error.message}`, 'red');
    return { passed: false, error: error.message };
  }
}

/**
 * Test Input Sanitization
 */
async function testInputSanitization() {
  logTest('Input Sanitization');

  const maliciousInputs = [
    {
      name: 'SQL Injection',
      payload: { first_name: "Test' OR '1'='1" },
      shouldBlock: true,
    },
    {
      name: 'XSS Attack',
      payload: { first_name: '<script>alert("XSS")</script>' },
      shouldBlock: true,
    },
    {
      name: 'Path Traversal',
      payload: { first_name: '../../../etc/passwd' },
      shouldBlock: true,
    },
    {
      name: 'Valid Input',
      payload: { first_name: 'John Doe' },
      shouldBlock: false,
    },
  ];

  const results = [];

  for (const test of maliciousInputs) {
    try {
      log(`\nTesting: ${test.name}`, 'yellow');

      const response = await makeRequest(`${BASE_URL}${API_ENDPOINTS.pilots}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: test.payload,
      });

      const blocked = response.status === 400 || response.status === 403;
      const passed = blocked === test.shouldBlock;

      logResult(
        passed,
        `${test.name}: ${blocked ? 'Blocked' : 'Allowed'} (Expected: ${test.shouldBlock ? 'Block' : 'Allow'})`
      );

      results.push({ test: test.name, passed });
    } catch (error) {
      log(`Error testing ${test.name}: ${error.message}`, 'red');
      results.push({ test: test.name, passed: false, error: error.message });
    }
  }

  const allPassed = results.every((r) => r.passed);
  return {
    passed: allPassed,
    details: results,
  };
}

/**
 * Test Security Headers
 */
async function testSecurityHeaders() {
  logTest('Security Headers');

  try {
    const response = await makeRequest(`${BASE_URL}${API_ENDPOINTS.pilots}`);

    const requiredHeaders = {
      'x-frame-options': 'DENY',
      'x-content-type-options': 'nosniff',
      'x-xss-protection': '1; mode=block',
      'referrer-policy': 'strict-origin-when-cross-origin',
    };

    const results = [];

    for (const [header, expectedValue] of Object.entries(requiredHeaders)) {
      const actualValue = response.headers[header];
      const present = actualValue !== undefined;
      const correct = present && actualValue.toLowerCase().includes(expectedValue.toLowerCase());

      logResult(correct, `${header}: ${actualValue || 'Missing'}`);

      results.push({
        header,
        present,
        correct,
        expected: expectedValue,
        actual: actualValue,
      });
    }

    // Check for Content-Security-Policy
    const hasCSP = response.headers['content-security-policy'] !== undefined;
    logResult(hasCSP, `content-security-policy: ${hasCSP ? 'Present' : 'Missing'}`);

    results.push({
      header: 'content-security-policy',
      present: hasCSP,
      correct: hasCSP,
    });

    const allPresent = results.every((r) => r.present);
    return {
      passed: allPresent,
      details: results,
    };
  } catch (error) {
    log(`Error testing security headers: ${error.message}`, 'red');
    return { passed: false, error: error.message };
  }
}

/**
 * Test CSRF Protection
 */
async function testCSRFProtection() {
  logTest('CSRF Protection');

  try {
    // First, make a GET request to get CSRF token
    log('Step 1: Getting CSRF token from GET request...', 'blue');
    const getResponse = await makeRequest(`${BASE_URL}${API_ENDPOINTS.pilots}`);

    const csrfToken = getResponse.headers['x-csrf-token'];
    const csrfCookie = getResponse.headers['set-cookie'];

    logResult(!!csrfToken, `CSRF token in header: ${csrfToken ? 'Present' : 'Missing'}`);
    logResult(!!csrfCookie, `CSRF cookie: ${csrfCookie ? 'Set' : 'Not set'}`);

    // Test mutation without CSRF token
    log('\nStep 2: Testing mutation without CSRF token...', 'blue');
    const withoutTokenResponse = await makeRequest(`${BASE_URL}${API_ENDPOINTS.pilots}?id=test`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: { first_name: 'Test' },
    });

    const blockedWithoutToken = withoutTokenResponse.status === 403;
    logResult(
      blockedWithoutToken,
      `Request blocked without token: ${blockedWithoutToken ? 'Yes' : 'No'} (Status: ${withoutTokenResponse.status})`
    );

    // Test mutation with CSRF token
    if (csrfToken) {
      log('\nStep 3: Testing mutation with CSRF token...', 'blue');
      const withTokenResponse = await makeRequest(`${BASE_URL}${API_ENDPOINTS.pilots}?id=test`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrfToken,
          Cookie: csrfCookie,
        },
        body: { first_name: 'Test' },
      });

      const allowedWithToken = withTokenResponse.status !== 403;
      logResult(
        allowedWithToken,
        `Request allowed with token: ${allowedWithToken ? 'Yes' : 'No'} (Status: ${withTokenResponse.status})`
      );

      return {
        passed: blockedWithoutToken && allowedWithToken,
        details: {
          tokenPresent: !!csrfToken,
          blockedWithoutToken,
          allowedWithToken,
        },
      };
    }

    return {
      passed: blockedWithoutToken,
      details: {
        tokenPresent: !!csrfToken,
        blockedWithoutToken,
      },
    };
  } catch (error) {
    log(`Error testing CSRF protection: ${error.message}`, 'red');
    return { passed: false, error: error.message };
  }
}

/**
 * Run all tests
 */
async function runAllTests() {
  console.log('\n' + '='.repeat(60));
  log('SECURITY TESTING SUITE', 'cyan');
  log(`Target: ${BASE_URL}`, 'blue');
  console.log('='.repeat(60));

  const results = {
    rateLimiting: await testRateLimiting(),
    inputSanitization: await testInputSanitization(),
    securityHeaders: await testSecurityHeaders(),
    csrfProtection: await testCSRFProtection(),
  };

  // Summary
  console.log('\n' + '='.repeat(60));
  log('TEST SUMMARY', 'cyan');
  console.log('='.repeat(60));

  const tests = [
    { name: 'Rate Limiting', result: results.rateLimiting },
    { name: 'Input Sanitization', result: results.inputSanitization },
    { name: 'Security Headers', result: results.securityHeaders },
    { name: 'CSRF Protection', result: results.csrfProtection },
  ];

  for (const test of tests) {
    logResult(test.result.passed, `${test.name}: ${test.result.passed ? 'PASSED' : 'FAILED'}`);
  }

  const allPassed = tests.every((t) => t.result.passed);
  console.log('\n' + '='.repeat(60));
  logResult(allPassed, `Overall Result: ${allPassed ? 'ALL TESTS PASSED' : 'SOME TESTS FAILED'}`);
  console.log('='.repeat(60) + '\n');

  return allPassed;
}

// Run tests
if (require.main === module) {
  runAllTests()
    .then((success) => {
      process.exit(success ? 0 : 1);
    })
    .catch((error) => {
      log(`Fatal error: ${error.message}`, 'red');
      process.exit(1);
    });
}

module.exports = { runAllTests };
