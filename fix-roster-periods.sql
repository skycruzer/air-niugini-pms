-- Fix Roster Periods: Update incorrect RP14/2025 and beyond to correct RP1/2026+ labels
--
-- The roster system only supports RP1-RP13 per year (13 periods × 28 days = 364 days)
-- After RP13/YYYY, the next period is RP1/(YYYY+1)
--
-- Known roster: RP12/2025 starts October 11, 2025
-- RP12/2025: Oct 11 - Nov 7, 2025
-- RP13/2025: Nov 8 - Dec 5, 2025
-- RP1/2026: Dec 6, 2025 - Jan 2, 2026
-- RP2/2026: Jan 3 - Jan 30, 2026
-- RP3/2026: Jan 31 - Feb 27, 2026
-- RP4/2026: Feb 28 - Mar 27, 2026
-- RP5/2026: Mar 28 - Apr 24, 2026
-- RP6/2026: Apr 25 - May 22, 2026
-- RP7/2026: May 23 - Jun 19, 2026

-- First, let's see what we need to fix
SELECT
  id,
  roster_period AS current_roster_period,
  start_date,
  end_date,
  request_type,
  status,
  CASE
    -- RP1/2026: Dec 6, 2025 - Jan 2, 2026
    WHEN start_date >= '2025-12-06' AND start_date <= '2026-01-02' THEN 'RP1/2026'
    -- RP2/2026: Jan 3 - Jan 30, 2026
    WHEN start_date >= '2026-01-03' AND start_date <= '2026-01-30' THEN 'RP2/2026'
    -- RP3/2026: Jan 31 - Feb 27, 2026
    WHEN start_date >= '2026-01-31' AND start_date <= '2026-02-27' THEN 'RP3/2026'
    -- RP4/2026: Feb 28 - Mar 27, 2026
    WHEN start_date >= '2026-02-28' AND start_date <= '2026-03-27' THEN 'RP4/2026'
    -- RP5/2026: Mar 28 - Apr 24, 2026
    WHEN start_date >= '2026-03-28' AND start_date <= '2026-04-24' THEN 'RP5/2026'
    -- RP6/2026: Apr 25 - May 22, 2026
    WHEN start_date >= '2026-04-25' AND start_date <= '2026-05-22' THEN 'RP6/2026'
    -- RP7/2026: May 23 - Jun 19, 2026
    WHEN start_date >= '2026-05-23' AND start_date <= '2026-06-19' THEN 'RP7/2026'
    -- RP8/2026: Jun 20 - Jul 17, 2026
    WHEN start_date >= '2026-06-20' AND start_date <= '2026-07-17' THEN 'RP8/2026'
    ELSE roster_period
  END AS correct_roster_period
FROM leave_requests
WHERE roster_period LIKE 'RP14/%' OR start_date >= '2025-12-06'
ORDER BY start_date;

-- Update the records with correct roster periods
UPDATE leave_requests
SET roster_period = CASE
  -- RP1/2026: Dec 6, 2025 - Jan 2, 2026
  WHEN start_date >= '2025-12-06' AND start_date <= '2026-01-02' THEN 'RP1/2026'
  -- RP2/2026: Jan 3 - Jan 30, 2026
  WHEN start_date >= '2026-01-03' AND start_date <= '2026-01-30' THEN 'RP2/2026'
  -- RP3/2026: Jan 31 - Feb 27, 2026
  WHEN start_date >= '2026-01-31' AND start_date <= '2026-02-27' THEN 'RP3/2026'
  -- RP4/2026: Feb 28 - Mar 27, 2026
  WHEN start_date >= '2026-02-28' AND start_date <= '2026-03-27' THEN 'RP4/2026'
  -- RP5/2026: Mar 28 - Apr 24, 2026
  WHEN start_date >= '2026-03-28' AND start_date <= '2026-04-24' THEN 'RP5/2026'
  -- RP6/2026: Apr 25 - May 22, 2026
  WHEN start_date >= '2026-04-25' AND start_date <= '2026-05-22' THEN 'RP6/2026'
  -- RP7/2026: May 23 - Jun 19, 2026
  WHEN start_date >= '2026-05-23' AND start_date <= '2026-06-19' THEN 'RP7/2026'
  -- RP8/2026: Jun 20 - Jul 17, 2026
  WHEN start_date >= '2026-06-20' AND start_date <= '2026-07-17' THEN 'RP8/2026'
  ELSE roster_period
END
WHERE roster_period LIKE 'RP14/%' OR start_date >= '2025-12-06';

-- Verify the update
SELECT
  roster_period,
  COUNT(*) as count,
  MIN(start_date) as earliest_start,
  MAX(end_date) as latest_end
FROM leave_requests
WHERE start_date >= '2025-12-06'
GROUP BY roster_period
ORDER BY roster_period;
