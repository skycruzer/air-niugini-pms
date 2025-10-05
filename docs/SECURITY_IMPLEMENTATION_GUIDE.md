# Security Implementation Guide

## Air Niugini B767 Pilot Management System

**Phase 4.1: Rate Limiting & API Security**

---

## Overview

This guide provides comprehensive documentation for the security infrastructure implemented in the Air Niugini PMS. The system includes:

- **Rate Limiting**: Tiered rate limiting with in-memory storage
- **CSRF Protection**: Token-based CSRF validation for mutations
- **Input Sanitization**: Protection against SQL injection, XSS, and path traversal
- **Security Audit Logging**: Comprehensive event tracking
- **Security Headers**: Industry-standard security headers on all responses

---

## Security Components

### 1. Rate Limiting (`src/lib/rate-limit.ts`)

**Purpose**: Prevent abuse by limiting request rates per IP/user.

**Rate Limit Tiers**:

- `AUTH`: 5 requests/minute (login, authentication)
- `READ`: 100 requests/minute (data retrieval)
- `WRITE`: 30 requests/minute (data mutations)
- `BULK`: 10 requests/minute (bulk operations)
- `REPORT`: 20 requests/minute (report generation)

**Usage**:

```typescript
import { withRateLimit, RateLimitTier } from '@/lib/rate-limit';

export const GET = withRateLimit(RateLimitTier.READ, async (request) => {
  // Your handler code
  return NextResponse.json({ data: 'result' });
});
```

**Features**:

- In-memory storage with automatic cleanup
- Configurable limits per tier
- Returns 429 status with Retry-After header
- Adds rate limit headers to all responses

---

### 2. Input Sanitization (`src/lib/input-sanitization.ts`)

**Purpose**: Validate and sanitize all user inputs to prevent injection attacks.

**Detection Patterns**:

- SQL injection (UNION, INSERT, DELETE, DROP, etc.)
- XSS (script tags, event handlers, javascript:, etc.)
- Path traversal (../, ~/, null bytes)

**Available Functions**:

```typescript
import {
  sanitizeString, // HTML escape and trim
  stripHtml, // Remove all HTML tags
  sanitizeEmail, // Validate and normalize email
  sanitizeEmployeeId, // Validate Air Niugini employee ID
  sanitizeDate, // Validate and format date
  sanitizeUuid, // Validate UUID format
  sanitizePhone, // Validate and normalize phone
  sanitizeObject, // Recursively sanitize object
  containsSqlInjection, // Check for SQL injection
  containsXss, // Check for XSS patterns
  containsPathTraversal, // Check for path traversal
} from '@/lib/input-sanitization';
```

**Usage Example**:

```typescript
// Sanitize individual fields
const email = sanitizeEmail(userInput.email);
if (!email) {
  return NextResponse.json({ error: 'Invalid email' }, { status: 400 });
}

// Sanitize entire object
try {
  const cleanData = sanitizeObject(requestBody);
  // Use cleanData for database operations
} catch (error) {
  // Dangerous pattern detected
  return NextResponse.json({ error: error.message }, { status: 400 });
}
```

---

### 3. CSRF Protection (`src/lib/csrf.ts`)

**Purpose**: Prevent Cross-Site Request Forgery attacks on mutation endpoints.

**How It Works**:

1. GET requests receive a CSRF token in cookie and header
2. Mutation requests (POST/PUT/DELETE) must include token in both cookie and header
3. Tokens are validated and expire after 1 hour
4. Tokens are tied to user ID when authenticated

**Usage**:

```typescript
import { withCsrfProtection } from '@/lib/csrf';

// Automatically adds CSRF protection
export const POST = withCsrfProtection(async (request) => {
  // CSRF validated before reaching here
  return NextResponse.json({ success: true });
});
```

**Client-Side Integration**:

