-- ============================================================================
-- Air Niugini B767 Pilot Management System
-- Migration 009: Email & SMS Notification System
-- Created: 2025-10-01
-- ============================================================================

-- ============================================================================
-- 1. NOTIFICATION PREFERENCES TABLE
-- ============================================================================
-- Stores user preferences for email/SMS notifications

CREATE TABLE IF NOT EXISTS notification_preferences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES an_users(id) ON DELETE CASCADE,

    -- Email Notification Settings
    email_enabled BOOLEAN NOT NULL DEFAULT true,
    email_address TEXT,

    -- Notification Type Preferences
    certification_expiry_alerts BOOLEAN NOT NULL DEFAULT true,
    certification_expiry_days INTEGER NOT NULL DEFAULT 30, -- Days before expiry to notify
    leave_request_alerts BOOLEAN NOT NULL DEFAULT true,
    leave_approval_alerts BOOLEAN NOT NULL DEFAULT true,
    system_notifications BOOLEAN NOT NULL DEFAULT true,

    -- Notification Frequency
    daily_digest BOOLEAN NOT NULL DEFAULT false,
    digest_time TIME DEFAULT '08:00:00', -- Time to send daily digest

    -- Metadata
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT unique_user_preferences UNIQUE (user_id)
);

-- Create index for fast user lookups
CREATE INDEX IF NOT EXISTS idx_notification_preferences_user_id
ON notification_preferences(user_id);

-- ============================================================================
-- 2. NOTIFICATION QUEUE TABLE
-- ============================================================================
-- Queue for pending notifications to be sent

CREATE TABLE IF NOT EXISTS notification_queue (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Recipient Information
    user_id UUID REFERENCES an_users(id) ON DELETE CASCADE,
    email_address TEXT NOT NULL,

    -- Notification Details
    notification_type TEXT NOT NULL, -- 'certification_expiry', 'leave_request', 'leave_approval', 'system'
    subject TEXT NOT NULL,
    template_name TEXT NOT NULL,
    template_data JSONB NOT NULL DEFAULT '{}',

    -- Status Tracking
    status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'sent', 'failed', 'cancelled'
    priority INTEGER NOT NULL DEFAULT 5, -- 1 (highest) to 10 (lowest)

    -- Retry Logic
    attempts INTEGER NOT NULL DEFAULT 0,
    max_attempts INTEGER NOT NULL DEFAULT 3,
    last_attempt_at TIMESTAMPTZ,
    next_retry_at TIMESTAMPTZ,
    error_message TEXT,

    -- Scheduling
    scheduled_for TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    sent_at TIMESTAMPTZ,

    -- Metadata
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT valid_status CHECK (status IN ('pending', 'sent', 'failed', 'cancelled')),
    CONSTRAINT valid_priority CHECK (priority BETWEEN 1 AND 10)
);

-- Create indexes for queue processing
CREATE INDEX IF NOT EXISTS idx_notification_queue_status
ON notification_queue(status) WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS idx_notification_queue_scheduled
ON notification_queue(scheduled_for) WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS idx_notification_queue_priority
ON notification_queue(priority, scheduled_for) WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS idx_notification_queue_user_id
ON notification_queue(user_id);

-- ============================================================================
-- 3. NOTIFICATION LOG TABLE
-- ============================================================================
-- Historical record of all sent notifications

CREATE TABLE IF NOT EXISTS notification_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Original Queue Reference
    queue_id UUID REFERENCES notification_queue(id) ON DELETE SET NULL,

    -- Recipient Information
    user_id UUID REFERENCES an_users(id) ON DELETE SET NULL,
    email_address TEXT NOT NULL,

    -- Notification Details
    notification_type TEXT NOT NULL,
    subject TEXT NOT NULL,
    template_name TEXT NOT NULL,

    -- Delivery Status
    status TEXT NOT NULL, -- 'delivered', 'bounced', 'complained', 'failed'
    delivery_provider TEXT, -- 'resend', 'twilio', etc.
    provider_message_id TEXT,
    provider_response JSONB,

    -- Engagement Tracking
    opened_at TIMESTAMPTZ,
    clicked_at TIMESTAMPTZ,

    -- Metadata
    sent_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT valid_log_status CHECK (status IN ('delivered', 'bounced', 'complained', 'failed'))
);

-- Create indexes for log queries
CREATE INDEX IF NOT EXISTS idx_notification_log_user_id
ON notification_log(user_id);

CREATE INDEX IF NOT EXISTS idx_notification_log_sent_at
ON notification_log(sent_at DESC);

