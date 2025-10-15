-- ==========================================
-- Flight Requests System Migration
-- Author: Air Niugini Development Team
-- Date: 2025-10-15
-- Description: Creates flight requests table and related structures
--              for managing pilot flight assignments, qualifications,
--              and operational requests
-- ==========================================

BEGIN;

-- ==========================================
-- STEP 1: CREATE FLIGHT_REQUESTS TABLE
-- ==========================================

CREATE TABLE IF NOT EXISTS flight_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Basic Information
    pilot_id UUID NOT NULL REFERENCES pilots(id) ON DELETE CASCADE,
    request_type VARCHAR(50) NOT NULL CHECK (request_type IN (
        'FLIGHT_ASSIGNMENT',    -- Request for flight assignment
        'ROUTE_QUALIFICATION',  -- Request for route qualification
        'TYPE_RATING',          -- Request for type rating training
        'LINE_CHECK',           -- Request for line check
        'SIM_TRAINING',         -- Request for simulator training
        'STANDBY',              -- Request for standby duty
        'POSITION_CHANGE',      -- Request for position change (FO to Captain)
        'BASE_CHANGE',          -- Request for base change
        'OTHER'                 -- Other flight-related requests
    )),

    -- Flight Details
    flight_number VARCHAR(20),
    route VARCHAR(100),          -- e.g., "POM-LAE", "POM-CNS-BNE"
    departure_airport VARCHAR(10),
    arrival_airport VARCHAR(10),
    departure_date DATE,
    return_date DATE,

    -- Request Details
    priority VARCHAR(20) DEFAULT 'NORMAL' CHECK (priority IN ('LOW', 'NORMAL', 'HIGH', 'URGENT')),
    status VARCHAR(50) DEFAULT 'PENDING' CHECK (status IN (
        'PENDING',           -- Awaiting review
        'UNDER_REVIEW',      -- Being reviewed
        'APPROVED',          -- Approved
        'REJECTED',          -- Rejected
        'COMPLETED',         -- Request fulfilled
        'CANCELLED'          -- Cancelled by requester
    )),

    -- Additional Information
    reason TEXT,
    notes TEXT,
    attachments JSONB DEFAULT '[]'::jsonb,  -- Array of file URLs/paths

    -- Qualification Requirements (for route/type rating requests)
    required_qualifications JSONB DEFAULT '[]'::jsonb,  -- Array of required check types

    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    reviewed_by UUID REFERENCES an_users(id),
    reviewed_at TIMESTAMP WITH TIME ZONE,
    review_notes TEXT,

    -- Audit Fields
    created_by UUID REFERENCES an_users(id),
    cancelled_at TIMESTAMP WITH TIME ZONE,
    cancelled_by UUID REFERENCES an_users(id),
    cancellation_reason TEXT
);

-- ==========================================
-- STEP 2: CREATE INDEXES
-- ==========================================

CREATE INDEX IF NOT EXISTS idx_flight_requests_pilot_id ON flight_requests(pilot_id);
CREATE INDEX IF NOT EXISTS idx_flight_requests_request_type ON flight_requests(request_type);
CREATE INDEX IF NOT EXISTS idx_flight_requests_status ON flight_requests(status);
CREATE INDEX IF NOT EXISTS idx_flight_requests_priority ON flight_requests(priority);
CREATE INDEX IF NOT EXISTS idx_flight_requests_departure_date ON flight_requests(departure_date);
CREATE INDEX IF NOT EXISTS idx_flight_requests_created_at ON flight_requests(created_at);
CREATE INDEX IF NOT EXISTS idx_flight_requests_pilot_status ON flight_requests(pilot_id, status);

-- ==========================================
-- STEP 3: CREATE UPDATED_AT TRIGGER
-- ==========================================

CREATE OR REPLACE FUNCTION update_flight_requests_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_flight_requests_updated_at
    BEFORE UPDATE ON flight_requests
    FOR EACH ROW
    EXECUTE FUNCTION update_flight_requests_updated_at();

-- ==========================================
-- STEP 4: CREATE ROW LEVEL SECURITY POLICIES
-- ==========================================

-- Enable RLS on flight_requests table
ALTER TABLE flight_requests ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view all flight requests (for admin/manager roles)
CREATE POLICY flight_requests_select_policy ON flight_requests
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM an_users
            WHERE an_users.id = auth.uid()
            AND an_users.role IN ('admin', 'manager')
        )
        OR
        pilot_id IN (
            SELECT id FROM pilots WHERE employee_id = (
                SELECT email FROM auth.users WHERE id = auth.uid()
            )
        )
    );

-- Policy: Authenticated users can create flight requests
CREATE POLICY flight_requests_insert_policy ON flight_requests
    FOR INSERT
    WITH CHECK (
        auth.uid() IS NOT NULL
    );

-- Policy: Admin and manager can update all; pilots can update their own pending requests
CREATE POLICY flight_requests_update_policy ON flight_requests
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM an_users
            WHERE an_users.id = auth.uid()
            AND an_users.role IN ('admin', 'manager')
        )
        OR
        (
            pilot_id IN (
                SELECT id FROM pilots WHERE employee_id = (
                    SELECT email FROM auth.users WHERE id = auth.uid()
                )
            )
            AND status = 'PENDING'
        )
    );

