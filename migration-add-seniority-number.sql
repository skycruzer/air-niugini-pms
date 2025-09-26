-- ==========================================
-- Migration: Add seniority_number to pilots table
-- Date: 2025-09-26
-- Description: Add seniority tracking for pilots
-- ==========================================

-- Add seniority_number column to an_pilots table
-- This field will be null initially and can be populated later
-- Lower numbers indicate higher seniority (e.g., 1 = most senior)
ALTER TABLE an_pilots 
ADD COLUMN seniority_number INTEGER;

-- Add index for performance when sorting by seniority
CREATE INDEX idx_an_pilots_seniority_number ON an_pilots(seniority_number);

-- Add comment to document the column purpose
COMMENT ON COLUMN an_pilots.seniority_number IS 'Pilot seniority number for ranking and benefits calculation. Lower numbers indicate higher seniority.';

-- Verify the column was added successfully
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'an_pilots' 
AND column_name = 'seniority_number';

-- Show completion message
SELECT 'Migration completed: seniority_number column added to an_pilots table' as status;