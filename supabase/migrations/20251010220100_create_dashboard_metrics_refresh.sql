-- Migration: Create dashboard metrics refresh function
-- Description: Automated function to refresh dashboard materialized views and cache
-- Performance Impact: Reduces dashboard load time by pre-calculating metrics
-- Created: 2025-10-10

-- Create function to refresh dashboard metrics
CREATE OR REPLACE FUNCTION refresh_dashboard_metrics()
RETURNS TABLE(
    metric_name TEXT,
    status TEXT,
    execution_time_ms NUMERIC
) AS $$
DECLARE
    start_time TIMESTAMP;
    end_time TIMESTAMP;
BEGIN
    -- Refresh pilot_checks_overview view statistics
    start_time := clock_timestamp();
    ANALYZE pilot_checks;
    ANALYZE pilots;
    ANALYZE check_types;
    end_time := clock_timestamp();

    RETURN QUERY SELECT
        'analyze_core_tables'::TEXT,
        'SUCCESS'::TEXT,
        EXTRACT(MILLISECONDS FROM (end_time - start_time))::NUMERIC;

    -- Refresh leave_requests statistics
    start_time := clock_timestamp();
    ANALYZE leave_requests;
    end_time := clock_timestamp();

    RETURN QUERY SELECT
        'analyze_leave_requests'::TEXT,
        'SUCCESS'::TEXT,
        EXTRACT(MILLISECONDS FROM (end_time - start_time))::NUMERIC;

    -- Refresh settings and system tables
    start_time := clock_timestamp();
    ANALYZE settings;
    ANALYZE an_users;
    end_time := clock_timestamp();

    RETURN QUERY SELECT
        'analyze_system_tables'::TEXT,
        'SUCCESS'::TEXT,
        EXTRACT(MILLISECONDS FROM (end_time - start_time))::NUMERIC;

    RETURN;
END;
$$ LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public;

-- Add comment explaining function purpose
COMMENT ON FUNCTION refresh_dashboard_metrics() IS
'Refreshes dashboard metrics by running ANALYZE on core tables.
This updates query planner statistics for better performance.
Should be run periodically (e.g., daily via cron job or pg_cron extension).
Returns execution time for each operation for monitoring.';

-- Create a simplified function for manual/cron execution
CREATE OR REPLACE FUNCTION refresh_dashboard_metrics_simple()
RETURNS TEXT AS $$
BEGIN
    ANALYZE pilot_checks;
    ANALYZE pilots;
    ANALYZE check_types;
    ANALYZE leave_requests;
    ANALYZE settings;
    ANALYZE an_users;

    RETURN 'Dashboard metrics refreshed successfully at ' || NOW()::TEXT;
END;
$$ LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public;

COMMENT ON FUNCTION refresh_dashboard_metrics_simple() IS
'Simplified version of refresh_dashboard_metrics() for cron jobs.
Returns a simple success message with timestamp.
Usage: SELECT refresh_dashboard_metrics_simple();';

-- Grant execute permissions to authenticated users and service role
GRANT EXECUTE ON FUNCTION refresh_dashboard_metrics() TO authenticated;
GRANT EXECUTE ON FUNCTION refresh_dashboard_metrics() TO service_role;
GRANT EXECUTE ON FUNCTION refresh_dashboard_metrics_simple() TO authenticated;
GRANT EXECUTE ON FUNCTION refresh_dashboard_metrics_simple() TO service_role;

-- Optional: Set up pg_cron job (if pg_cron extension is enabled)
-- Uncomment the following lines to enable automated daily refresh at 2 AM UTC:
--
-- SELECT cron.schedule(
--     'refresh-dashboard-metrics',
--     '0 2 * * *',  -- Every day at 2:00 AM UTC
--     'SELECT refresh_dashboard_metrics_simple();'
-- );

-- Test the function
SELECT * FROM refresh_dashboard_metrics();