```typescript
// In your fetch calls, include the CSRF token from cookie
const csrfToken = getCookie('csrf_token');

await fetch('/api/pilots', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-CSRF-Token': csrfToken,
  },
  body: JSON.stringify(data),
});
```

---

### 4. Security Middleware (`src/lib/security-middleware.ts`)

**Purpose**: Comprehensive security layer combining all protections.

**Features**:

- Rate limiting
- CSRF protection
- Content-Type validation
- Security headers (CSP, X-Frame-Options, etc.)
- API key validation
- Authentication checking
- Audit logging

**Usage**:

```typescript
import { withSecurity, SecurityConfig } from '@/lib/security-middleware';
import { RateLimitTier } from '@/lib/rate-limit';

const securityConfig: SecurityConfig = {
  rateLimitTier: RateLimitTier.WRITE,
  requireCsrf: true,
  validateContentType: ['application/json'],
  sanitizeInput: true,
  requireAuth: false, // Optional: require authentication
};

export const POST = withSecurity(securityConfig, async (request) => {
  // All security checks passed
  return NextResponse.json({ success: true });
});
```

**Security Headers Applied**:

```
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
X-XSS-Protection: 1; mode=block
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=()
Content-Security-Policy: (see code for full policy)
```

---

### 5. Security Audit Logging (`src/lib/security-audit.ts`)

**Purpose**: Track all security events for monitoring and compliance.

**Event Types**:

- Authentication (login, logout, failures)
- Rate limiting violations
- CSRF validation failures
- Input validation failures (SQL injection, XSS)
- Unauthorized access attempts
- System errors

**Usage**:

```typescript
import { logSecurityEvent, SecurityEventType } from '@/lib/security-audit';

await logSecurityEvent({
  eventType: SecurityEventType.FAILED_LOGIN,
  severity: 'medium',
  identifier: clientIp,
  userId: userId,
  url: request.url,
  method: request.method,
  details: {
    reason: 'Invalid password',
    attempts: 3,
  },
});
```

**Querying Events**:

```typescript
import { getSecurityEvents, getSecurityEventStats } from '@/lib/security-audit';

// Get recent high severity events
const events = await getSecurityEvents({
  severity: 'high',
  startDate: new Date(Date.now() - 24 * 60 * 60 * 1000),
  limit: 50,
});

// Get statistics
const stats = await getSecurityEventStats();
console.log(`Total events: ${stats.total}`);
console.log(`High severity: ${stats.recentHighSeverity}`);
```

**Suspicious Activity Detection**:

```typescript
import { detectSuspiciousActivity } from '@/lib/security-audit';

const result = await detectSuspiciousActivity(clientIp, 5); // 5-minute window

if (result.isSuspicious) {
  console.warn('Suspicious activity:', result.reasons);
  // Take action: block IP, alert admin, etc.
}
```

---

## Database Schema

### Security Audit Log Table

**Table**: `security_audit_log`

```sql
CREATE TABLE security_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  identifier TEXT NOT NULL,
  user_id UUID,
  url TEXT,
  method TEXT,
  details JSONB DEFAULT '{}'::jsonb,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Indexes**:

- `idx_security_audit_log_event_type` - Query by event type
- `idx_security_audit_log_severity` - Query by severity
- `idx_security_audit_log_identifier` - Query by IP/user
- `idx_security_audit_log_timestamp` - Time-based queries
- `idx_security_audit_log_composite` - Combined queries
- `idx_security_audit_log_high_severity` - High severity events

**Views**:

- `security_audit_stats` - Event statistics (last 30 days)
- `recent_high_severity_events` - High/critical events (last 24 hours)

**Functions**:

- `cleanup_old_security_audit_logs()` - Remove logs older than 90 days
- `detect_suspicious_patterns(identifier, time_window)` - Pattern detection

---

## Applying Security to API Routes

### Step 1: Choose Security Configuration

Determine appropriate security settings:

**Read Endpoints** (GET):

```typescript
const securityConfig: SecurityConfig = {
  rateLimitTier: RateLimitTier.READ,
  requireCsrf: false, // CSRF not needed for GET
  validateContentType: ['application/json'],
  sanitizeInput: false,
  requireAuth: false,
};
```

**Write Endpoints** (POST/PUT/DELETE):

```typescript
const securityConfig: SecurityConfig = {
  rateLimitTier: RateLimitTier.WRITE,
  requireCsrf: true, // CSRF required for mutations
  validateContentType: ['application/json'],
  sanitizeInput: true,
  requireAuth: false, // Set to true if authentication required
};
```

**Bulk Operations**:

```typescript
const securityConfig: SecurityConfig = {
  rateLimitTier: RateLimitTier.BULK,
  requireCsrf: true,
  validateContentType: ['application/json'],
  sanitizeInput: true,
  requireAuth: true, // Usually require auth for bulk ops
};
```

### Step 2: Apply Security Wrapper

```typescript
import { withSecurity, SecurityConfig } from '@/lib/security-middleware';

