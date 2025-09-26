-- Add seniority_number column to pilots table
ALTER TABLE pilots ADD COLUMN seniority_number INTEGER;

-- Create index for performance
CREATE INDEX idx_pilots_seniority_number ON pilots(seniority_number);

-- Add comment
COMMENT ON COLUMN pilots.seniority_number IS 'Seniority ranking based on commencement_date, 1 = most senior';

-- Update seniority numbers based on commencement date
WITH ranked_pilots AS (
  SELECT
    id,
    ROW_NUMBER() OVER (ORDER BY commencement_date ASC NULLS LAST) as seniority_rank
  FROM pilots
  WHERE commencement_date IS NOT NULL
)
UPDATE pilots
SET seniority_number = ranked_pilots.seniority_rank
FROM ranked_pilots
WHERE pilots.id = ranked_pilots.id;