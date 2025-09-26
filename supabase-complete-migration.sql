-- ==========================================
-- Air Niugini B767 Pilot Management System
-- COMPLETE DATABASE MIGRATION SCRIPT
-- ==========================================

-- This script contains the complete database setup for the Air Niugini PMS
-- Run this in your Supabase SQL Editor or via psql

-- ==========================================
-- STEP 1: ENABLE EXTENSIONS
-- ==========================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==========================================
-- STEP 2: CREATE TABLES
-- ==========================================

-- Users table (prefixed with an_)
CREATE TABLE IF NOT EXISTS an_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('admin', 'manager')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Pilots table
CREATE TABLE IF NOT EXISTS an_pilots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id VARCHAR(100) UNIQUE NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    middle_name VARCHAR(100),
    last_name VARCHAR(100) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('Captain', 'First Officer')),
    contract_type VARCHAR(50),
    nationality VARCHAR(100),
    passport_number VARCHAR(100),
    passport_expiry DATE,
    date_of_birth DATE,
    commencement_date DATE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Check types table (38 aviation certification types)
CREATE TABLE IF NOT EXISTS an_check_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    check_code VARCHAR(50) UNIQUE NOT NULL,
    check_description TEXT NOT NULL,
    category VARCHAR(100) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Pilot checks table (certifications/qualifications)
CREATE TABLE IF NOT EXISTS an_pilot_checks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pilot_id UUID NOT NULL REFERENCES an_pilots(id) ON DELETE CASCADE,
    check_type_id UUID NOT NULL REFERENCES an_check_types(id) ON DELETE CASCADE,
    expiry_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(pilot_id, check_type_id)
);

-- Leave requests table (RDO/WDO/Annual/Sick leave)
CREATE TABLE IF NOT EXISTS an_leave_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pilot_id UUID NOT NULL REFERENCES an_pilots(id) ON DELETE CASCADE,
    request_type VARCHAR(50) NOT NULL CHECK (request_type IN ('RDO', 'WDO', 'ANNUAL', 'SICK')),
    roster_period VARCHAR(20) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    days_count INTEGER NOT NULL,
    status VARCHAR(50) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED')),
    reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    reviewed_by UUID REFERENCES an_users(id),
    reviewed_at TIMESTAMP WITH TIME ZONE,
    notes TEXT
);

-- ==========================================
-- STEP 3: CREATE INDEXES
-- ==========================================

-- Pilots indexes
CREATE INDEX IF NOT EXISTS idx_an_pilots_employee_id ON an_pilots(employee_id);
CREATE INDEX IF NOT EXISTS idx_an_pilots_role ON an_pilots(role);
CREATE INDEX IF NOT EXISTS idx_an_pilots_is_active ON an_pilots(is_active);
CREATE INDEX IF NOT EXISTS idx_an_pilots_name ON an_pilots(first_name, last_name);
CREATE INDEX IF NOT EXISTS idx_an_pilots_active_role ON an_pilots(is_active, role);

-- Check types indexes
CREATE INDEX IF NOT EXISTS idx_an_check_types_code ON an_check_types(check_code);
CREATE INDEX IF NOT EXISTS idx_an_check_types_category ON an_check_types(category);

-- Pilot checks indexes
CREATE INDEX IF NOT EXISTS idx_an_pilot_checks_pilot_id ON an_pilot_checks(pilot_id);
CREATE INDEX IF NOT EXISTS idx_an_pilot_checks_type_id ON an_pilot_checks(check_type_id);
CREATE INDEX IF NOT EXISTS idx_an_pilot_checks_expiry ON an_pilot_checks(expiry_date);
CREATE INDEX IF NOT EXISTS idx_an_pilot_checks_expiry_status ON an_pilot_checks(expiry_date) WHERE expiry_date IS NOT NULL;