CREATE INDEX IF NOT EXISTS idx_notification_log_type
ON notification_log(notification_type);

CREATE INDEX IF NOT EXISTS idx_notification_log_status
ON notification_log(status);

-- ============================================================================
-- 4. IN-APP NOTIFICATIONS TABLE
-- ============================================================================
-- For in-app notification center (bell icon)

CREATE TABLE IF NOT EXISTS in_app_notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Recipient
    user_id UUID NOT NULL REFERENCES an_users(id) ON DELETE CASCADE,

    -- Notification Content
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    notification_type TEXT NOT NULL,
    action_url TEXT,
    icon TEXT DEFAULT 'bell',

    -- Status
    is_read BOOLEAN NOT NULL DEFAULT false,
    read_at TIMESTAMPTZ,

    -- Reference to source entity (optional)
    related_entity_type TEXT, -- 'pilot', 'certification', 'leave_request'
    related_entity_id UUID,

    -- Metadata
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ, -- Auto-cleanup old notifications

    CONSTRAINT valid_in_app_notification_type CHECK (
        notification_type IN ('certification_expiry', 'leave_request', 'leave_approval', 'system', 'info', 'warning', 'error')
    )
);

-- Create indexes for in-app notification queries
CREATE INDEX IF NOT EXISTS idx_in_app_notifications_user_id
ON in_app_notifications(user_id, is_read, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_in_app_notifications_expires
ON in_app_notifications(expires_at) WHERE expires_at IS NOT NULL;

-- ============================================================================
-- 5. NOTIFICATION TEMPLATES TABLE (Optional - for dynamic templates)
-- ============================================================================
-- Store customizable email templates

CREATE TABLE IF NOT EXISTS notification_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Template Identification
    template_name TEXT NOT NULL UNIQUE,
    template_type TEXT NOT NULL, -- 'email', 'sms', 'in_app'

    -- Content
    subject_template TEXT,
    body_template TEXT NOT NULL,
    variables JSONB DEFAULT '[]', -- List of available variables

    -- Metadata
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT valid_template_type CHECK (template_type IN ('email', 'sms', 'in_app'))
);

-- ============================================================================
-- 6. TRIGGER FUNCTIONS
-- ============================================================================

-- Update timestamp on notification_preferences
CREATE OR REPLACE FUNCTION update_notification_preferences_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_notification_preferences_timestamp
    BEFORE UPDATE ON notification_preferences
    FOR EACH ROW
    EXECUTE FUNCTION update_notification_preferences_timestamp();

-- Update timestamp on notification_queue
CREATE OR REPLACE FUNCTION update_notification_queue_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_notification_queue_timestamp
    BEFORE UPDATE ON notification_queue
    FOR EACH ROW
    EXECUTE FUNCTION update_notification_queue_timestamp();

-- Auto-set read_at timestamp when notification is marked as read
CREATE OR REPLACE FUNCTION set_notification_read_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.is_read = true AND OLD.is_read = false THEN
        NEW.read_at = NOW();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_notification_read_timestamp
    BEFORE UPDATE ON in_app_notifications
    FOR EACH ROW
    EXECUTE FUNCTION set_notification_read_timestamp();

-- ============================================================================
-- 7. DEFAULT NOTIFICATION PREFERENCES FOR EXISTING USERS
-- ============================================================================

-- Insert default preferences for all existing users
INSERT INTO notification_preferences (user_id, email_enabled, email_address)
SELECT
    id,
    true,
    email
FROM an_users
ON CONFLICT (user_id) DO NOTHING;

-- ============================================================================
-- 8. DEFAULT NOTIFICATION TEMPLATES
-- ============================================================================

-- Certification Expiry Template
INSERT INTO notification_templates (template_name, template_type, subject_template, body_template, variables, description)
VALUES (
    'certification_expiry_alert',
    'email',
    'Certification Expiry Alert - {{pilot_name}}',
    '<p>Dear {{recipient_name}},</p><p>This is a reminder that the following certification is expiring soon:</p><ul><li><strong>Pilot:</strong> {{pilot_name}}</li><li><strong>Check Type:</strong> {{check_description}}</li><li><strong>Expiry Date:</strong> {{expiry_date}}</li><li><strong>Days Remaining:</strong> {{days_remaining}}</li></ul><p>Please ensure renewal is scheduled.</p>',
    '["recipient_name", "pilot_name", "check_description", "expiry_date", "days_remaining"]'::jsonb,
    'Email alert for expiring certifications'
) ON CONFLICT (template_name) DO NOTHING;

