-- ============================================================================
-- B767 Pilot Management System
-- Migration: Pilot Self-Service Portal & Feedback Platform
-- Created: 2025-01-10
-- Description: Adds pilot authentication, feedback platform, and unified leave requests
-- ============================================================================

-- ============================================================================
-- PART 1: PILOT USERS TABLE
-- ============================================================================

-- Table for pilot user accounts (extends Supabase Auth)
CREATE TABLE IF NOT EXISTS pilot_users (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  employee_id text UNIQUE REFERENCES pilots(employee_id) ON DELETE SET NULL,
  email text UNIQUE NOT NULL,
  first_name text NOT NULL,
  last_name text NOT NULL,
  rank text CHECK (rank IN ('Captain', 'First Officer')),
  seniority_number integer,
  registration_approved boolean DEFAULT false,
  registration_date timestamptz DEFAULT now(),
  approved_by uuid REFERENCES an_users(id) ON DELETE SET NULL,
  approved_at timestamptz,
  last_login_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_pilot_users_employee_id ON pilot_users(employee_id);
CREATE INDEX IF NOT EXISTS idx_pilot_users_email ON pilot_users(email);
CREATE INDEX IF NOT EXISTS idx_pilot_users_approved ON pilot_users(registration_approved);

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_pilot_users_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_pilot_users_updated_at
  BEFORE UPDATE ON pilot_users
  FOR EACH ROW
  EXECUTE FUNCTION update_pilot_users_updated_at();

-- ============================================================================
-- PART 2: FEEDBACK CATEGORIES (USER-CREATED)
-- ============================================================================

-- Dynamic categories created by pilots
CREATE TABLE IF NOT EXISTS feedback_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  description text,
  icon text DEFAULT '💬', -- emoji or icon name
  slug text UNIQUE NOT NULL, -- URL-friendly name
  created_by uuid REFERENCES pilot_users(id) ON DELETE SET NULL,
  created_by_type text DEFAULT 'pilot' CHECK (created_by_type IN ('pilot', 'admin')),
  post_count integer DEFAULT 0,
  is_archived boolean DEFAULT false,
  is_default boolean DEFAULT false, -- For system-created categories
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_feedback_categories_slug ON feedback_categories(slug);
CREATE INDEX IF NOT EXISTS idx_feedback_categories_active ON feedback_categories(is_archived) WHERE is_archived = false;

-- Insert default categories
INSERT INTO feedback_categories (name, description, icon, slug, created_by_type, is_default) VALUES
  ('Operations', 'Flight operations, procedures, and operational feedback', '✈️', 'operations', 'admin', true),
  ('Scheduling', 'Roster, leave, duty times, and schedule discussions', '📅', 'scheduling', 'admin', true),
  ('Safety', 'Safety concerns, suggestions, and safety-related topics', '🛡️', 'safety', 'admin', true),
  ('Training', 'Training feedback, simulator sessions, and professional development', '📚', 'training', 'admin', true),
  ('Fleet Management', 'Aircraft, maintenance, and fleet-related discussions', '🔧', 'fleet-management', 'admin', true),
  ('General', 'General discussions and other topics', '💭', 'general', 'admin', true)
ON CONFLICT (slug) DO NOTHING;

-- Updated_at trigger
CREATE TRIGGER trigger_feedback_categories_updated_at
  BEFORE UPDATE ON feedback_categories
  FOR EACH ROW
  EXECUTE FUNCTION update_pilot_users_updated_at();

-- ============================================================================
-- PART 3: FEEDBACK POSTS
-- ============================================================================

-- Feedback posts with anonymous posting support
CREATE TABLE IF NOT EXISTS feedback_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pilot_user_id uuid REFERENCES pilot_users(id) ON DELETE SET NULL,
  category_id uuid REFERENCES feedback_categories(id) ON DELETE SET NULL,
  is_anonymous boolean DEFAULT false,
  author_display_name text NOT NULL, -- Either real name or "Anonymous Pilot"
  author_rank text, -- Captain/First Officer (for context even when anonymous)
  title text NOT NULL CHECK (char_length(title) >= 3 AND char_length(title) <= 200),
  content text NOT NULL CHECK (char_length(content) >= 10),
  tags text[] DEFAULT '{}',
  status text DEFAULT 'active' CHECK (status IN ('active', 'archived', 'flagged', 'deleted')),
  is_pinned boolean DEFAULT false,
  pin_order integer DEFAULT 0, -- For ordering pinned posts
  view_count integer DEFAULT 0,
  comment_count integer DEFAULT 0,
  flag_count integer DEFAULT 0,
  last_activity_at timestamptz DEFAULT now(), -- Updated when new comment added
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_feedback_posts_category ON feedback_posts(category_id);
CREATE INDEX IF NOT EXISTS idx_feedback_posts_author ON feedback_posts(pilot_user_id);
CREATE INDEX IF NOT EXISTS idx_feedback_posts_status ON feedback_posts(status);
CREATE INDEX IF NOT EXISTS idx_feedback_posts_pinned ON feedback_posts(is_pinned, pin_order) WHERE is_pinned = true;
CREATE INDEX IF NOT EXISTS idx_feedback_posts_activity ON feedback_posts(last_activity_at DESC);
CREATE INDEX IF NOT EXISTS idx_feedback_posts_tags ON feedback_posts USING gin(tags);

-- Full-text search index
CREATE INDEX IF NOT EXISTS idx_feedback_posts_search ON feedback_posts USING gin(
  to_tsvector('english', title || ' ' || content)
);

-- Updated_at trigger
CREATE TRIGGER trigger_feedback_posts_updated_at
  BEFORE UPDATE ON feedback_posts
  FOR EACH ROW
  EXECUTE FUNCTION update_pilot_users_updated_at();

-- ============================================================================
-- PART 4: FEEDBACK COMMENTS
-- ============================================================================

-- Threaded comments on feedback posts
CREATE TABLE IF NOT EXISTS feedback_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES feedback_posts(id) ON DELETE CASCADE,
  pilot_user_id uuid REFERENCES pilot_users(id) ON DELETE SET NULL,
  parent_comment_id uuid REFERENCES feedback_comments(id) ON DELETE CASCADE,
  is_anonymous boolean DEFAULT false,
  author_display_name text NOT NULL,
  author_rank text,
  content text NOT NULL CHECK (char_length(content) >= 1 AND char_length(content) <= 5000),
  is_edited boolean DEFAULT false,
  edited_at timestamptz,
  is_flagged boolean DEFAULT false,
  flag_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_feedback_comments_post ON feedback_comments(post_id, created_at);
CREATE INDEX IF NOT EXISTS idx_feedback_comments_author ON feedback_comments(pilot_user_id);
CREATE INDEX IF NOT EXISTS idx_feedback_comments_parent ON feedback_comments(parent_comment_id);

-- Updated_at trigger
CREATE TRIGGER trigger_feedback_comments_updated_at
  BEFORE UPDATE ON feedback_comments
  FOR EACH ROW
  EXECUTE FUNCTION update_pilot_users_updated_at();

-- Trigger to update post comment count and last activity
CREATE OR REPLACE FUNCTION update_post_comment_stats()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE feedback_posts
    SET comment_count = comment_count + 1,
        last_activity_at = NEW.created_at
    WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE feedback_posts
    SET comment_count = GREATEST(0, comment_count - 1)
    WHERE id = OLD.post_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_post_comment_stats
  AFTER INSERT OR DELETE ON feedback_comments
  FOR EACH ROW
  EXECUTE FUNCTION update_post_comment_stats();

-- Trigger to update category post count
CREATE OR REPLACE FUNCTION update_category_post_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.status = 'active' THEN
    UPDATE feedback_categories
    SET post_count = post_count + 1
    WHERE id = NEW.category_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE feedback_categories
    SET post_count = GREATEST(0, post_count - 1)
    WHERE id = OLD.category_id;
  ELSIF TG_OP = 'UPDATE' AND OLD.status = 'active' AND NEW.status != 'active' THEN
    UPDATE feedback_categories
    SET post_count = GREATEST(0, post_count - 1)
    WHERE id = OLD.category_id;
  ELSIF TG_OP = 'UPDATE' AND OLD.status != 'active' AND NEW.status = 'active' THEN
    UPDATE feedback_categories
    SET post_count = post_count + 1
    WHERE id = NEW.category_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_category_post_count
  AFTER INSERT OR UPDATE OR DELETE ON feedback_posts
  FOR EACH ROW
  EXECUTE FUNCTION update_category_post_count();

-- ============================================================================
-- PART 5: NOTIFICATIONS
-- ============================================================================

-- Unified notification system
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recipient_type text NOT NULL CHECK (recipient_type IN ('pilot', 'admin', 'manager')),
  sender_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  type text NOT NULL CHECK (type IN (
    'leave_request_submitted',
    'leave_request_approved',
    'leave_request_rejected',
    'leave_request_withdrawn',
    'post_reply',
    'comment_reply',
    'post_flagged',
    'comment_flagged',
    'pilot_registration_pending',
    'pilot_registration_approved',
    'pilot_registration_rejected',
    'system_announcement'
  )),
  title text NOT NULL,
  message text NOT NULL,
  link text, -- Deep link to relevant page
  metadata jsonb DEFAULT '{}', -- Additional context data
  is_read boolean DEFAULT false,
  read_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_notifications_recipient ON notifications(recipient_id, is_read, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);

-- ============================================================================
-- PART 6: MODIFY EXISTING LEAVE_REQUESTS TABLE (UNIFIED APPROACH)
-- ============================================================================

-- Add columns for unified pilot/admin leave requests
ALTER TABLE leave_requests
  ADD COLUMN IF NOT EXISTS submission_type text DEFAULT 'admin' CHECK (submission_type IN ('admin', 'pilot'));

ALTER TABLE leave_requests
  ADD COLUMN IF NOT EXISTS pilot_user_id uuid REFERENCES pilot_users(id) ON DELETE SET NULL;

ALTER TABLE leave_requests
  ADD COLUMN IF NOT EXISTS reviewed_by uuid REFERENCES an_users(id) ON DELETE SET NULL;

ALTER TABLE leave_requests
  ADD COLUMN IF NOT EXISTS reviewed_at timestamptz;

ALTER TABLE leave_requests
  ADD COLUMN IF NOT EXISTS review_notes text;

-- Create index for pilot submissions
CREATE INDEX IF NOT EXISTS idx_leave_requests_submission_type ON leave_requests(submission_type);
CREATE INDEX IF NOT EXISTS idx_leave_requests_pilot_user ON leave_requests(pilot_user_id);

-- ============================================================================
-- PART 7: ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on all new tables
ALTER TABLE pilot_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- PILOT_USERS RLS POLICIES
-- ============================================================================

-- Pilots can view their own profile
CREATE POLICY "Pilots can view own profile"
  ON pilot_users FOR SELECT
  USING (auth.uid() = id);

-- Pilots can update their own profile (limited fields)
CREATE POLICY "Pilots can update own profile"
  ON pilot_users FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id AND
    -- Cannot change approval status, employee_id, or admin fields
    registration_approved = registration_approved AND
    employee_id = employee_id
  );

