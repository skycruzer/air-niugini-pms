# Pilot Self-Service Portal & Feedback Platform

**Version**: 1.0
**Date**: October 2025
**Author**: Development Team

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Features](#features)
4. [User Flows](#user-flows)
5. [Technical Implementation](#technical-implementation)
6. [Security & Privacy](#security--privacy)
7. [API Reference](#api-reference)
8. [Admin Guide](#admin-guide)
9. [Deployment](#deployment)

---

## Overview

The Pilot Self-Service Portal and Feedback Platform extends the B767 Pilot Management System with pilot-facing features, enabling pilots to:

- **Self-register** for portal access
- **Submit leave requests** directly
- **Share feedback and suggestions** via a Facebook-style platform
- **Engage in discussions** with threaded comments

Administrators gain:

- **Registration approval workflow** for new pilots
- **Feedback moderation tools** with full visibility
- **Enhanced pilot engagement** and operational insights

### Key Objectives

1. **Empower Pilots**: Self-service for common tasks
2. **Improve Communication**: Structured feedback and discussions
3. **Maintain Security**: Admin oversight with RLS policies
4. **Preserve Privacy**: Anonymous posting with audit trails

---

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    CLIENT LAYER                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │ Pilot Portal │  │ Admin Dashboard│ │ Mobile View  │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│                   API LAYER (Next.js)                   │
│  /api/pilot/*              /api/admin/*                 │
│  - register                - pilot-registrations        │
│  - leave                   - feedback/posts             │
│  - feedback/*              - moderation                 │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│               SERVICE LAYER (TypeScript)                │
│  - pilot-registration-service.ts                        │
│  - pilot-leave-service.ts                               │
│  - feedback-service.ts                                  │
│  - feedback-admin-service.ts                            │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│          DATABASE LAYER (Supabase PostgreSQL)           │
│  Tables:                                                │
│  - pilot_users (auth + profile)                         │
│  - feedback_categories (pilot-created)                  │
│  - feedback_posts (with anonymity)                      │
│  - feedback_comments (threaded)                         │
│                                                         │
│  RLS Policies: Role-based access control               │
│  Triggers: Auto-update counts & timestamps             │
└─────────────────────────────────────────────────────────┘
```

### Database Schema

#### pilot_users
Links Supabase Auth users to pilot records with approval workflow.

```sql
CREATE TABLE pilot_users (
  id uuid PRIMARY KEY REFERENCES auth.users(id),
  employee_id text UNIQUE REFERENCES pilots(employee_id),
  email text UNIQUE NOT NULL,
  first_name text NOT NULL,
  last_name text NOT NULL,
  rank text NOT NULL CHECK (rank IN ('Captain', 'First Officer')),
  seniority_number integer,
  registration_approved boolean DEFAULT false,
  email_confirmed boolean DEFAULT false,
  approved_at timestamptz,
  approved_by uuid REFERENCES an_users(id),
  rejection_reason text,
  last_login_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

#### feedback_categories
Pilot-created discussion categories.

```sql
CREATE TABLE feedback_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  slug text UNIQUE NOT NULL,
  description text,
  icon text DEFAULT '💬',
  created_by uuid REFERENCES pilot_users(id),
  created_by_type text DEFAULT 'pilot',
  is_default boolean DEFAULT false,
  is_archived boolean DEFAULT false,
  post_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

#### feedback_posts
Posts with anonymous option and admin visibility.

```sql
CREATE TABLE feedback_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pilot_user_id uuid NOT NULL REFERENCES pilot_users(id),
  category_id uuid NOT NULL REFERENCES feedback_categories(id),
  is_anonymous boolean DEFAULT false,
  author_display_name text NOT NULL,
  author_rank text,
  title text NOT NULL CHECK (char_length(title) >= 10),
  content text NOT NULL CHECK (char_length(content) >= 20),
  tags text[] DEFAULT '{}',
  status text DEFAULT 'active' CHECK (status IN ('active', 'archived', 'removed')),
  is_pinned boolean DEFAULT false,
  view_count integer DEFAULT 0,
  comment_count integer DEFAULT 0,
  last_activity_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

#### feedback_comments
Threaded comments with soft delete.

```sql
CREATE TABLE feedback_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES feedback_posts(id) ON DELETE CASCADE,
  pilot_user_id uuid NOT NULL REFERENCES pilot_users(id),
  parent_comment_id uuid REFERENCES feedback_comments(id) ON DELETE CASCADE,
  author_name text NOT NULL,
  author_rank text,
  content text NOT NULL CHECK (char_length(content) >= 1),
  deleted_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

---

## Features

### 1. Pilot Registration

**Self-Service Registration**
- Employee ID validation against pilots table
- Email verification via Supabase Auth
- Password strength requirements (8+ chars, upper, lower, digit)
- Auto-populated seniority from pilots table
- Success screen with next steps

**Admin Approval Workflow**
- Dashboard showing pending registrations
- Email confirmation status
- Approve/reject actions
- Rejection reason collection
- Email notifications (via Supabase Auth)

### 2. Leave Request Management

**Pilot Submission**
- Leave type selection (RDO, SDO, ANNUAL, SICK, LSL, LWOP, MATERNITY, COMPASSIONATE)
- Date range with 28-day roster period validation
- Late request warning (< 21 days notice)
- Optional reason field
- Real-time status tracking

**Request Features**
- View all requests with status
- Cancel pending requests
- Statistics (total, pending, approved, denied)
- Integration with existing admin leave management

### 3. Feedback Platform

**Category Management**
- Pilot-created categories
- Icon selection (12 default + custom)
- Slug auto-generation
- Post count tracking

**Post Creation**
- Anonymous posting option
- Title (10-200 chars) and content (20-5000 chars)
- Tag support (up to 5 tags)
- Category selection
- Rich text preview

**Threaded Comments**
- Top-level comments
- Nested replies
- Real author display
- 1-hour deletion window
- Auto-update comment counts

**Post Features**
- View count auto-increment
- Pinned posts
- Status management (active/archived/removed)
- Last activity tracking
- Search by title/content/tags

### 4. Admin Moderation

**Feedback Moderation Dashboard**
- View all posts with real identity
- See anonymous authors (admin only)
- Pin/unpin posts
- Archive/activate posts
- Remove inappropriate content
- Statistics (total, active, pinned, anonymous, archived)

**Visibility Controls**
- Pilots see: Anonymous Pilot (if anonymous)
- Admins see: Real name + "Displayed as: Anonymous Pilot"
- Audit trail maintained for all actions

---

## User Flows

### Pilot Registration Flow

```
1. Pilot visits /pilot/register
2. Enters employee ID
   └─> System validates against pilots table
3. Enters email, password, name, rank
   └─> Zod validation (client + server)
4. Submits registration
   └─> Creates auth.users entry
   └─> Creates pilot_users entry (registration_approved = false)
   └─> Sends email verification
5. Shows success screen
   └─> Instructions to verify email
   └─> Wait for admin approval
6. Admin approves/rejects
   └─> Updates registration_approved
   └─> Sends notification email
7. Pilot can log in (if approved)
```

### Leave Request Flow

```
1. Pilot logs in to /pilot/leave
2. Clicks "Request Leave"
3. Fills form:
   - Request type
   - Start/end dates
   - Reason (optional)
4. System validates:
   - Date format
   - Start < End
   - Roster period boundaries
   - Late request check (< 21 days)
5. Submits request
   └─> Creates entry in leave_requests
   └─> submission_type = 'pilot'
   └─> Links to pilots table via employee_id
6. Request appears in admin dashboard
7. Admin approves/denies
8. Pilot sees updated status
```

### Feedback Post Flow

```
1. Pilot visits /pilot/feedback
2. Selects category (or creates new)
3. Clicks "New Post"
4. Fills form:
   - Category
   - Title
   - Content
   - Tags (optional)
   - Anonymous toggle
5. Submits post
   └─> Creates feedback_posts entry
   └─> author_display_name = "Anonymous Pilot" OR real name
   └─> Always stores pilot_user_id for audit
6. Post appears in feed
7. Other pilots comment
8. Admin can moderate (pin, archive, remove)
```

---

## Technical Implementation

### Service Layer Pattern

**Critical Pattern**: All business logic in service files, never direct DB calls in API routes.

```typescript
// ✅ CORRECT - Service layer
// src/lib/feedback-service.ts
export async function createFeedbackPost(pilotUserId: string, data: {...}) {
  const supabaseAdmin = getSupabaseAdmin();

  // Get pilot details
  const { data: pilotUser } = await supabaseAdmin
    .from('pilot_users')
    .select('first_name, last_name, rank')
    .eq('id', pilotUserId)
    .single();

  // Set display name
  const authorDisplayName = data.is_anonymous
    ? 'Anonymous Pilot'
    : `${pilotUser.first_name} ${pilotUser.last_name}`;

  // Create post
  const { data: newPost } = await supabaseAdmin
    .from('feedback_posts')
    .insert({ ...data, author_display_name: authorDisplayName })
    .select()
    .single();

  return { success: true, postId: newPost.id };
}

// API route calls service
// src/app/api/pilot/feedback/posts/route.ts
export async function POST(request: NextRequest) {
  const result = await createFeedbackPost(pilotUserId, validatedData);
  return NextResponse.json(result);
}
```

### Authentication Pattern

**Separate Pilot Authentication**

```typescript
// src/lib/pilot-auth-utils.ts
class PilotAuthService {
  async login(email: string, password: string) {
    // 1. Sign in with Supabase Auth
    const { data: { session } } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    // 2. Get pilot_users record
    const { data: pilotUser } = await supabase
      .from('pilot_users')
      .select('*')
      .eq('id', session.user.id)
      .single();

    // 3. Check if approved
    if (!pilotUser.registration_approved) {
      throw new Error('Registration pending approval');
    }

    // 4. Update last login
    await supabase
      .from('pilot_users')
      .update({ last_login_at: new Date().toISOString() })
      .eq('id', session.user.id);

    // 5. Store session
    return pilotUser;
  }
}
```

### Anonymous Posting Implementation

**Database Level**
```sql
-- feedback_posts table always stores pilot_user_id
-- is_anonymous boolean controls display

-- Pilots view (hides pilot_user_id for anonymous posts)
CREATE VIEW feedback_posts_feed AS
SELECT
  id, category_id,
  CASE
    WHEN is_anonymous THEN NULL
    ELSE pilot_user_id
  END as pilot_user_id,
  author_display_name,
  author_rank,
  title, content, tags,
  view_count, comment_count,
  created_at
FROM feedback_posts
WHERE status = 'active';
```

**Application Level**
```typescript
// Create post with anonymous option
const postData = {
  pilot_user_id: pilotUserId, // Always stored
  is_anonymous: data.is_anonymous,
  author_display_name: data.is_anonymous
    ? 'Anonymous Pilot'
    : `${firstName} ${lastName}`,
  author_rank: data.is_anonymous ? null : rank,
  // ...
};
```

**Admin Visibility**
```typescript
// Admin service shows real identity
export async function getAllFeedbackPostsAdmin() {
  const { data } = await supabase
    .from('feedback_posts')
    .select(`
      *,
      pilot_users!inner (first_name, last_name, rank, employee_id)
    `);

  return data.map(post => ({
    ...post,
    real_author_name: `${post.pilot_users.first_name} ${post.pilot_users.last_name}`,
    real_author_rank: post.pilot_users.rank,
    // Displayed to admins even if is_anonymous = true
  }));
}
```

### Database Triggers

**Auto-Update Comment Count**
```sql
CREATE OR REPLACE FUNCTION update_post_comment_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE feedback_posts
    SET comment_count = comment_count + 1,
        last_activity_at = now()
    WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE feedback_posts
    SET comment_count = GREATEST(comment_count - 1, 0)
    WHERE id = OLD.post_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_post_comment_count
AFTER INSERT OR DELETE ON feedback_comments
FOR EACH ROW EXECUTE FUNCTION update_post_comment_count();
```

**Auto-Update Category Post Count**
```sql
CREATE OR REPLACE FUNCTION update_category_post_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE feedback_categories
    SET post_count = post_count + 1
    WHERE id = NEW.category_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE feedback_categories
    SET post_count = GREATEST(post_count - 1, 0)
    WHERE id = OLD.category_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_category_post_count
AFTER INSERT OR DELETE ON feedback_posts
FOR EACH ROW EXECUTE FUNCTION update_category_post_count();
```

---

## Security & Privacy

### Row Level Security (RLS)

**pilot_users**
```sql
-- Pilots can read their own record
CREATE POLICY "Pilots can read own record"
ON pilot_users FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- Admins can read all
CREATE POLICY "Admins can read all pilot users"
ON pilot_users FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM an_users
    WHERE email = auth.email()
    AND role = 'admin'
  )
);
```

**feedback_categories**
```sql
-- Anyone can read active categories
CREATE POLICY "Anyone can read active categories"
ON feedback_categories FOR SELECT
TO authenticated
USING (is_archived = false);

-- Approved pilots can create categories
CREATE POLICY "Approved pilots can create categories"
ON feedback_categories FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM pilot_users
    WHERE id = auth.uid()
    AND registration_approved = true
  )
);
```

**feedback_posts**
```sql
-- Anyone can read active posts
CREATE POLICY "Anyone can read active posts"
ON feedback_posts FOR SELECT
TO authenticated
USING (status = 'active');

-- Admins can read all posts
CREATE POLICY "Admins can read all posts"
ON feedback_posts FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM an_users
    WHERE email = auth.email()
    AND role IN ('admin', 'manager')
  )
);

-- Approved pilots can create posts
CREATE POLICY "Approved pilots can create posts"
ON feedback_posts FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM pilot_users
    WHERE id = auth.uid()
    AND registration_approved = true
  )
);

-- Authors can edit own posts (15 min window)
CREATE POLICY "Authors can edit own posts"
ON feedback_posts FOR UPDATE
TO authenticated
USING (
  pilot_user_id = auth.uid()
  AND created_at > now() - interval '15 minutes'
)
WITH CHECK (
  pilot_user_id = auth.uid()
);
```

**feedback_comments**
```sql
-- Anyone can read non-deleted comments
CREATE POLICY "Anyone can read non-deleted comments"
ON feedback_comments FOR SELECT
TO authenticated
USING (deleted_at IS NULL);

-- Approved pilots can create comments
CREATE POLICY "Approved pilots can create comments"
ON feedback_comments FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM pilot_users
    WHERE id = auth.uid()
    AND registration_approved = true
  )
);

-- Authors can soft-delete own comments (1 hour window)
CREATE POLICY "Authors can delete own comments"
ON feedback_comments FOR UPDATE
TO authenticated
USING (
  pilot_user_id = auth.uid()
  AND created_at > now() - interval '1 hour'
  AND deleted_at IS NULL
)
WITH CHECK (pilot_user_id = auth.uid());
```

### Privacy Protection

1. **Anonymous Posting**
   - `is_anonymous` boolean flag
   - `author_display_name` shown to pilots
   - `pilot_user_id` always stored (admin visibility)
   - RLS policies enforce visibility rules

2. **Audit Trail**
   - All actions logged to pilot_user_id
   - Admins can see real identity
   - Timestamp tracking on all records

3. **Data Deletion**
   - Soft delete for comments
   - Content changed to "[Comment deleted by author]"
   - Original author and timestamp preserved

---

## API Reference

### Pilot APIs

#### POST /api/pilot/register
Register new pilot account.

**Request Body:**
```json
{
  "employee_id": "P12345",
  "email": "pilot@airniugini.com",
  "password": "SecurePass123",
  "confirmPassword": "SecurePass123",
  "first_name": "John",
  "last_name": "Doe",
  "rank": "Captain"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Registration successful",
  "userId": "uuid"
}
```

#### POST /api/pilot/leave
Submit leave request.

**Request Body:**
```json
{
  "request_type": "ANNUAL",
  "start_date": "2025-11-01",
  "end_date": "2025-11-14",
  "reason": "Family vacation"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Leave request submitted successfully",
  "requestId": "uuid"
}
```

#### GET /api/pilot/leave
Get all leave requests for authenticated pilot.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "request_type": "ANNUAL",
      "start_date": "2025-11-01",
      "end_date": "2025-11-14",
      "status": "PENDING",
      "days_count": 14,
      "is_late_request": false,
      "created_at": "2025-10-11T12:00:00Z"
    }
  ]
}
```

#### DELETE /api/pilot/leave/[id]
Cancel pending leave request.

**Response:**
```json
{
  "success": true,
  "message": "Leave request canceled successfully"
}
```

#### POST /api/pilot/feedback/categories
Create feedback category.

**Request Body:**
```json
{
  "name": "Flight Operations",
  "description": "Discuss flight operations, procedures, and best practices",
  "icon": "✈️"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Category created successfully",
  "categoryId": "uuid"
}
```

#### GET /api/pilot/feedback/categories
Get all active categories.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "Flight Operations",
      "slug": "flight-operations",
      "description": "...",
      "icon": "✈️",
      "post_count": 15
    }
  ]
}
```

#### POST /api/pilot/feedback/posts
Create feedback post.

**Request Body:**
```json
{
  "category_id": "uuid",
  "title": "Suggestion for improved pre-flight briefings",
  "content": "I'd like to suggest...",
  "is_anonymous": false,
  "tags": ["briefing", "safety", "procedures"]
}
```

**Response:**
```json
{
  "success": true,
  "message": "Post created successfully",
  "postId": "uuid"
}
```

#### GET /api/pilot/feedback/posts
Get feedback posts (optionally filtered).

**Query Parameters:**
- `category_id` (optional): Filter by category
- `limit` (optional): Max results (default 50)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "category_id": "uuid",
      "category_name": "Flight Operations",
      "category_icon": "✈️",
      "title": "Suggestion for improved pre-flight briefings",
      "content": "...",
      "author_display_name": "John Doe",
      "author_rank": "Captain",
      "is_anonymous": false,
      "is_pinned": false,
      "view_count": 42,
      "comment_count": 5,
      "tags": ["briefing", "safety"],
      "created_at": "2025-10-11T12:00:00Z"
    }
  ]
}
```

#### GET /api/pilot/feedback/posts/[id]
Get single post (increments view count).

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "title": "...",
    "content": "...",
    // ... full post details
  }
}
```

#### POST /api/pilot/feedback/posts/[id]/comments
Create comment on post.

**Request Body:**
```json
{
  "content": "Great suggestion! I agree that...",
  "parent_comment_id": "uuid" // Optional, for replies
}
```

**Response:**
```json
{
  "success": true,
  "message": "Comment created successfully",
  "commentId": "uuid"
}
```

#### GET /api/pilot/feedback/posts/[id]/comments
Get all comments for post.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "post_id": "uuid",
      "parent_comment_id": null,
      "author_name": "Jane Smith",
      "author_rank": "First Officer",
      "content": "Great suggestion!",
      "created_at": "2025-10-11T13:00:00Z"
    }
  ]
}
```

#### DELETE /api/pilot/feedback/comments/[id]
Delete own comment (within 1 hour).

**Response:**
```json
{
  "success": true,
  "message": "Comment deleted successfully"
}
```

### Admin APIs

#### GET /api/admin/pilot-registrations
Get all pending registrations.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "employee_id": "P12345",
      "email": "pilot@airniugini.com",
      "first_name": "John",
      "last_name": "Doe",
      "rank": "Captain",
      "seniority_number": 5,
      "email_confirmed": true,
      "created_at": "2025-10-11T12:00:00Z"
    }
  ]
}
```

#### PATCH /api/admin/pilot-registrations/[id]
Approve or reject registration.

**Request Body (Approve):**
```json
{
  "action": "approve"
}
```

**Request Body (Reject):**
```json
{
  "action": "reject",
  "rejection_reason": "Employee ID not found in system"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Registration approved successfully"
}
```

#### GET /api/admin/feedback/posts
Get all posts with admin visibility.

**Query Parameters:**
- `category_id` (optional): Filter by category
- `include_stats` (optional): Include statistics

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "title": "...",
      "author_display_name": "Anonymous Pilot",
      "real_author_name": "John Doe", // Admin only
      "real_author_rank": "Captain",
      "real_author_employee_id": "P12345",
      "is_anonymous": true,
      // ... other fields
    }
  ],
  "stats": {
    "total_posts": 50,
    "active_posts": 45,
    "pinned_posts": 3,
    "anonymous_posts": 12,
    "archived_posts": 5,
    "total_comments": 234
  }
}
```

#### PATCH /api/admin/feedback/posts/[id]
Moderate post.

**Request Body:**
```json
{
  "action": "pin" // or "unpin", "archive", "activate", "remove"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Post pinned successfully"
}
```

---

## Admin Guide

### Approving Pilot Registrations

1. Navigate to **Admin → Pilot Registrations**
2. Review pending registrations:
   - Check employee ID matches pilots table
   - Verify email confirmation status
   - Review seniority number assignment
3. Actions:
   - **Approve**: Grants pilot portal access
   - **Reject**: Provide reason (sent via email)
4. Pilot receives email notification
5. Approved pilots can log in to /pilot/login

### Moderating Feedback

1. Navigate to **Admin → Feedback Moderation**
2. View all posts with full visibility:
   - See real author behind anonymous posts
   - Check post status (active/archived/removed)
   - Review engagement (views, comments)
3. Moderation actions:
   - **Pin**: Highlight important discussions
   - **Archive**: Hide from pilot view
   - **Activate**: Restore archived posts
   - **Remove**: Permanent removal (use sparingly)
4. Best practices:
   - Review anonymous posts for policy compliance
   - Pin constructive feedback
   - Archive resolved discussions
   - Respond to actionable suggestions

### Statistics Dashboard

**Pilot Registrations:**
- Pending count
- Email confirmed count
- Awaiting confirmation count

**Feedback Platform:**
- Total posts
- Active posts
- Pinned posts
- Anonymous posts
- Archived posts
- Total comments

---

## Deployment

### Prerequisites

1. **Database Migration Applied**
   ```bash
   # Via Supabase MCP or deploy script
   node deploy-pilot-portal-migration.js
   ```

2. **Environment Variables Set**
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
   SUPABASE_SERVICE_ROLE_KEY=eyJ...
   ```

3. **Email Configuration**
   - Supabase Auth emails enabled
   - Email templates customized (optional)

### Deployment Checklist

- [ ] Database migration applied
- [ ] RLS policies enabled
- [ ] Database triggers created
- [ ] Environment variables configured
- [ ] Email templates reviewed
- [ ] Admin users have correct roles
- [ ] Test pilot registration flow
- [ ] Test leave request submission
- [ ] Test feedback post creation
- [ ] Test admin approval workflow
- [ ] Test moderation features
- [ ] Verify anonymous posting privacy
- [ ] Check mobile responsiveness
- [ ] Run security audit
- [ ] Deploy to production
- [ ] Monitor for errors
- [ ] Train admin users
- [ ] Announce to pilots

### Post-Deployment

1. **Monitor Registration Queue**
   - Check daily for new registrations
   - Aim for 24-hour approval turnaround

2. **Review Feedback Activity**
   - Weekly review of new posts
   - Pin notable discussions
   - Archive resolved topics

3. **Performance Monitoring**
   - Database query performance
   - API response times
   - User engagement metrics

4. **User Feedback**
   - Collect pilot feedback on portal
   - Iterate on UX improvements
   - Add requested features

---

## Appendix

### Folder Structure

```
src/
├── app/
│   ├── api/
│   │   ├── pilot/
│   │   │   ├── register/route.ts
│   │   │   ├── leave/route.ts
│   │   │   ├── leave/[id]/route.ts
│   │   │   └── feedback/
│   │   │       ├── categories/route.ts
│   │   │       ├── posts/route.ts
│   │   │       ├── posts/[id]/route.ts
│   │   │       ├── posts/[id]/comments/route.ts
│   │   │       └── comments/[id]/route.ts
│   │   └── admin/
│   │       ├── pilot-registrations/route.ts
│   │       ├── pilot-registrations/[id]/route.ts
│   │       └── feedback/
│   │           └── posts/
│   │               ├── route.ts
│   │               └── [id]/route.ts
│   ├── pilot/
│   │   ├── register/page.tsx
│   │   ├── login/page.tsx
│   │   ├── dashboard/
│   │   │   ├── layout.tsx
│   │   │   └── page.tsx
│   │   ├── leave/page.tsx
│   │   └── feedback/
│   │       ├── page.tsx
│   │       └── [id]/page.tsx
│   └── dashboard/
│       └── admin/
│           ├── pilot-registrations/page.tsx
│           └── feedback-moderation/page.tsx
├── components/
│   └── feedback/
│       ├── CreateCategoryModal.tsx
│       └── CreatePostModal.tsx
└── lib/
    ├── pilot-registration-service.ts
    ├── pilot-auth-utils.ts
    ├── pilot-leave-service.ts
    ├── feedback-service.ts
    └── feedback-admin-service.ts
```

### Database Views

**feedback_posts_feed** - Pilot view (hides anonymous authors)
```sql
CREATE VIEW feedback_posts_feed AS
SELECT
  id, category_id,
  CASE WHEN is_anonymous THEN NULL ELSE pilot_user_id END as pilot_user_id,
  author_display_name,
  CASE WHEN is_anonymous THEN NULL ELSE author_rank END as author_rank,
  title, content, tags,
  status, is_pinned,
  view_count, comment_count,
  created_at, last_activity_at
FROM feedback_posts
WHERE status = 'active';
```

### Future Enhancements

1. **Real-time Updates**
   - Supabase subscriptions for live comments
   - Notification badges for new activity

2. **Rich Text Editor**
   - Markdown support
   - Code syntax highlighting
   - Image embedding

3. **Advanced Search**
   - Full-text search
   - Filter by date range
   - Sort by relevance/date/popularity

4. **Gamification**
   - Contribution badges
   - Reputation system
   - Helpful votes

5. **Mobile App**
   - React Native companion app
   - Push notifications
   - Offline support

---

**Document Version**: 1.0
**Last Updated**: October 2025
**Status**: Production Ready

For technical support, contact the development team.