async function handler(request: NextRequest) {
  // Your existing handler code
}

export const GET = withSecurity(getSecurityConfig, handler);
export const POST = withSecurity(postSecurityConfig, handler);
```

### Step 3: Add Input Sanitization

```typescript
import { sanitizeObject, sanitizeUuid } from '@/lib/input-sanitization';

async function handler(request: NextRequest) {
  // Sanitize URL parameters
  const id = sanitizeUuid(searchParams.get('id'));
  if (!id) {
    return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
  }

  // Sanitize request body
  if (request.method !== 'GET') {
    try {
      const body = await request.json();
      const cleanData = sanitizeObject(body);
      // Use cleanData
    } catch (error) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
    }
  }
}
```

### Step 4: Add Audit Logging

```typescript
import { logSecurityEvent, SecurityEventType } from '@/lib/security-audit';

// Log important operations
await logSecurityEvent({
  eventType: SecurityEventType.SUCCESSFUL_LOGIN,
  severity: 'low',
  identifier: getClientIdentifier(request),
  userId: userId,
  url: request.url,
  method: request.method,
  details: { action: 'data_update' },
});
```

---

## Example: Secured API Route

See `src/app/api/pilots/route.secured.ts` for a complete example of a secured API route implementing all security features.

---

## Testing Security Measures

### 1. Rate Limiting Tests

```bash
# Test rate limit on read endpoint
for i in {1..105}; do
  curl http://localhost:3000/api/pilots
done
# Should return 429 after 100 requests

# Test rate limit on write endpoint
for i in {1..35}; do
  curl -X PUT http://localhost:3000/api/pilots?id=123 \
    -H "Content-Type: application/json" \
    -d '{"first_name":"Test"}'
done
# Should return 429 after 30 requests
```

### 2. CSRF Protection Tests

```bash
# Test without CSRF token (should fail)
curl -X POST http://localhost:3000/api/pilots \
  -H "Content-Type: application/json" \
  -d '{"first_name":"Test"}'
# Expected: 403 Forbidden

# Test with token (should succeed)
# First get token from GET request, then use it in POST
```

### 3. Input Sanitization Tests

```bash
# Test SQL injection detection
curl -X POST http://localhost:3000/api/pilots \
  -H "Content-Type: application/json" \
  -d '{"first_name":"Test OR 1=1--"}'
# Expected: 400 Bad Request with error message

# Test XSS detection
curl -X POST http://localhost:3000/api/pilots \
  -H "Content-Type: application/json" \
  -d '{"first_name":"<script>alert(1)</script>"}'
# Expected: 400 Bad Request with error message
```

### 4. Security Headers Tests

```bash
# Check security headers
curl -I http://localhost:3000/api/pilots
# Expected headers:
# X-Frame-Options: DENY
# X-Content-Type-Options: nosniff
# X-XSS-Protection: 1; mode=block
# etc.
```

---

## Monitoring & Maintenance

### 1. Monitor Security Events

```typescript
// Get daily security summary
const stats = await getSecurityEventStats(new Date(Date.now() - 24 * 60 * 60 * 1000), new Date());