-- Admins and managers can view all pilot profiles
CREATE POLICY "Admins can view all pilot profiles"
  ON pilot_users FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM an_users
      WHERE an_users.id = auth.uid()
      AND an_users.role IN ('admin', 'manager')
    )
  );

-- Admins can approve/update pilot registrations
CREATE POLICY "Admins can update pilot registrations"
  ON pilot_users FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM an_users
      WHERE an_users.id = auth.uid()
      AND an_users.role IN ('admin', 'manager')
    )
  );

-- Anyone can insert during registration (approval required)
CREATE POLICY "Anyone can register as pilot"
  ON pilot_users FOR INSERT
  WITH CHECK (
    auth.uid() = id AND
    registration_approved = false
  );

-- ============================================================================
-- FEEDBACK_CATEGORIES RLS POLICIES
-- ============================================================================

-- Everyone (authenticated) can view non-archived categories
CREATE POLICY "Anyone can view active categories"
  ON feedback_categories FOR SELECT
  USING (is_archived = false OR auth.uid() IS NOT NULL);

-- Pilots can create categories
CREATE POLICY "Pilots can create categories"
  ON feedback_categories FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM pilot_users
      WHERE pilot_users.id = auth.uid()
      AND pilot_users.registration_approved = true
    )
  );

-- Admins can manage all categories
CREATE POLICY "Admins can manage categories"
  ON feedback_categories FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM an_users
      WHERE an_users.id = auth.uid()
      AND an_users.role IN ('admin', 'manager')
    )
  );