-- Leave Request Template
INSERT INTO notification_templates (template_name, template_type, subject_template, body_template, variables, description)
VALUES (
    'leave_request_notification',
    'email',
    'New Leave Request - {{pilot_name}}',
    '<p>Dear {{recipient_name}},</p><p>A new leave request has been submitted:</p><ul><li><strong>Pilot:</strong> {{pilot_name}}</li><li><strong>Type:</strong> {{leave_type}}</li><li><strong>Period:</strong> {{start_date}} to {{end_date}}</li><li><strong>Roster:</strong> {{roster_period}}</li></ul><p>Please review and approve.</p>',
    '["recipient_name", "pilot_name", "leave_type", "start_date", "end_date", "roster_period"]'::jsonb,
    'Email notification for new leave requests'
) ON CONFLICT (template_name) DO NOTHING;

-- Leave Approval Template
INSERT INTO notification_templates (template_name, template_type, subject_template, body_template, variables, description)
VALUES (
    'leave_approval_notification',
    'email',
    'Leave Request {{status}} - {{roster_period}}',
    '<p>Dear {{pilot_name}},</p><p>Your leave request has been {{status}}:</p><ul><li><strong>Type:</strong> {{leave_type}}</li><li><strong>Period:</strong> {{start_date}} to {{end_date}}</li><li><strong>Roster:</strong> {{roster_period}}</li></ul>{{#if comments}}<p><strong>Comments:</strong> {{comments}}</p>{{/if}}',
    '["pilot_name", "status", "leave_type", "start_date", "end_date", "roster_period", "comments"]'::jsonb,
    'Email notification for leave request approval/rejection'
) ON CONFLICT (template_name) DO NOTHING;

-- ============================================================================
-- 9. ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS on all notification tables
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE in_app_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_templates ENABLE ROW LEVEL SECURITY;

-- Notification Preferences Policies
CREATE POLICY "Users can view their own notification preferences"
    ON notification_preferences FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notification preferences"
    ON notification_preferences FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all notification preferences"
    ON notification_preferences FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM an_users
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Notification Queue Policies (Admin only for queue management)
CREATE POLICY "Admins can manage notification queue"
    ON notification_queue FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM an_users
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Notification Log Policies
CREATE POLICY "Users can view their own notification log"
    ON notification_log FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all notification logs"
    ON notification_log FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM an_users
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- In-App Notifications Policies
CREATE POLICY "Users can view their own in-app notifications"
    ON in_app_notifications FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own in-app notifications"
    ON in_app_notifications FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all in-app notifications"
    ON in_app_notifications FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM an_users
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Notification Templates Policies (Admin only)
CREATE POLICY "All users can view active templates"
    ON notification_templates FOR SELECT
    USING (is_active = true);

CREATE POLICY "Admins can manage templates"
    ON notification_templates FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM an_users
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- ============================================================================
-- 10. CLEANUP FUNCTION
-- ============================================================================

-- Function to clean up old notifications and logs
CREATE OR REPLACE FUNCTION cleanup_old_notifications()
RETURNS void AS $$
BEGIN
    -- Delete old in-app notifications past expiry
    DELETE FROM in_app_notifications
    WHERE expires_at IS NOT NULL AND expires_at < NOW();

    -- Delete old read in-app notifications (older than 30 days)
    DELETE FROM in_app_notifications
    WHERE is_read = true AND read_at < NOW() - INTERVAL '30 days';

    -- Delete old notification logs (older than 90 days)
    DELETE FROM notification_log
    WHERE created_at < NOW() - INTERVAL '90 days';

    -- Delete old sent/cancelled queue items (older than 7 days)
    DELETE FROM notification_queue
    WHERE status IN ('sent', 'cancelled') AND updated_at < NOW() - INTERVAL '7 days';

    -- Delete old failed queue items (older than 30 days)
    DELETE FROM notification_queue
    WHERE status = 'failed' AND updated_at < NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

-- Add comment to track migration
COMMENT ON TABLE notification_preferences IS 'Migration 009: User notification preferences for email/SMS alerts';
COMMENT ON TABLE notification_queue IS 'Migration 009: Queue for pending notifications to be sent';
COMMENT ON TABLE notification_log IS 'Migration 009: Historical log of sent notifications';
COMMENT ON TABLE in_app_notifications IS 'Migration 009: In-app notification center notifications';
COMMENT ON TABLE notification_templates IS 'Migration 009: Customizable notification templates';