console.log('Security Summary:');
console.log(`Total events: ${stats.total}`);
console.log(`High severity: ${stats.recentHighSeverity}`);
console.log('By type:', stats.byType);
console.log('By severity:', stats.bySeverity);
```

### 2. Check for Suspicious Activity

```typescript
// Run periodic checks
setInterval(
  async () => {
    const suspiciousIps = new Set();

    // Get recent high severity events
    const events = await getSecurityEvents({
      severity: 'high',
      startDate: new Date(Date.now() - 5 * 60 * 1000),
    });

    for (const event of events) {
      const result = await detectSuspiciousActivity(event.identifier, 5);
      if (result.isSuspicious) {
        suspiciousIps.add(event.identifier);
        console.warn(`Suspicious activity from ${event.identifier}:`, result.reasons);
      }
    }
  },
  5 * 60 * 1000
); // Every 5 minutes
```

### 3. Database Cleanup

The security audit log includes automatic cleanup:

```sql
-- Manual cleanup (removes logs older than 90 days)
SELECT cleanup_old_security_audit_logs();

-- Or schedule with pg_cron:
SELECT cron.schedule('cleanup-security-logs', '0 2 * * 0',
  'SELECT cleanup_old_security_audit_logs()'
);
```

---

## Performance Considerations

### 1. Rate Limit Storage

- **Current**: In-memory storage
- **Scale**: Good for single-server deployments
- **Alternative**: For multi-server, consider Redis with @upstash/ratelimit

### 2. CSRF Token Storage

- **Current**: In-memory Map
- **Scale**: Good for single-server deployments
- **Alternative**: For multi-server, store in Redis or database

### 3. Audit Log Buffer

- **Current**: In-memory buffer with auto-flush (5 minutes)
- **Benefits**: Prevents database bottleneck
- **Max size**: 1000 events before oldest dropped

---

## Security Best Practices

### 1. Environment Variables

Never commit sensitive values:

```env
# .env.local (never commit)
SUPABASE_SERVICE_ROLE_KEY=your_key_here
API_KEY=your_api_key_here
```

### 2. Regular Security Audits

- Review security logs weekly
- Check for suspicious patterns
- Update rate limits based on usage
- Review and update CSP policy as needed

### 3. Incident Response

If suspicious activity detected:

1. Log the event with high severity
2. Consider blocking the IP temporarily
3. Review audit logs for related events
4. Alert system administrators
5. Document and review patterns

---

## Deployment Checklist

- [ ] Apply database migration for security_audit_log table
- [ ] Update environment variables with API keys
- [ ] Test rate limiting on all endpoints
- [ ] Verify CSRF protection on mutation endpoints
- [ ] Check security headers on all responses
- [ ] Set up monitoring for high severity events
- [ ] Configure log cleanup schedule
- [ ] Document any custom security configurations
- [ ] Train team on security event monitoring
- [ ] Set up alerting for critical security events

---

## Support & Troubleshooting

### Common Issues

**Issue**: Rate limit headers not appearing

- **Solution**: Ensure `addRateLimitHeaders` is called in response chain

**Issue**: CSRF token not being set

- **Solution**: Check GET request is generating token, verify cookie settings

**Issue**: Input sanitization too strict

- **Solution**: Adjust patterns or add field-specific handling in `sanitizeObject`

**Issue**: Security audit log not writing

- **Solution**: Check database permissions, verify table exists, check buffer flush

---

## Conclusion

The Air Niugini PMS security infrastructure provides comprehensive protection against common web vulnerabilities. Follow this guide to implement security on all API routes and maintain a secure system.

For questions or issues, refer to the individual module documentation in the source code.
