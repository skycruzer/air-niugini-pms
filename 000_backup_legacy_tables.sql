-- =====================================================
-- BACKUP SCRIPT FOR LEGACY TABLES
-- =====================================================
-- This script creates backup copies of legacy tables before removal
-- Backup tables will have '_backup' suffix and include creation timestamp
--
-- Run this BEFORE executing 001_remove_legacy_tables.sql
--
-- Created: 2025-09-30
-- Purpose: Data preservation before legacy table removal
-- =====================================================

-- Create backup schema for archival (if not exists)
CREATE SCHEMA IF NOT EXISTS archive;

-- Set search path to ensure we're working in the right schema
SET search_path TO public, archive;

-- =====================================================
-- BACKUP: an_pilots table
-- =====================================================
DROP TABLE IF EXISTS archive.an_pilots_backup_2025_09_30 CASCADE;

CREATE TABLE archive.an_pilots_backup_2025_09_30 AS
SELECT
  *,
  CURRENT_TIMESTAMP AS backup_created_at
FROM public.an_pilots;

COMMENT ON TABLE archive.an_pilots_backup_2025_09_30 IS
  'Backup of an_pilots table created on 2025-09-30 before legacy table removal. Contains 5 development records.';

-- =====================================================
-- BACKUP: an_pilot_checks table
-- =====================================================
DROP TABLE IF EXISTS archive.an_pilot_checks_backup_2025_09_30 CASCADE;

CREATE TABLE archive.an_pilot_checks_backup_2025_09_30 AS
SELECT
  *,
  CURRENT_TIMESTAMP AS backup_created_at
FROM public.an_pilot_checks;

COMMENT ON TABLE archive.an_pilot_checks_backup_2025_09_30 IS
  'Backup of an_pilot_checks table created on 2025-09-30 before legacy table removal. Contains 18 development records.';

-- =====================================================
-- BACKUP: an_check_types table
-- =====================================================
DROP TABLE IF EXISTS archive.an_check_types_backup_2025_09_30 CASCADE;

CREATE TABLE archive.an_check_types_backup_2025_09_30 AS
SELECT
  *,
  CURRENT_TIMESTAMP AS backup_created_at
FROM public.an_check_types;

COMMENT ON TABLE archive.an_check_types_backup_2025_09_30 IS
  'Backup of an_check_types table created on 2025-09-30 before legacy table removal. Contains 10 development records.';

-- =====================================================
-- BACKUP: an_leave_requests table
-- =====================================================
DROP TABLE IF EXISTS archive.an_leave_requests_backup_2025_09_30 CASCADE;

CREATE TABLE archive.an_leave_requests_backup_2025_09_30 AS
SELECT
  *,
  CURRENT_TIMESTAMP AS backup_created_at
FROM public.an_leave_requests;

COMMENT ON TABLE archive.an_leave_requests_backup_2025_09_30 IS
  'Backup of an_leave_requests table created on 2025-09-30 before legacy table removal. Contains 0 records (empty table).';

-- =====================================================
-- VERIFICATION QUERY
-- =====================================================
-- Run this to verify backup success
SELECT
  'an_pilots' AS table_name,
  COUNT(*) AS original_count,
  (SELECT COUNT(*) FROM archive.an_pilots_backup_2025_09_30) AS backup_count
FROM public.an_pilots

UNION ALL

SELECT
  'an_pilot_checks' AS table_name,
  COUNT(*) AS original_count,
  (SELECT COUNT(*) FROM archive.an_pilot_checks_backup_2025_09_30) AS backup_count
FROM public.an_pilot_checks

UNION ALL

SELECT
  'an_check_types' AS table_name,
  COUNT(*) AS original_count,
  (SELECT COUNT(*) FROM archive.an_check_types_backup_2025_09_30) AS backup_count
FROM public.an_check_types

UNION ALL

SELECT
  'an_leave_requests' AS table_name,
  COUNT(*) AS original_count,
  (SELECT COUNT(*) FROM archive.an_leave_requests_backup_2025_09_30) AS backup_count
FROM public.an_leave_requests;

-- =====================================================
-- BACKUP COMPLETE
-- =====================================================
-- Expected results:
-- - an_pilots: 5 records backed up
-- - an_pilot_checks: 18 records backed up
-- - an_check_types: 10 records backed up
-- - an_leave_requests: 0 records backed up
--
-- Total: 33 records preserved in archive schema
-- =====================================================