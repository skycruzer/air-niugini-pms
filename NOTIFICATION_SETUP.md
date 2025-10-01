# Air Niugini B767 Pilot Management System
# Email & SMS Notification System - Setup Guide

## Overview

This guide will help you set up and configure the complete notification system for the Air Niugini B767 Pilot Management System.

## Features Implemented

✅ **Email Service (Resend Integration)**
- Certification expiry alerts (30, 14, 7, 3, 1 days before)
- Leave request notifications
- Leave approval/rejection notifications
- System notifications
- Welcome emails
- Password reset emails
- Air Niugini branded HTML templates

✅ **Notification Queue System**
- Queued notifications with priority
- Automatic retry with exponential backoff
- Delivery tracking and logging
- Batch notification processing

✅ **Scheduled Jobs**
- Daily certification expiry checks
- Notification queue processing
- Automatic cleanup of old notifications
- Daily digest emails

✅ **In-App Notification Center**
- Bell icon with unread count
- Real-time notification dropdown
- Mark as read/delete functionality
- Toast notifications for new alerts

✅ **User Preferences**
- Email on/off toggle
- Notification type preferences
- Daily digest scheduling
- Alert threshold customization

---

## 1. Database Setup

### Step 1: Deploy Migration

Run the notification migration script:

```bash
cd /Users/skycruzer/Desktop/Fleet\ Office\ Management/air-niugini-pms
node deploy-notifications.js
```

**Alternative (Manual):**

If the script fails, manually execute the migration:

1. Go to Supabase Dashboard → SQL Editor
2. Create new query
3. Copy contents of `009_notifications.sql`
4. Execute

### Step 2: Verify Tables

Check that these tables were created:

- `notification_preferences`
- `notification_queue`
- `notification_log`
- `in_app_notifications`
- `notification_templates`

---

## 2. Environment Configuration

### Required Environment Variables

Add to your `.env.local` file:

```env
# Resend Email Service
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Email Configuration (Optional - defaults provided)
EMAIL_FROM=Air Niugini Fleet Operations <notifications@airniugini.com>
EMAIL_REPLY_TO=fleetops@airniugini.com.pg

# Application URL (for email links)
NEXT_PUBLIC_APP_URL=http://localhost:3001
```

### Get Resend API Key

