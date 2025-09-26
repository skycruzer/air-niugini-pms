-- ==========================================
-- Air Niugini B767 Pilot Management System
-- Database Views for Common Queries and Reporting
-- ==========================================

-- ==========================================
-- VIEW 1: Pilot Checks Overview
-- Comprehensive view of all pilot certifications with status
-- ==========================================
CREATE VIEW an_pilot_checks_overview AS
SELECT
    p.id as pilot_id,
    p.employee_id,
    p.first_name,
    p.middle_name,
    p.last_name,
    p.role as pilot_role,
    p.is_active,
    ct.id as check_type_id,
    ct.check_code,
    ct.check_description,
    ct.category,
    pc.expiry_date,
    pc.created_at as check_created,
    pc.updated_at as check_updated,
    -- Calculate certification status
    CASE
        WHEN pc.expiry_date IS NULL THEN 'NO_DATE'
        WHEN pc.expiry_date < CURRENT_DATE THEN 'EXPIRED'
        WHEN pc.expiry_date <= CURRENT_DATE + INTERVAL '30 days' THEN 'EXPIRING_SOON'
        ELSE 'CURRENT'
    END as certification_status,
    -- Calculate days until expiry
    CASE
        WHEN pc.expiry_date IS NULL THEN NULL
        ELSE pc.expiry_date - CURRENT_DATE
    END as days_until_expiry
FROM an_pilots p
LEFT JOIN an_pilot_checks pc ON p.id = pc.pilot_id
LEFT JOIN an_check_types ct ON pc.check_type_id = ct.id
WHERE p.is_active = true;

-- ==========================================
-- VIEW 2: Expiring Certifications
-- Focus on certifications expiring within next 60 days
-- ==========================================
CREATE VIEW an_expiring_checks AS
SELECT
    p.employee_id,
    p.first_name || ' ' || p.last_name as pilot_name,
    p.role as pilot_role,
    ct.check_code,
    ct.check_description,
    ct.category,
    pc.expiry_date,
    pc.expiry_date - CURRENT_DATE as days_remaining,
    CASE
        WHEN pc.expiry_date < CURRENT_DATE THEN 'EXPIRED'
        WHEN pc.expiry_date <= CURRENT_DATE + INTERVAL '7 days' THEN 'CRITICAL'
        WHEN pc.expiry_date <= CURRENT_DATE + INTERVAL '30 days' THEN 'WARNING'
        ELSE 'ATTENTION'
    END as urgency_level
FROM an_pilots p
INNER JOIN an_pilot_checks pc ON p.id = pc.pilot_id
INNER JOIN an_check_types ct ON pc.check_type_id = ct.id
WHERE
    p.is_active = true
    AND pc.expiry_date IS NOT NULL
    AND pc.expiry_date <= CURRENT_DATE + INTERVAL '60 days'
ORDER BY pc.expiry_date ASC, p.last_name ASC;

-- ==========================================
-- VIEW 3: Fleet Compliance Summary
-- High-level statistics for dashboard
-- ==========================================
CREATE VIEW an_fleet_compliance_summary AS
SELECT
    COUNT(DISTINCT p.id) as total_active_pilots,
    COUNT(DISTINCT CASE WHEN p.role = 'Captain' THEN p.id END) as total_captains,
    COUNT(DISTINCT CASE WHEN p.role = 'First Officer' THEN p.id END) as total_first_officers,
    COUNT(pc.id) as total_certifications,
    COUNT(CASE WHEN pc.expiry_date < CURRENT_DATE THEN 1 END) as expired_certifications,
    COUNT(CASE WHEN pc.expiry_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '30 days' THEN 1 END) as expiring_soon,
    COUNT(CASE WHEN pc.expiry_date > CURRENT_DATE + INTERVAL '30 days' THEN 1 END) as current_certifications,
    COUNT(CASE WHEN pc.expiry_date IS NULL THEN 1 END) as missing_dates,
    ROUND(
        COUNT(CASE WHEN pc.expiry_date >= CURRENT_DATE THEN 1 END)::DECIMAL /
        NULLIF(COUNT(CASE WHEN pc.expiry_date IS NOT NULL THEN 1 END), 0) * 100, 2
    ) as compliance_percentage
