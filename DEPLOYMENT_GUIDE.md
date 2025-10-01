# Production Deployment Guide
## Air Niugini B767 Pilot Management System

**Version:** 1.0.0
**Target Environment:** Production
**Last Updated:** October 1, 2025

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Environment Setup](#environment-setup)
3. [Database Deployment](#database-deployment)
4. [Application Deployment](#application-deployment)
5. [Monitoring Setup](#monitoring-setup)
6. [Backup Configuration](#backup-configuration)
7. [Security Hardening](#security-hardening)
8. [Performance Optimization](#performance-optimization)
9. [Post-Deployment Checks](#post-deployment-checks)
10. [Rollback Procedure](#rollback-procedure)

---

## Prerequisites

### Required Accounts & Services
- ✅ Vercel account (or alternative hosting)
- ✅ Supabase project (already configured: wgdmgvonqysflwdiiols)
- ✅ Domain name with DNS access
- ✅ Email service (Resend or SendGrid)
- ✅ SSL certificate (provided by Vercel)

### Required Tools
```bash
# Install required CLI tools
npm install -g vercel
npm install -g supabase

# Verify installations
vercel --version
supabase --version
node --version  # Should be 18.x or higher
npm --version
```

### System Requirements
- **Node.js:** 18.x or higher
- **Memory:** Minimum 512MB, recommended 1GB
- **Storage:** Minimum 1GB for application
- **Database:** PostgreSQL 15+ (Supabase managed)

---

## Environment Setup

### 1. Environment Variables

Create `.env.production` file with the following variables:

```bash
# Application
NODE_ENV=production
NEXT_PUBLIC_APP_NAME=Air Niugini Pilot Management System
NEXT_PUBLIC_APP_URL=https://your-domain.com

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://wgdmgvonqysflwdiiols.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
SUPABASE_PROJECT_ID=wgdmgvonqysflwdiiols

# Roster Configuration
NEXT_PUBLIC_CURRENT_ROSTER=RP11/2025
NEXT_PUBLIC_ROSTER_END_DATE=2025-10-10

# Email Service (Resend)
RESEND_API_KEY=your_resend_api_key_here
NEXT_PUBLIC_EMAIL_FROM=noreply@your-domain.com

# Security
JWT_SECRET=generate_secure_random_string_here
ENCRYPTION_KEY=generate_secure_encryption_key_here

# Rate Limiting
RATE_LIMIT_ENABLED=true
RATE_LIMIT_MAX_REQUESTS=100
RATE_LIMIT_WINDOW_MS=60000

# Monitoring
ENABLE_MONITORING=true
ENABLE_ERROR_TRACKING=true

# Feature Flags
ENABLE_WEBHOOKS=true
ENABLE_BACKUPS=true
ENABLE_API_DOCS=true
```

### 2. Vercel Configuration

Create `vercel.json`:

```json
{
  "version": 2,
  "build": {
    "env": {
      "NODE_ENV": "production"
    }
  },
  "env": {
    "NEXT_PUBLIC_APP_URL": "@production-url",
    "NEXT_PUBLIC_SUPABASE_URL": "@supabase-url",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY": "@supabase-anon-key",
    "SUPABASE_SERVICE_ROLE_KEY": "@supabase-service-role-key"
  },
  "functions": {
    "api/**/*.ts": {
      "maxDuration": 30,
      "memory": 1024
    }
  },
  "regions": ["syd1"],
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-XSS-Protection",
          "value": "1; mode=block"
        },
        {
          "key": "Referrer-Policy",
          "value": "strict-origin-when-cross-origin"
        },
        {
          "key": "Permissions-Policy",
          "value": "camera=(), microphone=(), geolocation=()"
        }
      ]
    }
  ]
}
```

---

## Database Deployment

### 1. Pre-Deployment Backup

```bash
# Create backup before deployment
node create-backup.js

# Verify backup integrity
node verify-backup.js <backup-id>
```

### 2. Run Migrations

```bash
# Test migrations on development branch first
supabase db push --branch develop

# After testing, apply to production
supabase db push
```

### 3. Verify Database State

```bash
# Check database connection
node test-connection.js

# Verify data integrity
node verify-data.js

# Check indexes and performance
node analyze-database.js
```

### 4. Database Optimization

```sql
-- Run these queries in Supabase SQL editor

-- Analyze tables for query planner
ANALYZE pilots;
ANALYZE pilot_checks;
ANALYZE check_types;
ANALYZE leave_requests;

-- Vacuum to reclaim storage
VACUUM ANALYZE pilots;
VACUUM ANALYZE pilot_checks;

-- Check index usage
SELECT schemaname, tablename, indexname, idx_scan
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY idx_scan DESC;

-- Verify RLS policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE schemaname = 'public';
```

---

## Application Deployment

### Method 1: Vercel CLI (Recommended)

```bash
# 1. Login to Vercel
vercel login

# 2. Link project (first time only)
vercel link

# 3. Set environment variables
vercel env add NEXT_PUBLIC_SUPABASE_URL production
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production
vercel env add SUPABASE_SERVICE_ROLE_KEY production
# ... add all environment variables

# 4. Build and deploy
vercel --prod

# 5. Verify deployment
vercel inspect https://your-deployment-url.vercel.app
```

### Method 2: GitHub Integration

1. **Connect Repository to Vercel:**
   - Go to Vercel dashboard
   - Click "Import Project"
   - Connect GitHub repository
   - Configure project settings

2. **Set Environment Variables:**
   - Go to Project Settings → Environment Variables
   - Add all production environment variables
   - Ensure they're set for "Production" environment

3. **Configure Build Settings:**
   - Framework Preset: Next.js
   - Build Command: `npm run build`
   - Output Directory: `.next`
   - Install Command: `npm install`
   - Node Version: 18.x

4. **Deploy:**
   - Push to main branch
   - Vercel automatically builds and deploys
   - Monitor deployment in Vercel dashboard

### Method 3: Docker Deployment

```bash
# 1. Build Docker image
docker build -t an-pms:1.0.0 .

# 2. Tag for registry
docker tag an-pms:1.0.0 registry.example.com/an-pms:1.0.0

# 3. Push to registry
docker push registry.example.com/an-pms:1.0.0

# 4. Deploy to production
kubectl apply -f k8s/production/
```

---

## Monitoring Setup

### 1. Health Checks Configuration

```yaml
# Kubernetes health checks
apiVersion: v1
kind: Pod
spec:
  containers:
  - name: an-pms
    livenessProbe:
      httpGet:
        path: /api/health?check=liveness
        port: 3000
      initialDelaySeconds: 30
      periodSeconds: 10
    readinessProbe:
      httpGet:
        path: /api/health?check=readiness
        port: 3000
      initialDelaySeconds: 10
      periodSeconds: 5
```

### 2. Monitoring Dashboard Access

After deployment, access monitoring at:
- System Monitoring: `https://your-domain.com/dashboard/admin/system`
- Required: Admin role

### 3. Alert Configuration

```javascript
// Configure alerts in monitoring service
const alerts = [
  {
    name: 'High Error Rate',
    condition: 'error_rate > 5',
    severity: 'critical',
    notify: ['ops@airniugini.com.pg']
  },
  {
    name: 'Database Slow Queries',
    condition: 'avg_query_time > 1000',
    severity: 'warning',
    notify: ['dev@airniugini.com.pg']
  },
  {
    name: 'Low Memory',
    condition: 'memory_usage > 90',
    severity: 'warning',
    notify: ['ops@airniugini.com.pg']
  }
];
```

---

## Backup Configuration

### 1. Automated Backup Schedule

```javascript
// Configure in production environment
import { backupService } from '@/lib/backup-service';

// Schedule daily backups at 2 AM
const backupSchedule = backupService.scheduleAutoBackup({
  interval: 24, // hours
  retentionDays: 30,
  createdBy: 'system'
});

// Store backup schedule ID for monitoring
console.log('Backup schedule active:', backupSchedule);
```

### 2. Backup Storage

```bash
# Configure Supabase Storage bucket for backups
supabase storage create backups --public false

# Set lifecycle policy to delete old backups
supabase storage update backups --lifecycle-policy '{
  "rules": [
    {
      "action": "delete",
      "condition": {
        "age": 90
      }
    }
  ]
}'
```

### 3. Backup Verification

```bash
# Daily verification script (add to cron)
0 3 * * * /usr/local/bin/verify-backup.sh

# verify-backup.sh
#!/bin/bash
LATEST_BACKUP=$(curl -s https://your-domain.com/api/backups/latest)
BACKUP_ID=$(echo $LATEST_BACKUP | jq -r '.id')

# Verify backup
VERIFICATION=$(curl -s https://your-domain.com/api/backups/$BACKUP_ID/verify)
IS_VALID=$(echo $VERIFICATION | jq -r '.valid')

if [ "$IS_VALID" != "true" ]; then
  echo "ALERT: Backup verification failed!"
  # Send alert
fi
```

---

## Security Hardening

### 1. SSL/TLS Configuration

```javascript
// next.config.js - Force HTTPS
module.exports = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains; preload'
          }
        ]
      }
    ];
  },
  async redirects() {
    return [
      {
        source: '/:path*',
        has: [
          {
            type: 'header',
            key: 'x-forwarded-proto',
            value: 'http'
          }
        ],
        destination: 'https://:host/:path*',
        permanent: true
      }
    ];
  }
};
```

### 2. Database Security

```sql
-- Verify RLS is enabled on all tables
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public';

-- Enable RLS if disabled
ALTER TABLE pilots ENABLE ROW LEVEL SECURITY;
ALTER TABLE pilot_checks ENABLE ROW LEVEL SECURITY;
ALTER TABLE check_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE leave_requests ENABLE ROW LEVEL SECURITY;

-- Verify service role is restricted
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon;
GRANT SELECT ON check_types TO anon;
```

### 3. API Security

```bash
# Enable rate limiting
export RATE_LIMIT_ENABLED=true
export RATE_LIMIT_MAX_REQUESTS=100
export RATE_LIMIT_WINDOW_MS=60000

# Enable CSRF protection
export CSRF_PROTECTION_ENABLED=true

# Configure CORS
export CORS_ALLOWED_ORIGINS=https://your-domain.com
```

### 4. User Session Security

```javascript
// Configure Supabase Auth security
const authConfig = {
  session: {
    expiryMargin: 10, // seconds
    autoRefreshToken: true
  },
  autoRefreshToken: true,
  persistSession: true,
  detectSessionInUrl: true,
  flowType: 'pkce' // Use PKCE flow for enhanced security
};
```

---

## Performance Optimization

### 1. Next.js Optimization

```javascript
// next.config.js
module.exports = {
  // Enable React strict mode
  reactStrictMode: false, // Disabled for production performance

  // Enable SWC minification
  swcMinify: true,

  // Optimize packages
  experimental: {
    optimizePackageImports: ['lucide-react', '@tanstack/react-query']
  },

  // Image optimization
  images: {
    domains: ['wgdmgvonqysflwdiiols.supabase.co'],
    formats: ['image/avif', 'image/webp']
  },

  // Output configuration
  output: 'standalone',

  // Compression
  compress: true,

  // Generate build ID
  generateBuildId: async () => {
    return process.env.BUILD_ID || Date.now().toString();
  }
};
```

### 2. Database Connection Pooling

```javascript
// Use Supabase connection pooler
const supabaseUrl = 'https://wgdmgvonqysflwdiiols.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Enable connection pooling
const supabase = createClient(supabaseUrl, supabaseKey, {
  db: {
    schema: 'public'
  },
  auth: {
    autoRefreshToken: true,
    persistSession: false
  },
  global: {
    fetch: fetch
  }
});
```

### 3. Caching Strategy

```javascript
// Configure cache service
import { cacheService } from '@/lib/cache-service';

// Enable caching for frequently accessed data
cacheService.set('dashboard-stats', stats, 300); // 5 minutes
cacheService.set('check-types', checkTypes, 3600); // 1 hour
cacheService.set('pilot-list', pilots, 60); // 1 minute
```

---

## Post-Deployment Checks

### 1. Automated Testing

```bash
# Run smoke tests
npm run test:smoke

# Run E2E tests against production
PLAYWRIGHT_BASE_URL=https://your-domain.com npm run test:e2e

# Run API tests
npm run test:api -- --env production
```

### 2. Manual Verification Checklist

- [ ] Application loads successfully
- [ ] Login works with test credentials
- [ ] Dashboard displays correct statistics
- [ ] Pilot list loads (27 pilots)
- [ ] Certifications display correctly (568 certifications)
- [ ] Leave requests functionality works
- [ ] Reports generate successfully
- [ ] PDF export functions
- [ ] Mobile responsiveness verified
- [ ] All navigation links work
- [ ] User permissions enforced correctly
- [ ] Logout works properly

### 3. Health Check Verification

```bash
# Basic health
curl https://your-domain.com/api/health?check=basic

# Readiness
curl https://your-domain.com/api/health?check=readiness

# Detailed health
curl https://your-domain.com/api/health?check=detailed
```

### 4. Performance Testing

```bash
# Load test with k6
k6 run load-test.js

# Expected results:
# - 95th percentile response time < 500ms
# - Error rate < 1%
# - Throughput > 100 req/s
```

### 5. Security Scan

```bash
# Run security audit
npm audit --production

# Check for vulnerabilities
npm audit fix

# SSL/TLS check
ssllabs-scan your-domain.com
```

---

## Rollback Procedure

### Quick Rollback (Vercel)

```bash
# 1. List recent deployments
vercel ls

# 2. Rollback to previous deployment
vercel rollback https://previous-deployment-url.vercel.app

# 3. Verify rollback
curl https://your-domain.com/api/health
```

### Database Rollback

```bash
# 1. List available backups
node list-backups.js

# 2. Verify backup integrity
node verify-backup.js <backup-id>

# 3. Restore database (requires confirmation)
node restore-backup.js <backup-id> --confirm

# 4. Verify data after restore
node verify-data.js
```

### Full Rollback Procedure

1. **Notify Stakeholders:**
   ```bash
   # Send notification
   echo "Initiating rollback due to: [REASON]" | \
     mail -s "ALERT: Production Rollback" ops@airniugini.com.pg
   ```

2. **Rollback Application:**
   ```bash
   vercel rollback [previous-url]
   ```

3. **Rollback Database (if needed):**
   ```bash
   node restore-backup.js [backup-id] --confirm
   ```

4. **Verify System:**
   ```bash
   # Check health
   curl https://your-domain.com/api/health?check=detailed

   # Run smoke tests
   npm run test:smoke
   ```

5. **Monitor Logs:**
   ```bash
   vercel logs https://your-domain.com --follow
   ```

6. **Document Incident:**
   - Create incident report
   - Document root cause
   - Update deployment checklist
   - Schedule post-mortem

---

## Troubleshooting

### Common Deployment Issues

#### 1. Build Failures

```bash
# Clear build cache
rm -rf .next node_modules
npm install
npm run build

# Check for TypeScript errors
npm run type-check

# Check for linting errors
npm run lint
```

#### 2. Database Connection Issues

```bash
# Verify environment variables
echo $NEXT_PUBLIC_SUPABASE_URL
echo $SUPABASE_SERVICE_ROLE_KEY

# Test connection
node test-connection.js

# Check Supabase status
curl https://status.supabase.com/api/v2/status.json
```

#### 3. Performance Issues

```bash
# Check memory usage
vercel logs --follow | grep "memory"

# Check response times
curl -w "@curl-format.txt" -o /dev/null -s https://your-domain.com/api/pilots

# Analyze bundle size
npm run build:analyze
```

#### 4. Authentication Issues

```bash
# Verify JWT secret is set
echo $JWT_SECRET

# Check Supabase Auth configuration
curl https://wgdmgvonqysflwdiiols.supabase.co/auth/v1/settings

# Test auth flow
npm run test:auth
```

---

## Maintenance Schedule

### Daily
- Monitor health check endpoints
- Review error logs
- Check automated backup completion

### Weekly
- Review performance metrics
- Analyze slow queries
- Update dependencies if needed

### Monthly
- Security audit
- Backup verification test
- Performance testing
- Capacity planning review

### Quarterly
- Disaster recovery drill
- Full system audit
- User access review
- Documentation update

---

## Support Contacts

### Technical Support
- **Email:** ops@airniugini.com.pg
- **Phone:** +675 xxxx xxxx
- **On-Call:** [On-call rotation schedule]

### Escalation Path
1. **Level 1:** DevOps Team
2. **Level 2:** Senior Engineer
3. **Level 3:** CTO / Tech Lead

### External Support
- **Vercel Support:** vercel.com/support
- **Supabase Support:** supabase.com/support
- **Email Service:** resend.com/support

---

## Additional Resources

- **System Documentation:** /docs/SYSTEM_ARCHITECTURE.md
- **API Documentation:** /docs/API_DOCUMENTATION.md
- **User Guide:** /docs/USER_GUIDE.md
- **Troubleshooting:** /docs/TROUBLESHOOTING.md

---

**Document Version:** 1.0.0
**System Version:** 1.0.0
**Last Updated:** October 1, 2025

**Air Niugini B767 Pilot Management System**
*Production Deployment Guide*
