-- Migration: Create pilot_checks_overview view for optimized queries
-- Description: Pre-joins pilots, pilot_checks, and check_types with calculated status
-- Performance Impact: Reduces query complexity and execution time for common operations
-- Created: 2025-10-10

-- Drop existing view if it exists
DROP VIEW IF EXISTS pilot_checks_overview CASCADE;

-- Create optimized view for pilot checks with pre-calculated status
CREATE OR REPLACE VIEW pilot_checks_overview AS
SELECT
    pc.id,
    pc.pilot_id,
    pc.check_type_id,
    pc.expiry_date,
    pc.created_at,
    pc.updated_at,
    -- Pilot information
    p.employee_id,
    p.first_name,
    p.last_name,
    p.role,
    p.seniority_number,
    p.is_active,
    -- Check type information
    ct.check_code,
    ct.check_description,
    ct.category,
    ct.required_for_ops,
    -- Pre-calculated certification status (red/yellow/green FAA standard)
    CASE
        WHEN pc.expiry_date IS NULL THEN 'NO_DATE'
        WHEN pc.expiry_date < CURRENT_DATE THEN 'EXPIRED'
        WHEN pc.expiry_date <= CURRENT_DATE + INTERVAL '30 days' THEN 'EXPIRING_SOON'
        ELSE 'CURRENT'
    END as certification_status,
    -- Days until expiry (negative if expired, null if no date)
    CASE
        WHEN pc.expiry_date IS NULL THEN NULL
        ELSE EXTRACT(DAY FROM (pc.expiry_date - CURRENT_DATE))::INTEGER
    END as days_until_expiry
FROM pilot_checks pc
JOIN pilots p ON pc.pilot_id = p.id
JOIN check_types ct ON pc.check_type_id = ct.id
WHERE p.is_active = true;

-- Add comment explaining view purpose and usage
COMMENT ON VIEW pilot_checks_overview IS
'Optimized view combining pilot checks with pilot and check type details.
Pre-calculates certification status (EXPIRED/EXPIRING_SOON/CURRENT/NO_DATE) and days until expiry.
Only includes checks for active pilots to reduce result set size.
Use this view instead of manual joins for better query performance.';

-- Create supporting indexes on underlying tables to optimize view queries
CREATE INDEX IF NOT EXISTS idx_pilot_checks_expiry_date
ON pilot_checks(expiry_date)
WHERE expiry_date IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_pilots_is_active
ON pilots(is_active)
WHERE is_active = true;

-- Grant appropriate permissions
GRANT SELECT ON pilot_checks_overview TO authenticated;
GRANT SELECT ON pilot_checks_overview TO service_role;

-- Verify view was created successfully
SELECT COUNT(*) as total_checks FROM pilot_checks_overview;