FROM an_pilots p
LEFT JOIN an_pilot_checks pc ON p.id = pc.pilot_id
WHERE p.is_active = true;

-- ==========================================
-- VIEW 4: Pilot Roster Status
-- Current roster period leave requests and availability
-- ==========================================
CREATE VIEW an_pilot_roster_status AS
SELECT
    p.id as pilot_id,
    p.employee_id,
    p.first_name || ' ' || p.last_name as pilot_name,
    p.role as pilot_role,
    p.contract_type,
    p.is_active,
    -- Current roster period (RP11/2025)
    'RP11/2025' as current_roster_period,
    -- Count leave requests for current period
    COUNT(lr.id) as leave_requests_count,
    COUNT(CASE WHEN lr.status = 'PENDING' THEN 1 END) as pending_requests,
    COUNT(CASE WHEN lr.status = 'APPROVED' THEN 1 END) as approved_requests,
    COUNT(CASE WHEN lr.status = 'REJECTED' THEN 1 END) as rejected_requests,
    -- Sum of approved leave days
    COALESCE(SUM(CASE WHEN lr.status = 'APPROVED' THEN lr.days_count ELSE 0 END), 0) as approved_leave_days,
    -- Availability status
    CASE
        WHEN p.is_active = false THEN 'INACTIVE'
        WHEN COUNT(CASE WHEN lr.status = 'PENDING' THEN 1 END) > 0 THEN 'PENDING_LEAVE'
        WHEN COALESCE(SUM(CASE WHEN lr.status = 'APPROVED' THEN lr.days_count ELSE 0 END), 0) >= 14 THEN 'HIGH_LEAVE'
        WHEN COALESCE(SUM(CASE WHEN lr.status = 'APPROVED' THEN lr.days_count ELSE 0 END), 0) >= 7 THEN 'MODERATE_LEAVE'
        ELSE 'AVAILABLE'
    END as availability_status
FROM an_pilots p
LEFT JOIN an_leave_requests lr ON p.id = lr.pilot_id AND lr.roster_period = 'RP11/2025'
GROUP BY p.id, p.employee_id, p.first_name, p.last_name, p.role, p.contract_type, p.is_active;

-- ==========================================
-- VIEW 5: Certification Categories Summary
-- Summary by category for reporting
-- ==========================================
CREATE VIEW an_certification_categories_summary AS
SELECT
    ct.category,
    COUNT(DISTINCT ct.id) as total_check_types,
    COUNT(pc.id) as total_certifications,
    COUNT(CASE WHEN pc.expiry_date < CURRENT_DATE THEN 1 END) as expired_count,
    COUNT(CASE WHEN pc.expiry_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '30 days' THEN 1 END) as expiring_soon_count,
    COUNT(CASE WHEN pc.expiry_date > CURRENT_DATE + INTERVAL '30 days' THEN 1 END) as current_count,
    COUNT(CASE WHEN pc.expiry_date IS NULL THEN 1 END) as missing_dates_count,
    ROUND(
        COUNT(CASE WHEN pc.expiry_date >= CURRENT_DATE THEN 1 END)::DECIMAL /
        NULLIF(COUNT(CASE WHEN pc.expiry_date IS NOT NULL THEN 1 END), 0) * 100, 2
    ) as category_compliance_percentage
FROM an_check_types ct
LEFT JOIN an_pilot_checks pc ON ct.id = pc.check_type_id
LEFT JOIN an_pilots p ON pc.pilot_id = p.id AND p.is_active = true
GROUP BY ct.category
ORDER BY ct.category;