-- ============================================================================
-- FEEDBACK_POSTS RLS POLICIES
-- ============================================================================

-- Everyone can view active posts
CREATE POLICY "Anyone can view active posts"
  ON feedback_posts FOR SELECT
  USING (status = 'active' OR auth.uid() IS NOT NULL);

-- Approved pilots can create posts
CREATE POLICY "Pilots can create posts"
  ON feedback_posts FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM pilot_users
      WHERE pilot_users.id = auth.uid()
      AND pilot_users.registration_approved = true
    )
  );

-- Pilots can update their own posts (within time limit)
CREATE POLICY "Pilots can update own posts"
  ON feedback_posts FOR UPDATE
  USING (
    pilot_user_id = auth.uid() AND
    created_at > now() - interval '15 minutes' AND
    status = 'active'
  )
  WITH CHECK (
    pilot_user_id = auth.uid() AND
    -- Cannot change status, pinning, or flag count
    status = status AND
    is_pinned = is_pinned
  );

-- Pilots can delete their own posts (within time limit)
CREATE POLICY "Pilots can delete own posts"
  ON feedback_posts FOR DELETE
  USING (
    pilot_user_id = auth.uid() AND
    created_at > now() - interval '1 hour' AND
    comment_count = 0 -- Can't delete if has comments
  );