-- Policy: Only admin can delete flight requests
CREATE POLICY flight_requests_delete_policy ON flight_requests
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM an_users
            WHERE an_users.id = auth.uid()
            AND an_users.role = 'admin'
        )
    );

-- ==========================================
-- STEP 5: CREATE HELPER VIEWS
-- ==========================================

-- View: Pending flight requests with pilot details
CREATE OR REPLACE VIEW pending_flight_requests AS
SELECT
    fr.id,
    fr.request_type,
    fr.flight_number,
    fr.route,
    fr.departure_date,
    fr.return_date,
    fr.priority,
    fr.status,
    fr.created_at,
    p.id as pilot_id,
    p.employee_id,
    p.first_name,
    p.last_name,
    p.role as pilot_role,
    u.name as reviewer_name,
    fr.reviewed_at
FROM flight_requests fr
INNER JOIN pilots p ON fr.pilot_id = p.id
LEFT JOIN an_users u ON fr.reviewed_by = u.id
WHERE fr.status IN ('PENDING', 'UNDER_REVIEW')
ORDER BY
    CASE fr.priority
        WHEN 'URGENT' THEN 1
        WHEN 'HIGH' THEN 2
        WHEN 'NORMAL' THEN 3
        WHEN 'LOW' THEN 4
    END,
    fr.created_at ASC;

-- View: Upcoming flights (approved requests with future departure dates)
CREATE OR REPLACE VIEW upcoming_flights AS
SELECT
    fr.id,
    fr.flight_number,
    fr.route,
    fr.departure_airport,
    fr.arrival_airport,
    fr.departure_date,
    fr.return_date,
    p.id as pilot_id,
    p.employee_id,
    p.first_name,
    p.last_name,
    p.role as pilot_role
FROM flight_requests fr
INNER JOIN pilots p ON fr.pilot_id = p.id
WHERE fr.status = 'APPROVED'
AND fr.departure_date >= CURRENT_DATE
AND fr.request_type IN ('FLIGHT_ASSIGNMENT', 'STANDBY')
ORDER BY fr.departure_date ASC, fr.flight_number ASC;

-- View: Flight request statistics by pilot
CREATE OR REPLACE VIEW flight_request_statistics AS
SELECT
    p.id as pilot_id,
    p.employee_id,
    p.first_name,
    p.last_name,
    p.role,
    COUNT(fr.id) as total_requests,
    COUNT(fr.id) FILTER (WHERE fr.status = 'PENDING') as pending_count,
    COUNT(fr.id) FILTER (WHERE fr.status = 'APPROVED') as approved_count,
    COUNT(fr.id) FILTER (WHERE fr.status = 'REJECTED') as rejected_count,
    COUNT(fr.id) FILTER (WHERE fr.status = 'COMPLETED') as completed_count,
    MAX(fr.created_at) as last_request_date
FROM pilots p
LEFT JOIN flight_requests fr ON p.id = fr.pilot_id
WHERE p.is_active = true
GROUP BY p.id, p.employee_id, p.first_name, p.last_name, p.role
ORDER BY total_requests DESC;

-- ==========================================
-- STEP 6: INSERT SAMPLE DATA (OPTIONAL)
-- ==========================================

-- Sample flight requests for testing
-- (Only insert if pilots table has data)
DO $$
DECLARE
    sample_pilot_id UUID;
BEGIN
    -- Get a sample pilot ID
    SELECT id INTO sample_pilot_id FROM pilots WHERE role = 'Captain' LIMIT 1;

    IF sample_pilot_id IS NOT NULL THEN
        -- Insert sample flight assignment request
        INSERT INTO flight_requests (
            pilot_id,
            request_type,
            flight_number,
            route,
            departure_airport,
            arrival_airport,
            departure_date,
            return_date,
            priority,
            status,
            reason
        ) VALUES
        (
            sample_pilot_id,
            'FLIGHT_ASSIGNMENT',
            'PX141',
            'POM-LAE',
            'POM',
            'LAE',
            CURRENT_DATE + INTERVAL '7 days',
            CURRENT_DATE + INTERVAL '7 days',
            'NORMAL',
            'PENDING',
            'Regular scheduled flight assignment request'
        );

        RAISE NOTICE 'Sample flight request created successfully';
    END IF;
END $$;

-- ==========================================
-- STEP 7: GRANT PERMISSIONS
-- ==========================================

-- Grant SELECT permission to authenticated users for views
GRANT SELECT ON pending_flight_requests TO authenticated;
GRANT SELECT ON upcoming_flights TO authenticated;
GRANT SELECT ON flight_request_statistics TO authenticated;

COMMIT;

-- ==========================================
-- MIGRATION COMPLETE
-- ==========================================

-- Summary of changes:
-- 1. Created flight_requests table with comprehensive fields
-- 2. Created indexes for performance optimization
-- 3. Created updated_at trigger function
-- 4. Implemented Row Level Security policies
-- 5. Created helper views for common queries
-- 6. Inserted sample data for testing
-- 7. Granted necessary permissions

-- Next steps:
-- 1. Create service layer functions (flight-request-service.ts)
-- 2. Create API routes (/api/flight-requests)
-- 3. Create UI components for flight request management
-- 4. Add navigation menu items