-- ==========================================
-- VIEW 6: Pilot Age and Retirement Analysis
-- Age calculations and retirement planning
-- ==========================================
CREATE VIEW an_pilot_age_analysis AS
SELECT
    p.id as pilot_id,
    p.employee_id,
    p.first_name || ' ' || p.last_name as pilot_name,
    p.role as pilot_role,
    p.date_of_birth,
    p.commencement_date,
    -- Age calculations
    CASE
        WHEN p.date_of_birth IS NOT NULL THEN
            DATE_PART('year', AGE(CURRENT_DATE, p.date_of_birth))
        ELSE NULL
    END as current_age,
    -- Years of service
    CASE
        WHEN p.commencement_date IS NOT NULL THEN
            DATE_PART('year', AGE(CURRENT_DATE, p.commencement_date))
        ELSE NULL
    END as years_of_service,
    -- Retirement analysis (assuming retirement at 65)
    CASE
        WHEN p.date_of_birth IS NOT NULL THEN
            p.date_of_birth + INTERVAL '65 years'
        ELSE NULL
    END as retirement_date,
    CASE
        WHEN p.date_of_birth IS NOT NULL THEN
            DATE_PART('year', AGE(p.date_of_birth + INTERVAL '65 years', CURRENT_DATE))
        ELSE NULL
    END as years_until_retirement,
    -- Retirement status
    CASE
        WHEN p.date_of_birth IS NULL THEN 'UNKNOWN'
        WHEN DATE_PART('year', AGE(CURRENT_DATE, p.date_of_birth)) >= 65 THEN 'RETIRED'
        WHEN DATE_PART('year', AGE(p.date_of_birth + INTERVAL '65 years', CURRENT_DATE)) <= 2 THEN 'RETIRING_SOON'
        WHEN DATE_PART('year', AGE(p.date_of_birth + INTERVAL '65 years', CURRENT_DATE)) <= 5 THEN 'RETIREMENT_PLANNING'
        ELSE 'ACTIVE'
    END as retirement_status
FROM an_pilots p
WHERE p.is_active = true;

-- ==========================================
-- VIEW 7: Monthly Certification Expiry Calendar
-- Grouped by month for planning purposes
-- ==========================================
CREATE VIEW an_monthly_expiry_calendar AS
SELECT
    EXTRACT(YEAR FROM pc.expiry_date) as expiry_year,
    EXTRACT(MONTH FROM pc.expiry_date) as expiry_month,
    TO_CHAR(pc.expiry_date, 'YYYY-MM') as year_month,
    TO_CHAR(pc.expiry_date, 'Month YYYY') as month_name,
    COUNT(*) as certifications_expiring,
    COUNT(DISTINCT pc.pilot_id) as pilots_affected,
    STRING_AGG(DISTINCT ct.category, ', ') as categories_affected,
    -- Most common check types expiring
    MODE() WITHIN GROUP (ORDER BY ct.check_code) as most_common_check_type
FROM an_pilot_checks pc
JOIN an_check_types ct ON pc.check_type_id = ct.id
JOIN an_pilots p ON pc.pilot_id = p.id
WHERE
    p.is_active = true
    AND pc.expiry_date IS NOT NULL
    AND pc.expiry_date >= CURRENT_DATE
    AND pc.expiry_date <= CURRENT_DATE + INTERVAL '2 years'
GROUP BY
    EXTRACT(YEAR FROM pc.expiry_date),
    EXTRACT(MONTH FROM pc.expiry_date),
    TO_CHAR(pc.expiry_date, 'YYYY-MM'),
    TO_CHAR(pc.expiry_date, 'Month YYYY')
ORDER BY expiry_year, expiry_month;

-- ==========================================
-- CREATE INDEXES ON VIEWS FOR PERFORMANCE
-- ==========================================

-- Index for faster pilot lookups
CREATE INDEX IF NOT EXISTS idx_an_pilots_active_role ON an_pilots(is_active, role);

-- Index for expiry date queries
CREATE INDEX IF NOT EXISTS idx_an_pilot_checks_expiry_status ON an_pilot_checks(expiry_date) WHERE expiry_date IS NOT NULL;

-- Index for leave requests by roster period
CREATE INDEX IF NOT EXISTS idx_an_leave_requests_roster_status ON an_leave_requests(roster_period, status);

COMMIT;

-- Show completion status and view count
SELECT
    'Database views created successfully!' as status,
    COUNT(*) as total_views
FROM information_schema.views
WHERE table_schema = 'public' AND table_name LIKE 'an_%';