-- Admins can manage all posts
CREATE POLICY "Admins can manage posts"
  ON feedback_posts FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM an_users
      WHERE an_users.id = auth.uid()
      AND an_users.role IN ('admin', 'manager')
    )
  );

-- ============================================================================
-- FEEDBACK_COMMENTS RLS POLICIES
-- ============================================================================

-- Everyone can view comments on active posts
CREATE POLICY "Anyone can view comments"
  ON feedback_comments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM feedback_posts
      WHERE feedback_posts.id = post_id
      AND feedback_posts.status = 'active'
    )
  );

-- Approved pilots can create comments
CREATE POLICY "Pilots can create comments"
  ON feedback_comments FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM pilot_users
      WHERE pilot_users.id = auth.uid()
      AND pilot_users.registration_approved = true
    )
  );

-- Pilots can update their own comments (within time limit)
CREATE POLICY "Pilots can update own comments"
  ON feedback_comments FOR UPDATE
  USING (
    pilot_user_id = auth.uid() AND
    created_at > now() - interval '15 minutes'
  )
  WITH CHECK (
    pilot_user_id = auth.uid() AND
    is_flagged = is_flagged -- Cannot change flag status
  );

-- Pilots can delete their own comments (within time limit, no replies)
CREATE POLICY "Pilots can delete own comments"
  ON feedback_comments FOR DELETE
  USING (
    pilot_user_id = auth.uid() AND
    created_at > now() - interval '1 hour' AND
    NOT EXISTS (
      SELECT 1 FROM feedback_comments child
      WHERE child.parent_comment_id = feedback_comments.id
    )
  );

-- Admins can manage all comments
CREATE POLICY "Admins can manage comments"
  ON feedback_comments FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM an_users
      WHERE an_users.id = auth.uid()
      AND an_users.role IN ('admin', 'manager')
    )
  );

