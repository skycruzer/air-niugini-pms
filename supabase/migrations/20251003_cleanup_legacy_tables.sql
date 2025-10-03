-- Migration: Cleanup Legacy Tables
-- Created: 2025-10-03
-- Description: Remove unused an_* prefixed legacy development tables
--
-- Tables to DELETE:
--   - an_pilots (5 rows) - Legacy development data
--   - an_check_types (10 rows) - Legacy development data
--   - an_pilot_checks (18 rows) - Legacy development data
--   - an_leave_requests (0 rows) - Empty legacy table
--
-- Tables to KEEP:
--   - an_users (3 rows) - ACTIVE authentication table (NOT legacy)

-- Drop legacy tables in dependency order (CASCADE removes FK constraints)
DROP TABLE IF EXISTS an_leave_requests CASCADE;
DROP TABLE IF EXISTS an_pilot_checks CASCADE;
DROP TABLE IF EXISTS an_pilots CASCADE;
DROP TABLE IF EXISTS an_check_types CASCADE;
