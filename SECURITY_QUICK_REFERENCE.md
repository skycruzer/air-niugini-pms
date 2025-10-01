# Security Quick Reference Card

## Air Niugini PMS - Phase 4.1

---

## 🚀 Quick Start

### Secure a GET Endpoint

```typescript
import { withSecurity, SecurityConfig } from '@/lib/security-middleware';
import { RateLimitTier } from '@/lib/rate-limit';

const config: SecurityConfig = {
  rateLimitTier: RateLimitTier.READ,
  requireCsrf: false,
  validateContentType: ['application/json'],
  sanitizeInput: false,
  requireAuth: false,
};

export const GET = withSecurity(config, async (request) => {
  return NextResponse.json({ data: 'result' });
});
```

### Secure a POST/PUT/DELETE Endpoint

```typescript
import { withSecurity, SecurityConfig } from '@/lib/security-middleware';
import { RateLimitTier } from '@/lib/rate-limit';
import { sanitizeObject } from '@/lib/input-sanitization';

const config: SecurityConfig = {
  rateLimitTier: RateLimitTier.WRITE,
  requireCsrf: true, // Required for mutations
  validateContentType: ['application/json'],
  sanitizeInput: true,
  requireAuth: false,
};

export const POST = withSecurity(config, async (request) => {
  const body = await request.json();
  const cleanData = sanitizeObject(body); // Always sanitize!
  // Use cleanData
  return NextResponse.json({ success: true });
});
```

---

## 📊 Rate Limit Tiers

| Tier                   | Limit   | Use Case                  |
| ---------------------- | ------- | ------------------------- |
| `RateLimitTier.AUTH`   | 5/min   | Login, authentication     |
| `RateLimitTier.READ`   | 100/min | Data retrieval (GET)      |
| `RateLimitTier.WRITE`  | 30/min  | Data mutations (POST/PUT) |
| `RateLimitTier.BULK`   | 10/min  | Bulk operations           |
| `RateLimitTier.REPORT` | 20/min  | Report generation         |

---

## 🛡️ Input Sanitization

### Sanitize Individual Fields

```typescript
import {
  sanitizeEmail,
  sanitizeEmployeeId,
  sanitizeUuid,
  sanitizeDate,
  sanitizePhone,
} from '@/lib/input-sanitization';

const email = sanitizeEmail(input); // null if invalid
const empId = sanitizeEmployeeId(input); // null if invalid
const id = sanitizeUuid(input); // null if invalid
```

### Sanitize Objects

```typescript
import { sanitizeObject } from '@/lib/input-sanitization';

try {
  const cleanData = sanitizeObject(requestBody);
  // Use cleanData - all fields sanitized
} catch (error) {
  // Dangerous pattern detected (SQL injection, XSS, etc.)
  return NextResponse.json({ error: error.message }, { status: 400 });
}
```

### Check for Attacks

```typescript
import { containsSqlInjection, containsXss, containsPathTraversal } from '@/lib/input-sanitization';

if (containsSqlInjection(input)) {
  // Block request, log incident
}
```

---

## 🔐 Security Audit Logging

### Log Security Events

```typescript
import { logSecurityEvent, SecurityEventType } from '@/lib/security-audit';

await logSecurityEvent({
  eventType: SecurityEventType.FAILED_LOGIN,
  severity: 'medium', // low | medium | high | critical
  identifier: clientIp, // or userId
  userId: userId, // optional
  url: request.url,
  method: request.method,
  details: { reason: 'Invalid password' },
});
```

### Common Event Types

```typescript
SecurityEventType.FAILED_LOGIN;
SecurityEventType.SUCCESSFUL_LOGIN;
SecurityEventType.RATE_LIMIT_EXCEEDED;
SecurityEventType.CSRF_VALIDATION_FAILED;
SecurityEventType.SUSPICIOUS_INPUT;
SecurityEventType.SQL_INJECTION_ATTEMPT;
SecurityEventType.XSS_ATTEMPT;
SecurityEventType.UNAUTHORIZED_ACCESS;
SecurityEventType.SYSTEM_ERROR;
```

### Query Security Events

```typescript
import { getSecurityEvents, getSecurityEventStats } from '@/lib/security-audit';

// Get recent events
const events = await getSecurityEvents({
  severity: 'high',
  startDate: new Date(Date.now() - 24 * 60 * 60 * 1000),
  limit: 50,
});

// Get statistics
const stats = await getSecurityEventStats();
```

