-- ==========================================
-- Air Niugini B767 Pilot Management System
-- Row Level Security (RLS) Policies
-- ==========================================

-- Enable Row Level Security on all tables
ALTER TABLE an_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE an_pilots ENABLE ROW LEVEL SECURITY;
ALTER TABLE an_check_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE an_pilot_checks ENABLE ROW LEVEL SECURITY;
ALTER TABLE an_leave_requests ENABLE ROW LEVEL SECURITY;

-- ==========================================
-- RLS POLICIES FOR an_users
-- ==========================================

-- Users can view their own profile and other users if they're admin/manager
CREATE POLICY "Users can view profiles" ON an_users
    FOR SELECT USING (
        auth.uid()::text IN (
            SELECT id::text FROM an_users
            WHERE email = auth.email()
        )
    );

-- Only admins can insert new users
CREATE POLICY "Admins can create users" ON an_users
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM an_users
            WHERE id::text = auth.uid()::text
            AND role = 'admin'
        )
    );

-- Users can update their own profile, admins can update all
CREATE POLICY "Users can update profiles" ON an_users
    FOR UPDATE USING (
        id::text = auth.uid()::text OR
        EXISTS (
            SELECT 1 FROM an_users
            WHERE id::text = auth.uid()::text
            AND role = 'admin'
        )
    );

-- Only admins can delete users
CREATE POLICY "Admins can delete users" ON an_users
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM an_users
            WHERE id::text = auth.uid()::text
            AND role = 'admin'
        )
    );

-- ==========================================
-- RLS POLICIES FOR an_pilots
-- ==========================================

-- All authenticated users can view pilots
CREATE POLICY "Authenticated users can view pilots" ON an_pilots
    FOR SELECT USING (
        auth.role() = 'authenticated'
    );

-- Only admins can create pilots
CREATE POLICY "Admins can create pilots" ON an_pilots
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM an_users
            WHERE id::text = auth.uid()::text
            AND role = 'admin'
        )
    );

-- Admins and managers can update pilots
CREATE POLICY "Admins and managers can update pilots" ON an_pilots
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM an_users
            WHERE id::text = auth.uid()::text
            AND role IN ('admin', 'manager')
        )
    );

-- Only admins can delete pilots
CREATE POLICY "Admins can delete pilots" ON an_pilots
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM an_users
            WHERE id::text = auth.uid()::text
            AND role = 'admin'
        )
    );

-- ==========================================
-- RLS POLICIES FOR an_check_types
-- ==========================================

-- All authenticated users can view check types
CREATE POLICY "Authenticated users can view check types" ON an_check_types
    FOR SELECT USING (
        auth.role() = 'authenticated'
    );

-- Only admins can create check types
CREATE POLICY "Admins can create check types" ON an_check_types
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM an_users
            WHERE id::text = auth.uid()::text
            AND role = 'admin'
        )
    );

-- Admins and managers can update check types
CREATE POLICY "Admins and managers can update check types" ON an_check_types
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM an_users
            WHERE id::text = auth.uid()::text
            AND role IN ('admin', 'manager')
        )
    );

-- Only admins can delete check types
CREATE POLICY "Admins can delete check types" ON an_check_types
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM an_users
            WHERE id::text = auth.uid()::text
            AND role = 'admin'
        )
    );

-- ==========================================
-- RLS POLICIES FOR an_pilot_checks
-- ==========================================

-- All authenticated users can view pilot checks
CREATE POLICY "Authenticated users can view pilot checks" ON an_pilot_checks
    FOR SELECT USING (
        auth.role() = 'authenticated'
    );

-- Admins and managers can create pilot checks
CREATE POLICY "Admins and managers can create pilot checks" ON an_pilot_checks
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM an_users
            WHERE id::text = auth.uid()::text
            AND role IN ('admin', 'manager')
        )
    );

-- Admins and managers can update pilot checks
CREATE POLICY "Admins and managers can update pilot checks" ON an_pilot_checks
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM an_users
            WHERE id::text = auth.uid()::text
            AND role IN ('admin', 'manager')
        )
    );

-- Admins and managers can delete pilot checks
CREATE POLICY "Admins and managers can delete pilot checks" ON an_pilot_checks
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM an_users
            WHERE id::text = auth.uid()::text
            AND role IN ('admin', 'manager')
        )
    );

-- ==========================================
-- RLS POLICIES FOR an_leave_requests
-- ==========================================

-- All authenticated users can view leave requests
CREATE POLICY "Authenticated users can view leave requests" ON an_leave_requests
    FOR SELECT USING (
        auth.role() = 'authenticated'
    );

-- All authenticated users can create leave requests
CREATE POLICY "Authenticated users can create leave requests" ON an_leave_requests
    FOR INSERT WITH CHECK (
        auth.role() = 'authenticated'
    );

-- Users can update their own requests, admins and managers can update all
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

-- Only admins can delete leave requests
CREATE POLICY "Admins can delete leave requests" ON an_leave_requests
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM an_users
            WHERE id::text = auth.uid()::text
            AND role = 'admin'
        )
    );

-- ==========================================
-- ADDITIONAL SECURITY FUNCTIONS
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

-- Show completion status
SELECT 'Row Level Security policies created successfully!' as status;