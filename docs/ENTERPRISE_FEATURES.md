# Enterprise Features Documentation

## Air Niugini B767 Pilot Management System

**Version:** 1.0.0
**Last Updated:** October 1, 2025
**Status:** Production Ready

---

## Table of Contents

1. [Overview](#overview)
2. [Advanced RBAC System](#advanced-rbac-system)
3. [System Monitoring](#system-monitoring)
4. [Webhook System](#webhook-system)
5. [Backup & Restore](#backup--restore)
6. [Integration Framework](#integration-framework)
7. [Health Check Endpoints](#health-check-endpoints)
8. [Security Features](#security-features)
9. [Performance Optimization](#performance-optimization)

---

## Overview

The Air Niugini Pilot Management System includes comprehensive enterprise features designed for production deployment in aviation operations. This document details all advanced features, their usage, and configuration.

### Key Enterprise Capabilities

- ✅ **Advanced Role-Based Access Control (RBAC)** - Granular permission system
- ✅ **Real-Time System Monitoring** - Performance metrics and health checks
- ✅ **Event-Driven Webhooks** - External system integration
- ✅ **Automated Backup & Restore** - Data protection and recovery
- ✅ **Integration API Framework** - OAuth 2.0 and API key management
- ✅ **Health Check Endpoints** - Kubernetes/Docker ready
- ✅ **Security Audit Trail** - Comprehensive logging
- ✅ **Performance Analytics** - Real-time metrics and optimization

---

## Advanced RBAC System

### Overview

The RBAC system provides fine-grained access control with 30+ granular permissions across 6 major categories.

**Location:** `/src/lib/rbac.ts`

### Permission Categories

#### 1. Pilot Management

- `pilot:create` - Create new pilot profiles
- `pilot:read` - View pilot information
- `pilot:update` - Edit pilot profiles
- `pilot:delete` - Delete pilot records
- `pilot:view_sensitive` - View sensitive information (salary, contracts)

#### 2. Certification Management

- `certification:create` - Add new certifications
- `certification:read` - View certification records
- `certification:update` - Update certification details
- `certification:delete` - Delete certifications
- `certification:bulk_update` - Bulk certification operations

#### 3. Leave Management

- `leave:create` - Submit leave requests
- `leave:read` - View leave requests
- `leave:update` - Modify leave requests
- `leave:delete` - Cancel leave requests
- `leave:approve` - Approve leave requests
- `leave:reject` - Reject leave requests

#### 4. Reports & Analytics

- `reports:view` - View reports
- `reports:export` - Export reports
- `reports:create` - Generate custom reports
- `analytics:view` - View analytics dashboard
- `analytics:advanced` - Access advanced analytics

#### 5. System Administration

- `system:settings` - Modify system settings
- `system:users` - Manage user accounts
- `system:audit` - View audit logs
- `system:backup` - Create/restore backups
- `system:monitoring` - Access system monitoring
- `system:webhooks` - Manage webhooks
- `system:api_keys` - Manage API keys

#### 6. Check Types Management

- `check_types:create` - Create certification types
- `check_types:update` - Update certification types
- `check_types:delete` - Delete certification types

### Role Definitions

```typescript
// Admin - Full System Access
const adminPermissions = [
  /* all permissions */
];

// Manager - Operational Management
const managerPermissions = [
  'pilot:read',
  'pilot:update',
  'pilot:view_sensitive',
  'certification:create',
  'certification:read',
  'certification:update',
  'certification:bulk_update',
  'leave:create',
  'leave:read',
  'leave:update',
  'leave:approve',
  'leave:reject',
  'reports:view',
  'reports:export',
  'analytics:view',
];

// User - Standard Access
const userPermissions = [
  'pilot:read',
  'certification:read',
  'leave:create',
  'leave:read',
  'reports:view',
];

// Read-Only - View Only
const readOnlyPermissions = [
  'pilot:read',
  'certification:read',
  'leave:read',
  'reports:view',
  'analytics:view',
];
```

### Usage Examples

```typescript
import { createRBAC, roleHasPermission } from '@/lib/rbac';

// Create RBAC instance for user
const rbac = createRBAC(user.role);

// Check single permission
if (rbac.hasPermission('pilot:delete')) {
  // Show delete button
}

// Check multiple permissions (all required)
if (rbac.hasAllPermissions(['pilot:update', 'pilot:view_sensitive'])) {
  // Show sensitive edit form
}

// Check any permission (at least one required)
if (rbac.hasAnyPermission(['leave:approve', 'leave:reject'])) {
  // Show approval UI
}

// Get all user permissions
const permissions = rbac.getAllPermissions();
console.log('User has permissions:', permissions);

// Static role check
if (roleHasPermission('manager', 'certification:bulk_update')) {
  // Role has permission
}
```

### UI Integration

```tsx
import { useAuth } from '@/contexts/AuthContext';
import { createRBAC } from '@/lib/rbac';

function PilotActions() {
  const { user } = useAuth();
  const rbac = createRBAC(user.role);

  return (
    <div>
      {rbac.hasPermission('pilot:update') && <Button>Edit Pilot</Button>}
      {rbac.hasPermission('pilot:delete') && <Button variant="destructive">Delete Pilot</Button>}
    </div>
  );
}
```

---

## System Monitoring

### Overview

Real-time system health monitoring with comprehensive performance metrics, error tracking, and automated alerts.

**Locations:**

- Service: `/src/lib/system-monitoring.ts`
- Dashboard: `/src/app/dashboard/admin/system/page.tsx`
- Health API: `/src/app/api/health/route.ts`

### Monitored Metrics

#### 1. CPU Metrics

- Usage percentage
- Load average (1m, 5m, 15m)
- Core count

#### 2. Memory Metrics

- Total memory (MB)
- Used memory (MB)
- Free memory (MB)
- Usage percentage

#### 3. Database Metrics

- Connection status (healthy/degraded/down)
- Connection count
- Average query time
- Slow queries (>1s)
- Active connections
- Last backup timestamp

#### 4. API Metrics

- Total requests
- Success rate (%)
- Average response time (ms)
- Requests per minute
- Per-endpoint statistics

#### 5. Error Metrics

- Total errors
- Error rate (per minute)
- Errors by type
- Recent error log

#### 6. Uptime Metrics

- Start time
- Uptime (seconds)
- Uptime percentage
- Last downtime

### Usage Examples

```typescript
import { systemMonitoring, getSystemStatus } from '@/lib/system-monitoring';

// Get current metrics
const metrics = await systemMonitoring.getCurrentMetrics();
console.log('CPU Usage:', metrics.cpu.usage);
console.log('Memory:', metrics.memory.percentage);
console.log('DB Status:', metrics.database.status);

// Check system health
const health = await systemMonitoring.checkSystemHealth();
if (!health.healthy) {
  console.error('System issues:', health.issues);
  console.warn('Warnings:', health.warnings);
}

// Get simple status
const status = await getSystemStatus();
console.log(status.status); // 'healthy' | 'degraded' | 'down'
console.log(status.message);

// Get metrics history for charts
const history = systemMonitoring.getMetricsHistory('api_response_time', 24);
// Returns last 24 hours of response time data

// Get session metrics
const sessions = await systemMonitoring.getSessionMetrics();
console.log('Active users:', sessions.activeUsers);
console.log('Sessions by role:', sessions.sessionsByRole);
```

### Monitoring Dashboard

Access at: `/dashboard/admin/system`

**Features:**

- Real-time metrics display
- Auto-refresh every 30 seconds
- Health status with alerts
- Performance charts
- Session tracking
- Error monitoring

**Permissions Required:** `system:monitoring` (Admin only)

---

## Webhook System

### Overview

Event-driven webhook system for real-time notifications to external services. Supports automatic retries, delivery tracking, and comprehensive logging.

**Location:** `/src/lib/webhook-service.ts`

### Supported Events

#### Pilot Events

- `pilot.created` - New pilot added
- `pilot.updated` - Pilot information modified
- `pilot.deleted` - Pilot removed

#### Certification Events

- `certification.created` - New certification added
- `certification.updated` - Certification modified
- `certification.expiring` - Certification expires within threshold
- `certification.expired` - Certification has expired

#### Leave Events

- `leave.created` - Leave request submitted
- `leave.updated` - Leave request modified
- `leave.approved` - Leave request approved
- `leave.rejected` - Leave request rejected

#### System Events

- `system.alert` - System alert triggered
- `backup.completed` - Backup successfully completed
- `backup.failed` - Backup failed

### Webhook Configuration

```typescript
import { webhookService } from '@/lib/webhook-service';

// Register new webhook
const webhook = await webhookService.registerWebhook({
  url: 'https://api.example.com/webhooks/an-pms',
  events: ['certification.expiring', 'certification.expired', 'leave.approved'],
  description: 'HR System Integration',
  headers: {
    'X-API-Key': 'your-api-key',
  },
  createdBy: user.id,
});

console.log('Webhook ID:', webhook.id);
console.log('Secret:', webhook.secret); // For signature verification

// Update webhook
await webhookService.updateWebhook(webhook.id, {
  events: ['certification.expiring', 'certification.expired', 'pilot.created'],
  active: true,
});

// Test webhook
const testResult = await webhookService.testWebhook(webhook.id);
if (testResult.success) {
  console.log('Webhook test successful:', testResult.responseTime, 'ms');
} else {
  console.error('Webhook test failed:', testResult.error);
}

// Delete webhook
await webhookService.deleteWebhook(webhook.id);
```

### Triggering Webhooks

```typescript
import { triggerWebhookEvent } from '@/lib/webhook-service';

// Trigger certification expiry event
await triggerWebhookEvent('certification.expiring', {
  pilot: {
    id: pilot.id,
    name: `${pilot.first_name} ${pilot.last_name}`,
    employee_id: pilot.employee_id,
  },
  certification: {
    id: check.id,
    type: checkType.check_code,
    description: checkType.check_description,
    expiry_date: check.expiry_date,
    days_until_expiry: daysUntilExpiry,
  },
});

// Trigger leave approval
await triggerWebhookEvent('leave.approved', {
  leave: {
    id: leave.id,
    pilot_id: leave.pilot_id,
    type: leave.leave_type,
    start_date: leave.start_date,
    end_date: leave.end_date,
    roster_period: leave.roster_period,
  },
  approved_by: user.email,
  approved_at: new Date(),
});
```

### Webhook Payload Format

```json
{
  "id": "webhook_payload_xyz123",
  "event": "certification.expiring",
  "timestamp": "2025-10-01T12:00:00.000Z",
  "signature": "base64_hmac_signature",
  "data": {
    "pilot": {
      "id": "uuid",
      "name": "John Smith",
      "employee_id": "PX001"
    },
    "certification": {
      "id": "uuid",
      "type": "LPC",
      "description": "License Proficiency Check",
      "expiry_date": "2025-10-15",
      "days_until_expiry": 14
    }
  }
}
```

### Signature Verification

Webhooks include HMAC-SHA256 signatures for security:

```typescript
// Verify webhook signature
const signature = request.headers.get('X-Webhook-Signature');
const payload = await request.json();

const isValid = webhookService.verifySignature(payload, signature, webhookSecret);

if (!isValid) {
  return new Response('Invalid signature', { status: 401 });
}

// Process webhook
processWebhookData(payload);
```

### Monitoring & Logs

```typescript
// Get webhook statistics
const stats = webhookService.getWebhookStats(webhookId);
console.log('Total deliveries:', stats.totalDeliveries);
console.log('Success rate:', stats.successRate, '%');
console.log('Avg response time:', stats.averageResponseTime, 'ms');

// Get delivery logs
const logs = webhookService.getWebhookLogs(webhookId, 50);
logs.forEach((log) => {
  console.log(`${log.timestamp}: ${log.event} - ${log.status}`);
  if (log.error) {
    console.error('Error:', log.error);
  }
});
```

### Retry Logic

- Automatic retries on failure (configurable, default: 3)
- Exponential backoff (1s, 2s, 4s, max 60s)
- Delivery status tracking
- Failed delivery alerts

---

## Backup & Restore

### Overview

Automated backup system with point-in-time recovery, integrity verification, and retention management.

**Location:** `/src/lib/backup-service.ts`

### Backup Configuration

```typescript
import { backupService, createBackup } from '@/lib/backup-service';

// Create manual backup
const backup = await createBackup('Pre-deployment backup', user.id);

console.log('Backup ID:', backup.id);
console.log('Size:', backup.size, 'bytes');
console.log('Tables:', backup.tables);
console.log('Record counts:', backup.recordCount);

// Create backup with specific tables
const partialBackup = await backupService.createBackup({
  tables: ['pilots', 'pilot_checks'],
  description: 'Pilot data backup',
  createdBy: user.id,
});
```

### Automated Backups

```typescript
// Schedule automated backups
const interval = backupService.scheduleAutoBackup({
  interval: 24, // Every 24 hours
  retentionDays: 30, // Keep backups for 30 days
  createdBy: 'system',
});

// Cancel scheduled backups
clearInterval(interval);
```

### Restore Operations

```typescript
// List available backups
const backups = backupService.listBackups();
backups.forEach((backup) => {
  console.log(`${backup.timestamp}: ${backup.description}`);
  console.log(`  Status: ${backup.status}`);
  console.log(`  Size: ${formatBackupSize(backup.size)}`);
});

// Verify backup before restore
const verification = await backupService.verifyBackup(backupId);
if (!verification.valid) {
  console.error('Backup has issues:', verification.issues);
  return;
}

// Restore from backup
const result = await backupService.restoreBackup(backupId, {
  tables: ['pilots', 'pilot_checks'], // Optional: specific tables
  confirmWipe: true, // Required: confirm data deletion
});

if (result.success) {
  console.log('Restored tables:', result.tablesRestored);
  console.log('Records restored:', result.recordsRestored);
  console.log('Duration:', result.duration, 'ms');
} else {
  console.error('Restore errors:', result.errors);
}
```

### Backup Management

```typescript
// Get backup statistics
const stats = backupService.getBackupStatistics();
console.log('Total backups:', stats.totalBackups);
console.log('Total size:', formatBackupSize(stats.totalSize));
console.log('Success rate:', stats.successRate, '%');
console.log('Average size:', formatBackupSize(stats.averageSize));

// Clean old backups
const removed = await backupService.cleanOldBackups(30); // Keep last 30 days
console.log('Removed', removed, 'old backups');

// Export backup to JSON
const json = await backupService.exportBackup(backupId);
// Save to file or transfer to external storage
```

### Backup Tables

Default tables included in backups:

- `pilots` - All pilot records
- `pilot_checks` - Certification records
- `check_types` - Certification type definitions
- `users` - User accounts
- `leave_requests` - Leave request history
- `settings` - System configuration
- `contract_types` - Contract type definitions

### Best Practices

1. **Schedule Regular Backups:** Daily automated backups recommended
2. **Test Restores:** Verify backup integrity monthly
3. **Retention Policy:** Keep 30 days minimum, 90 days recommended
4. **Secure Storage:** Store backups in separate location/region
5. **Document Restores:** Log all restore operations for audit trail

---

## Integration Framework

### Overview

Flexible integration API framework supporting OAuth 2.0, API keys, and basic authentication for external system integration.

**Location:** `/src/lib/integration-api.ts`

### Authentication Types

#### 1. OAuth 2.0

Best for: Cloud services (Google, Microsoft, Salesforce)

```typescript
import { integrationAPI } from '@/lib/integration-api';

// Register OAuth 2.0 integration
const integration = await integrationAPI.registerIntegration({
  name: 'Microsoft Teams',
  type: 'oauth2',
  baseUrl: 'https://graph.microsoft.com/v1.0',
  authConfig: {
    type: 'oauth2',
    clientId: 'your-client-id',
    clientSecret: 'your-client-secret',
    authorizationUrl: 'https://login.microsoftonline.com/oauth2/v2.0/authorize',
    tokenUrl: 'https://login.microsoftonline.com/oauth2/v2.0/token',
    scope: ['User.Read', 'Calendars.Read'],
    redirectUri: 'https://yourapp.com/oauth/callback',
  },
  active: true,
  description: 'Microsoft Teams integration for calendar sync',
  syncEnabled: true,
  syncInterval: 60, // minutes
  createdBy: user.id,
});

// Initiate OAuth flow
const authUrl = await integrationAPI.initiateOAuth2(integration.id);
// Redirect user to authUrl

// Handle OAuth callback
await integrationAPI.handleOAuth2Callback(
  integration.id,
  code, // From query string
  state // From query string
);
```

#### 2. API Key

Best for: REST APIs with simple authentication

```typescript
// Register API key integration
const integration = await integrationAPI.registerIntegration({
  name: 'HR System',
  type: 'api_key',
  baseUrl: 'https://hr-api.company.com',
  authConfig: {
    type: 'api_key',
    key: 'your-api-key',
    headerName: 'X-API-Key',
    prefix: '', // Optional, e.g., 'Bearer '
  },
  active: true,
  description: 'HR system integration',
  syncEnabled: false,
  createdBy: user.id,
});
```

#### 3. Basic Authentication

Best for: Legacy systems

```typescript
// Register basic auth integration
const integration = await integrationAPI.registerIntegration({
  name: 'Legacy Database API',
  type: 'basic_auth',
  baseUrl: 'https://legacy-api.company.com',
  authConfig: {
    type: 'basic_auth',
    username: 'api_user',
    password: 'api_password',
  },
  active: true,
  description: 'Legacy system integration',
  syncEnabled: false,
  createdBy: user.id,
});
```

### Making API Calls

```typescript
// GET request
const data = await integrationAPI.callAPI(integrationId, '/users/profile', { method: 'GET' });

// POST request
const result = await integrationAPI.callAPI(integrationId, '/sync/pilots', {
  method: 'POST',
  body: {
    pilots: pilotData,
  },
  headers: {
    'Content-Type': 'application/json',
  },
});

// PUT request
await integrationAPI.callAPI(integrationId, '/users/123', {
  method: 'PUT',
  body: userData,
});
```

### Data Synchronization

```typescript
// Enable automatic sync
await integrationAPI.updateIntegration(integrationId, {
  syncEnabled: true,
  syncInterval: 60, // Sync every 60 minutes
});

// Get sync jobs history
const jobs = integrationAPI.getSyncJobs(integrationId);
jobs.forEach((job) => {
  console.log(`${job.startTime}: ${job.status}`);
  console.log(`  Records synced: ${job.recordsSynced}`);
  if (job.errors.length > 0) {
    console.error('  Errors:', job.errors);
  }
});
```

### Testing & Monitoring

```typescript
// Test integration connection
const test = await integrationAPI.testIntegration(integrationId);
if (test.success) {
  console.log('Connection successful:', test.responseTime, 'ms');
} else {
  console.error('Connection failed:', test.error);
}

// Get integration statistics
const stats = integrationAPI.getIntegrationStats(integrationId);
console.log('Total API calls:', stats.totalCalls);
console.log('Success rate:', ((stats.successfulCalls / stats.totalCalls) * 100).toFixed(2), '%');
console.log('Avg response time:', stats.averageResponseTime, 'ms');
console.log('Last call:', stats.lastCall);
console.log('Total syncs:', stats.totalSyncs);
console.log('Last sync:', stats.lastSync);

// Get API call history
const calls = integrationAPI.getAPICallHistory(integrationId, 50);
calls.forEach((call) => {
  console.log(`${call.timestamp}: ${call.method} ${call.endpoint}`);
  console.log(`  Response: ${call.responseCode} (${call.duration}ms)`);
  if (call.error) {
    console.error('  Error:', call.error);
  }
});
```

---

## Health Check Endpoints

### Overview

Production-ready health check endpoints for Kubernetes, Docker, and load balancer integration.

**Location:** `/src/app/api/health/route.ts`

### Available Endpoints

#### 1. Basic Health Check

**Endpoint:** `GET /api/health?check=basic`

Returns 200 if service is running.

```json
{
  "status": "healthy",
  "service": "Air Niugini Pilot Management System",
  "timestamp": "2025-10-01T12:00:00.000Z",
  "version": "1.0.0"
}
```

#### 2. Readiness Check

**Endpoint:** `GET /api/health?check=readiness`

Checks if service is ready to accept traffic.

```json
{
  "ready": true,
  "checks": {
    "database": true,
    "api": true,
    "timestamp": "2025-10-01T12:00:00.000Z"
  },
  "message": "Service is ready"
}
```

Returns:

- `200` - Service is ready
- `503` - Service is not ready

#### 3. Liveness Check

**Endpoint:** `GET /api/health?check=liveness`

Simple check for orchestration systems.

```json
{
  "alive": true,
  "timestamp": "2025-10-01T12:00:00.000Z"
}
```

#### 4. Detailed Health Check

**Endpoint:** `GET /api/health?check=detailed`

Comprehensive system status.

```json
{
  "status": "healthy",
  "healthy": true,
  "timestamp": "2025-10-01T12:00:00.000Z",
  "checks": {
    "database": {
      "status": "healthy",
      "averageQueryTime": "45ms",
      "activeConnections": 5
    },
    "api": {
      "successRate": "98.5%",
      "averageResponseTime": "145ms",
      "requestsPerMinute": 25
    },
    "memory": {
      "used": "128.00 MB",
      "total": "512 MB",
      "percentage": "25.00%"
    },
    "uptime": {
      "seconds": 86400,
      "formatted": "1d",
      "percentage": "99.9%"
    },
    "errors": {
      "total": 15,
      "rate": 0.3
    }
  },
  "issues": [],
  "warnings": []
}
```

### Kubernetes Integration

```yaml
# deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: an-pms
spec:
  template:
    spec:
      containers:
        - name: an-pms
          image: an-pms:latest
          ports:
            - containerPort: 3000
          livenessProbe:
            httpGet:
              path: /api/health?check=liveness
              port: 3000
            initialDelaySeconds: 30
            periodSeconds: 10
            timeoutSeconds: 5
            failureThreshold: 3
          readinessProbe:
            httpGet:
              path: /api/health?check=readiness
              port: 3000
            initialDelaySeconds: 10
            periodSeconds: 5
            timeoutSeconds: 3
            failureThreshold: 3
```

### Docker Compose

```yaml
# docker-compose.yml
services:
  an-pms:
    image: an-pms:latest
    ports:
      - '3000:3000'
    healthcheck:
      test: ['CMD', 'curl', '-f', 'http://localhost:3000/api/health?check=readiness']
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
```

### Load Balancer Configuration

```nginx
# nginx.conf
upstream an_pms {
    server app1:3000 max_fails=3 fail_timeout=30s;
    server app2:3000 max_fails=3 fail_timeout=30s;
}

server {
    listen 80;

    # Health check endpoint
    location /api/health {
        proxy_pass http://an_pms;
        proxy_http_version 1.1;
        proxy_set_header Connection "";
    }

    # Regular traffic
    location / {
        proxy_pass http://an_pms;
        # ... other proxy settings
    }
}
```

---

## Security Features

### Authentication & Authorization

- ✅ Supabase Auth with Row Level Security (RLS)
- ✅ JWT-based session management
- ✅ Role-based access control (RBAC)
- ✅ Granular permissions (30+ permissions)
- ✅ Session timeout and refresh

### Data Protection

- ✅ Encrypted database connections (SSL/TLS)
- ✅ Encrypted data at rest (Supabase)
- ✅ Input sanitization and validation
- ✅ SQL injection prevention
- ✅ XSS protection

### API Security

- ✅ CSRF protection
- ✅ Rate limiting
- ✅ API key management
- ✅ Webhook signature verification
- ✅ CORS configuration

### Audit & Compliance

- ✅ Comprehensive audit logging
- ✅ User activity tracking
- ✅ Change history
- ✅ Security event monitoring
- ✅ Compliance reports

---

## Performance Optimization

### Database Optimization

- ✅ Database views for complex queries
- ✅ Proper indexing on frequently queried columns
- ✅ Connection pooling
- ✅ Query result caching
- ✅ Optimized RLS policies

### Frontend Optimization

- ✅ Code splitting and lazy loading
- ✅ Image optimization
- ✅ Asset compression (gzip/brotli)
- ✅ Browser caching
- ✅ Service worker for offline support

### API Optimization

- ✅ Response caching
- ✅ Batch operations support
- ✅ Pagination for large datasets
- ✅ Efficient data serialization
- ✅ Request deduplication

### Monitoring & Alerting

- ✅ Real-time performance metrics
- ✅ Error rate monitoring
- ✅ Slow query detection
- ✅ Memory usage tracking
- ✅ Automated alerts for issues

---

## Support & Maintenance

### Getting Help

- 📧 **Email:** support@airniugini.com.pg
- 📞 **Phone:** +675 xxxx xxxx
- 🌐 **Documentation:** https://docs.airniugini-pms.com

### Reporting Issues

1. Check health endpoints for system status
2. Review monitoring dashboard for metrics
3. Check audit logs for recent changes
4. Contact support with error details

### Regular Maintenance

- Daily: Automated backups
- Weekly: Performance review
- Monthly: Security audit
- Quarterly: Capacity planning

---

**Document Version:** 1.0.0
**System Version:** 1.0.0
**Last Updated:** October 1, 2025

**Air Niugini B767 Pilot Management System**
_Papua New Guinea's National Airline Fleet Operations Management_