### Detect Suspicious Activity

```typescript
import { detectSuspiciousActivity } from '@/lib/security-audit';

const result = await detectSuspiciousActivity(clientIp, 5); // 5-minute window

if (result.isSuspicious) {
  console.warn('Suspicious:', result.reasons);
  // Block IP, alert admin, etc.
}
```

---

## 🔒 CSRF Protection

### Frontend Integration

```typescript
// Get CSRF token from cookie
const csrfToken = document.cookie
  .split('; ')
  .find((row) => row.startsWith('csrf_token='))
  ?.split('=')[1];

// Include in mutation requests
await fetch('/api/pilots', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-CSRF-Token': csrfToken, // Required!
  },
  body: JSON.stringify(data),
});
```

### Standalone CSRF Validation

```typescript
import { validateCsrfMiddleware } from '@/lib/csrf';

const csrfError = await validateCsrfMiddleware(request);
if (csrfError) {
  return csrfError; // 403 Forbidden
}
```

---

## 📝 Security Configuration Options

```typescript
interface SecurityConfig {
  rateLimitTier: RateLimitTier; // Required
  requireCsrf: boolean; // true for POST/PUT/DELETE
  validateContentType?: string[]; // ['application/json']
  sanitizeInput?: boolean; // true for mutations
  requireAuth?: boolean; // true if auth required
}
```

### Common Configurations

**Public Read Endpoint**:

```typescript
{
  rateLimitTier: RateLimitTier.READ,
  requireCsrf: false,
  validateContentType: ['application/json'],
  sanitizeInput: false,
  requireAuth: false
}
```

**Protected Write Endpoint**:

```typescript
{
  rateLimitTier: RateLimitTier.WRITE,
  requireCsrf: true,
  validateContentType: ['application/json'],
  sanitizeInput: true,
  requireAuth: true
}
```

**Bulk Operation Endpoint**:

```typescript
{
  rateLimitTier: RateLimitTier.BULK,
  requireCsrf: true,
  validateContentType: ['application/json'],
  sanitizeInput: true,
  requireAuth: true
}
```

---

## 🧪 Testing

### Run Security Tests

```bash
# Start dev server
npm run dev

# Run tests in another terminal
node test-security.js
```

### Manual Testing

```bash
# Test rate limiting
for i in {1..105}; do curl http://localhost:3000/api/pilots; done

# Test input sanitization
curl -X POST http://localhost:3000/api/pilots \
  -H "Content-Type: application/json" \
  -d '{"first_name":"<script>alert(1)</script>"}'

# Check security headers
curl -I http://localhost:3000/api/pilots
```

---

## 📦 Database Migration

### Apply Migration

```sql
-- Run in Supabase SQL Editor
-- File: migrations/008_security_audit_log.sql
```

### Query Audit Logs

```sql
-- Recent high severity events
SELECT * FROM recent_high_severity_events;

-- Statistics
SELECT * FROM security_audit_stats;

-- Detect suspicious patterns
SELECT * FROM detect_suspicious_patterns('192.168.1.1', 5);

-- Cleanup old logs
SELECT cleanup_old_security_audit_logs();
```

---

## 🚨 Common Issues

**Rate limit not working**:

- Check if `withSecurity` wrapper is used
- Verify rate limit tier is set correctly

**CSRF validation failing**:

- Ensure token is in both cookie AND header
- Check token is generated on GET request
- Verify token hasn't expired (1 hour)

**Input sanitization too strict**:

- Review patterns in `input-sanitization.ts`
- Add field-specific handling if needed

**Security headers missing**:

- Ensure `applySecurityHeaders` is called
- Check middleware wrapper is used

---

## 📚 Documentation

- **Complete Guide**: SECURITY_IMPLEMENTATION_GUIDE.md
- **Implementation Report**: SECURITY_PHASE_4.1_COMPLETE.md
- **Example Route**: src/app/api/pilots/route.secured.ts
- **Test Suite**: test-security.js

---

## ✅ Checklist

Before deploying:

- [ ] Applied database migration
- [ ] Secured all API routes
- [ ] Updated frontend for CSRF tokens
- [ ] Run security test suite
- [ ] Verified security headers
- [ ] Set up monitoring
- [ ] Documented custom configurations

---

**Quick Reference - Phase 4.1 Security Implementation**
_Air Niugini B767 Pilot Management System_
