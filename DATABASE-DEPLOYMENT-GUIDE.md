# Air Niugini B767 Pilot Management System
# Database Deployment Guide

## Overview

This guide provides step-by-step instructions for deploying the complete Supabase database schema and sample data for the Air Niugini B767 Pilot Management System.

## Prerequisites

- Supabase project ID: `wgdmgvonqysflwdiiols`
- Access to Supabase SQL Editor or psql connection
- Database user with CREATE privileges

## Database Schema Summary

### Tables Created
- **an_users** - System users (admin/manager roles)
- **an_pilots** - 27 Papua New Guinea B767 pilots
- **an_check_types** - 38 aviation certification types across 8 categories
- **an_pilot_checks** - 531 pilot certifications with realistic expiry dates
- **an_leave_requests** - Leave management (RDO/WDO/Annual/Sick)

### Key Features
- Row Level Security (RLS) enabled on all tables
- Comprehensive indexing for performance
- Database views for common queries
- Triggers for automatic timestamp updates
- Realistic sample data with Papua New Guinea pilot names

## Deployment Steps

### Step 1: Run Main Migration Script

Execute the complete migration script in Supabase SQL Editor:

```sql
-- File: supabase-complete-migration.sql
-- This creates all tables, indexes, triggers, RLS policies, and helper functions
```

**What this does:**
- Creates all 5 main tables with proper relationships
- Sets up 15+ performance indexes
- Enables Row Level Security with comprehensive policies
- Creates helper functions for role checking
- Sets up automatic timestamp triggers

### Step 2: Insert Sample Data

Execute the sample data script:

```sql
-- File: supabase-sample-data.sql
-- This inserts users, pilots, and check types
```

**What this does:**
- Inserts 3 system users (admin, 2 managers)
- Creates 38 aviation check types across 8 categories
- Adds 27 Papua New Guinea B767 pilots with authentic names

### Step 3: Generate Pilot Certifications

Execute the certifications script:

```sql
-- File: supabase-pilot-certifications.sql
-- This creates 531 realistic pilot certifications
```

**What this does:**
- Generates 531 pilot certifications with realistic distribution
- Creates varying expiry dates based on certification type
- Includes expired (5%) and expiring soon (10%) certifications for testing

### Step 4: Create Database Views

Execute the views script:

```sql
-- File: supabase-views.sql
-- This creates 7 database views for reporting and queries
```

**What this does:**
- **an_pilot_checks_overview** - Comprehensive pilot certification view
- **an_expiring_checks** - Focus on certifications expiring within 60 days
- **an_fleet_compliance_summary** - High-level dashboard statistics
- **an_pilot_roster_status** - Current roster period availability
- **an_certification_categories_summary** - Summary by certification category
- **an_pilot_age_analysis** - Age and retirement calculations
- **an_monthly_expiry_calendar** - Monthly expiry planning view

## Alternative: Single Script Deployment

For convenience, you can run all scripts in sequence or use the individual files for better control:

1. `supabase-complete-migration.sql` - Core schema
2. `supabase-sample-data.sql` - Base data
3. `supabase-pilot-certifications.sql` - Certifications
4. `supabase-views.sql` - Database views

## Data Verification

After deployment, verify the setup with these queries:

```sql
-- Check table counts
SELECT
    'an_users' as table_name, COUNT(*) as record_count FROM an_users
UNION ALL
SELECT 'an_pilots', COUNT(*) FROM an_pilots
UNION ALL
SELECT 'an_check_types', COUNT(*) FROM an_check_types
UNION ALL
SELECT 'an_pilot_checks', COUNT(*) FROM an_pilot_checks;

-- Check compliance summary
SELECT * FROM an_fleet_compliance_summary;

-- Check expiring certifications
SELECT * FROM an_expiring_checks LIMIT 10;
```