-- Leave requests indexes
CREATE INDEX IF NOT EXISTS idx_an_leave_requests_pilot_id ON an_leave_requests(pilot_id);
CREATE INDEX IF NOT EXISTS idx_an_leave_requests_status ON an_leave_requests(status);
CREATE INDEX IF NOT EXISTS idx_an_leave_requests_roster_period ON an_leave_requests(roster_period);
CREATE INDEX IF NOT EXISTS idx_an_leave_requests_dates ON an_leave_requests(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_an_leave_requests_roster_status ON an_leave_requests(roster_period, status);

-- ==========================================
-- STEP 4: CREATE TRIGGERS
-- ==========================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers
DROP TRIGGER IF EXISTS update_an_pilots_updated_at ON an_pilots;
CREATE TRIGGER update_an_pilots_updated_at
    BEFORE UPDATE ON an_pilots
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_an_pilot_checks_updated_at ON an_pilot_checks;
CREATE TRIGGER update_an_pilot_checks_updated_at
    BEFORE UPDATE ON an_pilot_checks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ==========================================
-- STEP 5: ENABLE ROW LEVEL SECURITY
-- ==========================================

ALTER TABLE an_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE an_pilots ENABLE ROW LEVEL SECURITY;
ALTER TABLE an_check_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE an_pilot_checks ENABLE ROW LEVEL SECURITY;
ALTER TABLE an_leave_requests ENABLE ROW LEVEL SECURITY;

-- ==========================================
-- STEP 6: CREATE RLS POLICIES
-- ==========================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view profiles" ON an_users;
DROP POLICY IF EXISTS "Admins can create users" ON an_users;
DROP POLICY IF EXISTS "Users can update profiles" ON an_users;
DROP POLICY IF EXISTS "Admins can delete users" ON an_users;

DROP POLICY IF EXISTS "Authenticated users can view pilots" ON an_pilots;
DROP POLICY IF EXISTS "Admins can create pilots" ON an_pilots;
DROP POLICY IF EXISTS "Admins and managers can update pilots" ON an_pilots;
DROP POLICY IF EXISTS "Admins can delete pilots" ON an_pilots;

DROP POLICY IF EXISTS "Authenticated users can view check types" ON an_check_types;
DROP POLICY IF EXISTS "Admins can create check types" ON an_check_types;
DROP POLICY IF EXISTS "Admins and managers can update check types" ON an_check_types;
DROP POLICY IF EXISTS "Admins can delete check types" ON an_check_types;

DROP POLICY IF EXISTS "Authenticated users can view pilot checks" ON an_pilot_checks;
DROP POLICY IF EXISTS "Admins and managers can create pilot checks" ON an_pilot_checks;
DROP POLICY IF EXISTS "Admins and managers can update pilot checks" ON an_pilot_checks;
DROP POLICY IF EXISTS "Admins and managers can delete pilot checks" ON an_pilot_checks;

DROP POLICY IF EXISTS "Authenticated users can view leave requests" ON an_leave_requests;
DROP POLICY IF EXISTS "Authenticated users can create leave requests" ON an_leave_requests;
DROP POLICY IF EXISTS "Users can update leave requests" ON an_leave_requests;
DROP POLICY IF EXISTS "Admins can delete leave requests" ON an_leave_requests;

-- Users policies
CREATE POLICY "Users can view profiles" ON an_users
    FOR SELECT USING (
        auth.uid()::text IN (
            SELECT id::text FROM an_users
            WHERE email = auth.email()
        )
    );

CREATE POLICY "Admins can create users" ON an_users
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM an_users
            WHERE id::text = auth.uid()::text
            AND role = 'admin'
        )
    );

CREATE POLICY "Users can update profiles" ON an_users
    FOR UPDATE USING (
        id::text = auth.uid()::text OR
        EXISTS (
            SELECT 1 FROM an_users
            WHERE id::text = auth.uid()::text
            AND role = 'admin'
        )
    );

CREATE POLICY "Admins can delete users" ON an_users
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM an_users
            WHERE id::text = auth.uid()::text
            AND role = 'admin'
        )
    );

-- Pilots policies
CREATE POLICY "Authenticated users can view pilots" ON an_pilots
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can create pilots" ON an_pilots
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM an_users
            WHERE id::text = auth.uid()::text
            AND role = 'admin'
        )
    );

CREATE POLICY "Admins and managers can update pilots" ON an_pilots
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM an_users
            WHERE id::text = auth.uid()::text
            AND role IN ('admin', 'manager')
        )
    );

CREATE POLICY "Admins can delete pilots" ON an_pilots
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM an_users
            WHERE id::text = auth.uid()::text
            AND role = 'admin'
        )
    );

-- Check types policies
CREATE POLICY "Authenticated users can view check types" ON an_check_types
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can create check types" ON an_check_types
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM an_users
            WHERE id::text = auth.uid()::text
            AND role = 'admin'
        )
    );

CREATE POLICY "Admins and managers can update check types" ON an_check_types
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM an_users
            WHERE id::text = auth.uid()::text
            AND role IN ('admin', 'manager')
        )
    );

CREATE POLICY "Admins can delete check types" ON an_check_types
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM an_users
            WHERE id::text = auth.uid()::text
            AND role = 'admin'
        )
    );

-- Pilot checks policies
CREATE POLICY "Authenticated users can view pilot checks" ON an_pilot_checks
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Admins and managers can create pilot checks" ON an_pilot_checks
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM an_users
            WHERE id::text = auth.uid()::text
            AND role IN ('admin', 'manager')
        )
    );

CREATE POLICY "Admins and managers can update pilot checks" ON an_pilot_checks
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM an_users
            WHERE id::text = auth.uid()::text
            AND role IN ('admin', 'manager')
        )
    );

CREATE POLICY "Admins and managers can delete pilot checks" ON an_pilot_checks
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM an_users
            WHERE id::text = auth.uid()::text
            AND role IN ('admin', 'manager')
        )
    );

-- Leave requests policies
CREATE POLICY "Authenticated users can view leave requests" ON an_leave_requests
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can create leave requests" ON an_leave_requests
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update leave requests" ON an_leave_requests
    FOR UPDATE USING (
        pilot_id IN (
            SELECT id FROM an_pilots
            WHERE employee_id = auth.email()
        ) OR
        EXISTS (
            SELECT 1 FROM an_users
            WHERE id::text = auth.uid()::text
            AND role IN ('admin', 'manager')
        )
    );

CREATE POLICY "Admins can delete leave requests" ON an_leave_requests
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM an_users
            WHERE id::text = auth.uid()::text
            AND role = 'admin'
        )
    );

-- ==========================================
-- STEP 7: CREATE HELPER FUNCTIONS
-- ==========================================

-- Function to check if current user is admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM an_users
        WHERE id::text = auth.uid()::text
        AND role = 'admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if current user is admin or manager
CREATE OR REPLACE FUNCTION is_admin_or_manager()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM an_users
        WHERE id::text = auth.uid()::text
        AND role IN ('admin', 'manager')
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get current user role
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS TEXT AS $$
BEGIN
    RETURN (
        SELECT role FROM an_users
        WHERE id::text = auth.uid()::text
        LIMIT 1
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMIT;

-- Show status
SELECT 'Complete database schema created successfully!' as status;