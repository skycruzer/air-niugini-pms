-- Create leave_bids table for pilot leave bid submissions
-- This table stores pilot preferences for leave during roster periods
-- Different from leave_requests which are actual leave applications

CREATE TABLE IF NOT EXISTS leave_bids (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pilot_id UUID NOT NULL REFERENCES pilots(id) ON DELETE CASCADE,
  roster_period_code VARCHAR(20) NOT NULL,
  preferred_dates TEXT NOT NULL,
  alternative_dates TEXT,
  priority VARCHAR(10) NOT NULL CHECK (priority IN ('HIGH', 'MEDIUM', 'LOW')),
  reason TEXT NOT NULL,
  notes TEXT,
  status VARCHAR(20) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED', 'WITHDRAWN')),
  submitted_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  reviewed_by UUID REFERENCES an_users(id),
  reviewed_at TIMESTAMPTZ,
  review_comments TEXT,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Create index for common queries
CREATE INDEX IF NOT EXISTS idx_leave_bids_pilot_id ON leave_bids(pilot_id);
CREATE INDEX IF NOT EXISTS idx_leave_bids_roster_period ON leave_bids(roster_period_code);
CREATE INDEX IF NOT EXISTS idx_leave_bids_status ON leave_bids(status);
CREATE INDEX IF NOT EXISTS idx_leave_bids_submitted_at ON leave_bids(submitted_at DESC);

-- Enable Row Level Security
ALTER TABLE leave_bids ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Authenticated users can view all leave bids
CREATE POLICY "Authenticated users can view leave bids"
  ON leave_bids
  FOR SELECT
  TO authenticated
  USING (true);

-- RLS Policy: Authenticated users can insert their own leave bids
CREATE POLICY "Authenticated users can insert leave bids"
  ON leave_bids
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- RLS Policy: Only admins and managers can update leave bids
CREATE POLICY "Admins and managers can update leave bids"
  ON leave_bids
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM an_users
      WHERE an_users.id = auth.uid()
      AND an_users.role IN ('admin', 'manager')
    )
  );

-- RLS Policy: Only admins can delete leave bids
CREATE POLICY "Admins can delete leave bids"
  ON leave_bids
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM an_users
      WHERE an_users.id = auth.uid()
      AND an_users.role = 'admin'
    )
  );

-- Add comment to table
COMMENT ON TABLE leave_bids IS 'Leave bid submissions from pilots for upcoming roster periods';
COMMENT ON COLUMN leave_bids.roster_period_code IS 'Roster period code (e.g., RP12/2025)';
COMMENT ON COLUMN leave_bids.preferred_dates IS 'Pilot preferred leave dates';
COMMENT ON COLUMN leave_bids.alternative_dates IS 'Alternative dates if preferred not available';
COMMENT ON COLUMN leave_bids.priority IS 'Priority level: HIGH, MEDIUM, LOW';
COMMENT ON COLUMN leave_bids.reason IS 'Reason for leave bid';
COMMENT ON COLUMN leave_bids.notes IS 'Additional notes or comments';
COMMENT ON COLUMN leave_bids.status IS 'Bid status: PENDING, APPROVED, REJECTED, WITHDRAWN';