1. Go to [resend.com](https://resend.com)
2. Sign up or log in
3. Create new API key
4. Copy key to `.env.local`

**Free Tier Limits:**
- 100 emails per day
- 3,000 emails per month
- Good for testing and small deployments

---

## 3. Email Domain Setup (Production)

### For Production Email Sending

1. **Add Domain in Resend:**
   - Go to Resend Dashboard → Domains
   - Add `airniugini.com` (or your domain)
   - Add DNS records provided by Resend

2. **Update Environment Variables:**
   ```env
   EMAIL_FROM=Fleet Operations <notifications@airniugini.com>
   EMAIL_REPLY_TO=fleetops@airniugini.com.pg
   ```

3. **Verify Domain:**
   - Wait for DNS propagation (5-15 minutes)
   - Verify domain in Resend dashboard

---

## 4. Testing the System

### Test Email Notification

```bash
curl -X POST http://localhost:3001/api/notifications/test \
  -H "Content-Type: application/json" \
  -d '{
    "email": "your.email@example.com",
    "name": "Test User",
    "type": "system"
  }'
```

### Test Types Available:
- `certification_expiry` - Certification expiry alert
- `leave_request` - Leave request notification
- `system` - System notification (default)

### Expected Response:

```json
{
  "success": true,
  "messageId": "msg_xxxxxxxxx",
  "message": "Test notification sent successfully"
}
```

---

## 5. Scheduled Jobs Setup

### Option A: Vercel Cron Jobs (Recommended for Production)

Create `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cron/daily-certification-check",
      "schedule": "0 8 * * *"
    },
    {
      "path": "/api/cron/process-queue",
      "schedule": "*/5 * * * *"
    },
    {
      "path": "/api/cron/cleanup-notifications",
      "schedule": "0 2 * * *"
    },
    {
      "path": "/api/cron/daily-digest",
      "schedule": "0 7 * * *"
    }
  ]
}
```

### Option B: Manual Cron Jobs (Self-hosted)

Add to server crontab:

```bash
# Daily certification check at 8:00 AM
0 8 * * * curl -X POST http://your-domain.com/api/cron/daily-certification-check

# Process queue every 5 minutes
*/5 * * * * curl -X POST http://your-domain.com/api/cron/process-queue

# Cleanup at 2:00 AM
0 2 * * * curl -X POST http://your-domain.com/api/cron/cleanup-notifications

# Daily digest at 7:00 AM
0 7 * * * curl -X POST http://your-domain.com/api/cron/daily-digest
```

### Option C: Next.js API Routes (Development)

Create API routes for each job:

```typescript
// src/app/api/cron/daily-certification-check/route.ts
import { runDailyCertificationCheck } from '@/lib/scheduled-jobs';

export async function POST() {
  const result = await runDailyCertificationCheck();
  return Response.json(result);
}
```

---

## 6. User Interface Integration

### Add Notification Center to Dashboard

Edit `src/app/dashboard/layout.tsx`:

```typescript
import NotificationCenter from '@/components/notifications/NotificationCenter';

export default function DashboardLayout({ children }) {
  return (
    <div>
      <header>
        {/* ... existing header content ... */}
        <NotificationCenter />
      </header>
      {children}
    </div>
  );
}
```

### Add Notification Preferences to Settings

Edit `src/app/dashboard/settings/page.tsx`:

```typescript
import NotificationPreferences from '@/components/settings/NotificationPreferences';

export default function SettingsPage() {
  return (
    <div>
      <h1>Settings</h1>
      <NotificationPreferences />
    </div>
  );
}
```

---

## 7. Notification Usage Examples

### Send Certification Expiry Alert

```typescript
import { queueNotification } from '@/lib/notification-queue';

await queueNotification({
  user_id: managerId,
  email_address: 'manager@airniugini.com',
  notification_type: 'certification_expiry',
  subject: 'URGENT: Certification Expiry Alert',
  template_name: 'certification_expiry_alert',
  template_data: {
    pilot_name: 'John Doe',
    check_code: 'PC',
    check_description: 'Proficiency Check',
    expiry_date: '2025-10-15',
    days_remaining: 7,
    category: 'Flight Operations'
  },
  priority: 1 // High priority
});
```

### Send Leave Request Notification

```typescript
await queueNotification({
  user_id: managerId,
  email_address: 'manager@airniugini.com',
  notification_type: 'leave_request',
  subject: 'New Leave Request - John Doe',
  template_name: 'leave_request_notification',
  template_data: {
    pilot_name: 'John Doe',
    leave_type: 'RDO',
    start_date: '2025-10-20',
    end_date: '2025-10-22',
    roster_period: 'RP11/2025',
    comments: 'Family commitment'
  },
  priority: 3
});
```

### Create In-App Notification

```typescript
import { supabase } from '@/lib/supabase';

await supabase.from('in_app_notifications').insert({
  user_id: userId,
  title: 'Certification Expiring Soon',
  message: 'PC check expires in 7 days for John Doe',
  notification_type: 'certification_expiry',
  action_url: '/dashboard/certifications',
  icon: 'alert',
  expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
});
```

---

## 8. Monitoring & Troubleshooting

### Check Notification Queue Status

```sql
-- Pending notifications
SELECT COUNT(*) FROM notification_queue WHERE status = 'pending';

-- Failed notifications
SELECT * FROM notification_queue WHERE status = 'failed' ORDER BY updated_at DESC;

-- Recent delivery log
SELECT * FROM notification_log ORDER BY sent_at DESC LIMIT 10;
```

### Common Issues

**1. Emails not sending:**
- Check `RESEND_API_KEY` is set correctly
- Verify Resend API key is active
- Check daily sending limits (100/day on free tier)
- Review `notification_log` for error messages

**2. Queue not processing:**
- Ensure cron jobs are running
- Check `notification_queue` table for pending items
- Manually trigger: `POST /api/cron/process-queue`

**3. In-app notifications not appearing:**
- Check Supabase real-time is enabled
- Verify user permissions in RLS policies
- Check browser console for errors

---

## 9. Production Checklist

Before deploying to production:

- [ ] Resend API key configured
- [ ] Domain verified in Resend
- [ ] Email templates tested
- [ ] Notification preferences UI tested
- [ ] In-app notification center working
- [ ] Scheduled jobs configured (Vercel Cron or server cron)
- [ ] Database migration deployed
- [ ] RLS policies verified
- [ ] Rate limiting configured
- [ ] Error monitoring in place
- [ ] Unsubscribe links functional (GDPR compliance)

---

## 10. API Endpoints Reference

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/notifications/send` | POST | Queue a notification |
| `/api/notifications/preferences` | GET | Get user preferences |
| `/api/notifications/preferences` | PUT | Update preferences |
| `/api/notifications/test` | POST | Send test notification |
| `/api/cron/daily-certification-check` | POST | Run daily cert check |
| `/api/cron/process-queue` | POST | Process notification queue |
| `/api/cron/cleanup-notifications` | POST | Cleanup old notifications |
| `/api/cron/daily-digest` | POST | Send daily digests |

---

## 11. Notification Thresholds

**Certification Expiry Alerts:**
- 30 days before expiry
- 14 days before expiry
- 7 days before expiry (URGENT)
- 3 days before expiry (URGENT)
- 1 day before expiry (URGENT)

**Notification Priority Levels:**
- Priority 1: Critical/Urgent (immediate sending)
- Priority 2-3: High (within 5 minutes)
- Priority 4-6: Medium (within 15 minutes)
- Priority 7-10: Low (within 1 hour)

---

## 12. Cost Estimation

**Resend Pricing (as of 2025):**
- **Free Tier:** 100 emails/day, 3,000/month
- **Paid Tier:** $20/month for 50,000 emails
- **Enterprise:** Custom pricing

**Estimated Usage:**
- 27 pilots × 36 check types = ~972 certifications
- Alert at 5 thresholds = ~4,860 potential alerts/year
- Daily operations: ~13 alerts/day
- Well within free tier for testing/small deployments

---

## Support & Maintenance

**Maintenance Tasks:**
- Review notification logs weekly
- Clear old notifications monthly (automated)
- Update email templates as needed
- Monitor delivery rates in Resend dashboard
- Adjust notification thresholds based on feedback

**For Issues:**
1. Check Supabase logs
2. Review `notification_log` table
3. Test with `/api/notifications/test`
4. Verify environment variables
5. Check Resend dashboard for delivery status

---

## Air Niugini B767 Pilot Management System
**Papua New Guinea's National Airline Fleet Operations**

*Notification System - Version 1.0*
*Last Updated: October 1, 2025*