**Expected Results:**
- 3 users (1 admin, 2 managers)
- 27 active pilots (15 Captains, 12 First Officers)
- 38 check types across 8 categories
- ~531 pilot certifications
- Various expiry statuses for testing

## Row Level Security (RLS) Policies

### User Access Control
- **Admins** - Full CRUD access to all data
- **Managers** - Read/update pilots and certifications, no user management
- **Authenticated Users** - Read access to relevant data

### Security Features
- Email-based authentication integration
- Role-based access control
- Audit trail with timestamps
- Protected sensitive data fields

## Database Views Usage

### For Dashboard Metrics
```sql
SELECT * FROM an_fleet_compliance_summary;
```

### For Certification Alerts
```sql
SELECT * FROM an_expiring_checks
WHERE urgency_level IN ('EXPIRED', 'CRITICAL')
ORDER BY days_remaining;
```

### For Monthly Planning
```sql
SELECT * FROM an_monthly_expiry_calendar
WHERE expiry_year = EXTRACT(YEAR FROM CURRENT_DATE)
ORDER BY expiry_month;
```

## Performance Optimization

### Indexes Created
- Primary key indexes (automatic)
- Foreign key indexes for joins
- Expiry date indexes for status queries
- Composite indexes for common query patterns
- Partial indexes for filtered queries

### Query Optimization Tips
- Use views for complex queries
- Filter by `is_active = true` for active pilots only
- Index on `expiry_date` supports fast status calculations
- Use `employee_id` for pilot lookups (indexed)

## Maintenance Queries

### Update Certification Expiry
```sql
UPDATE an_pilot_checks
SET expiry_date = '2025-12-31', updated_at = CURRENT_TIMESTAMP
WHERE pilot_id = (SELECT id FROM an_pilots WHERE employee_id = 'PX001')
  AND check_type_id = (SELECT id FROM an_check_types WHERE check_code = 'PC');
```

### Add New Pilot
```sql
INSERT INTO an_pilots (employee_id, first_name, last_name, role, nationality, is_active)
VALUES ('PX016', 'New', 'Pilot', 'First Officer', 'Papua New Guinea', true);
```

### Bulk Certification Update
```sql
-- Extend all medical certificates by 1 year
UPDATE an_pilot_checks
SET expiry_date = expiry_date + INTERVAL '1 year',
    updated_at = CURRENT_TIMESTAMP
WHERE check_type_id IN (
    SELECT id FROM an_check_types
    WHERE category = 'Medical & Health'
);
```

## Troubleshooting

### Common Issues

1. **Permission Denied Errors**
   - Ensure RLS policies are correctly applied
   - Check user authentication status
   - Verify role assignments in an_users table

2. **Missing Data in Views**
   - Check if pilots are marked as `is_active = true`
   - Verify foreign key relationships
   - Ensure certification dates are not NULL where expected

3. **Slow Query Performance**
   - Use EXPLAIN ANALYZE for query planning
   - Ensure indexes are being used
   - Consider materialized views for heavy reporting

### Useful Diagnostic Queries

```sql
-- Check RLS policy status
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE tablename LIKE 'an_%';

-- Check index usage
SELECT schemaname, tablename, indexname, idx_tup_read, idx_tup_fetch
FROM pg_stat_user_indexes
WHERE schemaname = 'public' AND tablename LIKE 'an_%';

-- Check view definitions
SELECT table_name, view_definition
FROM information_schema.views
WHERE table_schema = 'public' AND table_name LIKE 'an_%';
```

## Next Steps

After successful deployment:

1. Test authentication with sample users
2. Verify RLS policies with different user roles
3. Test CRUD operations through your application
4. Set up monitoring for expiring certifications
5. Configure backup schedules
6. Plan for data maintenance procedures

## Support

For database-related issues:
- Check Supabase logs for detailed error messages
- Use the diagnostic queries above
- Verify table relationships and constraints
- Test with minimal data first before bulk operations

The database is now ready for integration with your Next.js Air Niugini B767 Pilot Management System!