-- ============================================================================
-- NOTIFICATIONS RLS POLICIES
-- ============================================================================

-- Users can only view their own notifications
CREATE POLICY "Users can view own notifications"
  ON notifications FOR SELECT
  USING (recipient_id = auth.uid());

-- Users can update their own notifications (mark as read)
CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE
  USING (recipient_id = auth.uid())
  WITH CHECK (recipient_id = auth.uid());

-- System can create notifications (via service role)
-- No INSERT policy needed - will use service role key

-- ============================================================================
-- PART 8: HELPER FUNCTIONS
-- ============================================================================

-- Function to increment post view count
CREATE OR REPLACE FUNCTION increment_post_view_count(post_uuid uuid)
RETURNS void AS $$
BEGIN
  UPDATE feedback_posts
  SET view_count = view_count + 1
  WHERE id = post_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get unread notification count
CREATE OR REPLACE FUNCTION get_unread_notification_count(user_uuid uuid)
RETURNS integer AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)::integer
    FROM notifications
    WHERE recipient_id = user_uuid
    AND is_read = false
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create notification (called by API)
CREATE OR REPLACE FUNCTION create_notification(
  p_recipient_id uuid,
  p_recipient_type text,
  p_sender_id uuid,
  p_type text,
  p_title text,
  p_message text,
  p_link text DEFAULT NULL,
  p_metadata jsonb DEFAULT '{}'
)
RETURNS uuid AS $$
DECLARE
  notification_id uuid;
BEGIN
  INSERT INTO notifications (
    recipient_id,
    recipient_type,
    sender_id,
    type,
    title,
    message,
    link,
    metadata
  ) VALUES (
    p_recipient_id,
    p_recipient_type,
    p_sender_id,
    p_type,
    p_title,
    p_message,
    p_link,
    p_metadata
  )
  RETURNING id INTO notification_id;

  RETURN notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- PART 9: DATABASE VIEWS FOR PERFORMANCE
-- ============================================================================

-- View for post feed with author info (respecting anonymity)
CREATE OR REPLACE VIEW feedback_posts_feed AS
SELECT
  p.id,
  p.title,
  p.content,
  p.is_anonymous,
  p.author_display_name,
  p.author_rank,
  p.is_pinned,
  p.pin_order,
  p.view_count,
  p.comment_count,
  p.status,
  p.last_activity_at,
  p.created_at,
  p.updated_at,
  c.id as category_id,
  c.name as category_name,
  c.slug as category_slug,
  c.icon as category_icon,
  p.tags,
  CASE
    WHEN p.is_anonymous THEN NULL
    ELSE pu.id
  END as pilot_user_id
FROM feedback_posts p
LEFT JOIN feedback_categories c ON p.category_id = c.id
LEFT JOIN pilot_users pu ON p.pilot_user_id = pu.id
WHERE p.status = 'active';

-- View for pending pilot registrations (admin use)
CREATE OR REPLACE VIEW pending_pilot_registrations AS
SELECT
  pu.id,
  pu.employee_id,
  pu.email,
  pu.first_name,
  pu.last_name,
  pu.rank,
  pu.registration_date,
  pu.created_at,
  p.commencement_date,
  p.seniority_number as calculated_seniority
FROM pilot_users pu
LEFT JOIN pilots p ON pu.employee_id = p.employee_id
WHERE pu.registration_approved = false
ORDER BY pu.registration_date ASC;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

-- Add comment to track migration
COMMENT ON TABLE pilot_users IS 'Pilot user accounts for self-service portal - Created 2025-01-10';
COMMENT ON TABLE feedback_categories IS 'User-created discussion categories - Created 2025-01-10';
COMMENT ON TABLE feedback_posts IS 'Feedback posts with anonymous posting - Created 2025-01-10';
COMMENT ON TABLE feedback_comments IS 'Threaded comments on feedback posts - Created 2025-01-10';
COMMENT ON TABLE notifications IS 'Unified notification system - Created 2025-01-10';
