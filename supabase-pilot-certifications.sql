-- ==========================================
-- Air Niugini B767 Pilot Management System
-- 531 Pilot Certifications with Realistic Expiry Dates
-- ==========================================

-- This script inserts 531 pilot certifications across 27 pilots and 38 check types
-- Distribution ensures realistic coverage with varying expiry dates

INSERT INTO an_pilot_checks (pilot_id, check_type_id, expiry_date)
SELECT
    p.id as pilot_id,
    ct.id as check_type_id,
    -- Generate realistic expiry dates based on check type
    CASE
        -- License & Ratings - longer validity periods
        WHEN ct.check_code IN ('ATPL', 'CPL', 'B767-TYPE') THEN
            CURRENT_DATE + INTERVAL '2 years' + (RANDOM() * INTERVAL '1 year')
        WHEN ct.check_code IN ('IR', 'ME', 'FI') THEN
            CURRENT_DATE + INTERVAL '1 year' + (RANDOM() * INTERVAL '6 months')
        WHEN ct.check_code = 'ELP' THEN
            CURRENT_DATE + INTERVAL '3 years' + (RANDOM() * INTERVAL '1 year')
        WHEN ct.check_code = 'RT' THEN
            CURRENT_DATE + INTERVAL '5 years' + (RANDOM() * INTERVAL '1 year')

        -- Medical & Health - shorter validity periods
        WHEN ct.check_code = 'CLASS1' THEN
            CURRENT_DATE + INTERVAL '6 months' + (RANDOM() * INTERVAL '6 months')
        WHEN ct.check_code IN ('AUDIOGRAM', 'ECG', 'VISION') THEN
            CURRENT_DATE + INTERVAL '1 year' + (RANDOM() * INTERVAL '6 months')

        -- Recurrent Training - regular intervals
        WHEN ct.check_code IN ('PC', 'OPC', 'LPC') THEN
            CURRENT_DATE + INTERVAL '6 months' + (RANDOM() * INTERVAL '3 months')
        WHEN ct.check_code IN ('RECURRENT', 'CRM', 'LOFT') THEN
            CURRENT_DATE + INTERVAL '1 year' + (RANDOM() * INTERVAL '3 months')

        -- Emergency & Safety - annual renewals
        WHEN ct.category = 'Emergency & Safety' THEN
            CURRENT_DATE + INTERVAL '1 year' + (RANDOM() * INTERVAL '6 months')

        -- Security & Compliance - 2-3 year validity
        WHEN ct.category = 'Security & Compliance' THEN
            CURRENT_DATE + INTERVAL '2 years' + (RANDOM() * INTERVAL '1 year')

        -- Route & Airport - 6 month to 1 year validity
        WHEN ct.category = 'Route & Airport' THEN
            CURRENT_DATE + INTERVAL '6 months' + (RANDOM() * INTERVAL '6 months')

        -- Company Specific - annual renewal
        WHEN ct.category = 'Company Specific' THEN
            CURRENT_DATE + INTERVAL '1 year' + (RANDOM() * INTERVAL '3 months')

        -- International - longer validity
        WHEN ct.category = 'International' THEN
            CURRENT_DATE + INTERVAL '3 years' + (RANDOM() * INTERVAL '1 year')

        ELSE
            CURRENT_DATE + INTERVAL '1 year' + (RANDOM() * INTERVAL '6 months')
    END as expiry_date
FROM an_pilots p
CROSS JOIN an_check_types ct
WHERE
    -- Ensure realistic distribution - not every pilot has every certification
    (
        -- All pilots have basic licenses and medical
        ct.check_code IN ('ATPL', 'B767-TYPE', 'CLASS1', 'ELP', 'RT') OR

        -- Captains have additional certifications
        (p.role = 'Captain' AND ct.check_code IN ('CPL', 'IR', 'ME', 'FI', 'PC', 'OPC', 'LPC')) OR

        -- 90% of pilots have recurrent training
        (RANDOM() < 0.9 AND ct.check_code IN ('RECURRENT', 'CRM', 'LOFT')) OR

        -- 80% have medical tests
        (RANDOM() < 0.8 AND ct.check_code IN ('AUDIOGRAM', 'ECG', 'VISION')) OR

        -- 85% have emergency training
        (RANDOM() < 0.85 AND ct.category = 'Emergency & Safety') OR

        -- 95% have security compliance
        (RANDOM() < 0.95 AND ct.category = 'Security & Compliance') OR

        -- Route checks based on pilot experience (75% coverage)
        (RANDOM() < 0.75 AND ct.category = 'Route & Airport') OR

        -- All have company specific training
        (ct.category = 'Company Specific') OR

        -- 60% have international certifications
        (RANDOM() < 0.6 AND ct.category = 'International')
    )
ORDER BY RANDOM()
LIMIT 531;

-- Add some expired certifications for testing (about 5% expired)
UPDATE an_pilot_checks
SET expiry_date = CURRENT_DATE - INTERVAL '30 days' - (RANDOM() * INTERVAL '90 days')
WHERE id IN (
    SELECT id FROM an_pilot_checks
    ORDER BY RANDOM()
    LIMIT (SELECT COUNT(*) * 0.05 FROM an_pilot_checks)::INTEGER
);

-- Add some soon-to-expire certifications for testing (about 10% expiring within 30 days)
UPDATE an_pilot_checks
SET expiry_date = CURRENT_DATE + INTERVAL '1 day' + (RANDOM() * INTERVAL '29 days')
WHERE id IN (
    SELECT id FROM an_pilot_checks
    WHERE expiry_date > CURRENT_DATE + INTERVAL '30 days'
    ORDER BY RANDOM()
    LIMIT (SELECT COUNT(*) * 0.1 FROM an_pilot_checks WHERE expiry_date > CURRENT_DATE)::INTEGER
);

COMMIT;

-- Show statistics
SELECT
    'Pilot certifications created successfully!' as status,
    COUNT(*) as total_certifications,
    COUNT(CASE WHEN expiry_date < CURRENT_DATE THEN 1 END) as expired_count,
    COUNT(CASE WHEN expiry_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '30 days' THEN 1 END) as expiring_soon_count,
    COUNT(CASE WHEN expiry_date > CURRENT_DATE + INTERVAL '30 days' THEN 1 END) as current_count
FROM an_pilot_checks;