# Deployment Checklist - Pilot Portal & Feedback Platform

**Project**: Air Niugini B767 Pilot Management System
**Feature**: Pilot Self-Service Portal & Feedback Platform
**Version**: 1.0
**Date**: October 2025

---

## Pre-Deployment (Development Environment)

### Database Setup

- [ ] **Apply Database Migration**
  ```bash
  # Using Supabase MCP tool
  mcp__supabase__apply_migration with migration file

  # OR using deploy script
  node deploy-pilot-portal-migration.js
  ```
  - File: `migrations/20250110_pilot_portal_and_feedback_platform.sql`
  - Tables created: `pilot_users`, `feedback_categories`, `feedback_posts`, `feedback_comments`

- [ ] **Verify RLS Policies**
  - Check all RLS policies are enabled
  - Test pilot access restrictions
  - Test admin access permissions
  - Verify anonymous post privacy

- [ ] **Verify Database Triggers**
  - Test `update_post_comment_count()` trigger
  - Test `update_category_post_count()` trigger
  - Test `update_post_view_count()` trigger
  - Test `increment_post_view_count()` function

- [ ] **Create Default Categories (Optional)**
  ```sql
  INSERT INTO feedback_categories (name, slug, description, icon, created_by_type, is_default)
  VALUES
    ('General Discussion', 'general-discussion', 'General topics and discussions', '💬', 'admin', true),
    ('Safety', 'safety', 'Safety concerns and suggestions', '🛡️', 'admin', true),
    ('Flight Operations', 'flight-operations', 'Operations procedures and best practices', '✈️', 'admin', true);
  ```

### Code Verification

- [ ] **TypeScript Compilation**
  ```bash
  npm run type-check
  ```
  - No TypeScript errors
  - All types properly defined

- [ ] **Linting**
  ```bash
  npm run lint
  ```
  - No ESLint errors
  - Code style consistent

- [ ] **Build Test**
  ```bash
  npm run build
  ```
  - Production build successful
  - No build warnings

### Environment Variables

- [ ] **Verify `.env.local`**
  ```env
  NEXT_PUBLIC_SUPABASE_URL=https://wgdmgvonqysflwdiiols.supabase.co
  NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
  SUPABASE_SERVICE_ROLE_KEY=eyJ...
  SUPABASE_PROJECT_ID=wgdmgvonqysflwdiiols
  ```

- [ ] **No Trailing Characters**
  - Verify no newlines or spaces at end of environment variables

### Feature Testing

#### Pilot Registration

- [ ] **Registration Flow**
  - Navigate to `/pilot/register`
  - Test employee ID validation
  - Test invalid employee ID (should fail)
  - Test email format validation
  - Test password strength requirements
  - Test password confirmation mismatch
  - Submit valid registration
  - Verify success screen displays
  - Check Supabase Auth for new user
  - Check `pilot_users` table for new record
  - Verify `registration_approved = false`

- [ ] **Email Verification**
  - Check email sent via Supabase Auth
  - Click verification link
  - Verify `email_confirmed = true` in `pilot_users`

#### Admin Registration Approval

- [ ] **Approval Dashboard**
  - Navigate to `/dashboard/admin/pilot-registrations`
  - Verify pending registration appears
  - Check statistics (pending, confirmed, awaiting)
  - Verify employee ID displayed correctly
  - Verify seniority number populated

- [ ] **Approve Registration**
  - Click "Approve" on pending registration
  - Confirm approval dialog
  - Verify success message
  - Check `registration_approved = true`
  - Check `approved_at` timestamp set
  - Verify registration removed from pending list

- [ ] **Reject Registration**
  - Create another test registration
  - Click "Reject"
  - Enter rejection reason
  - Confirm rejection
  - Verify email sent to pilot
  - Check `rejection_reason` stored

#### Pilot Login

- [ ] **Login Flow**
  - Navigate to `/pilot/login`
  - Test invalid credentials (should fail)
  - Test unapproved user (should fail with message)
  - Test approved user (should succeed)
  - Verify redirect to `/pilot/dashboard`
  - Check `last_login_at` updated

- [ ] **Session Management**
  - Verify session persists on page reload
  - Test logout functionality
  - Verify redirect to login page after logout

#### Leave Requests

- [ ] **Submit Leave Request**
  - Navigate to `/pilot/leave`
  - Click "Request Leave"
  - Fill out form with valid data
  - Test date validation (end < start should fail)
  - Test late request warning (< 21 days)
  - Submit request
  - Verify success message
  - Check request appears in table

- [ ] **View Leave Requests**
  - Verify statistics displayed (total, pending, approved, denied)
  - Verify table shows all requests
  - Check status badges (PENDING, APPROVED, DENIED)
  - Verify roster period displayed

- [ ] **Cancel Leave Request**
  - Click "Cancel" on pending request
  - Confirm cancellation dialog
  - Verify request removed from table
  - Verify deleted from database

- [ ] **Admin Integration**
  - Navigate to `/dashboard/leave`
  - Verify pilot-submitted requests appear
  - Check `submission_type = 'pilot'`
  - Test approve/deny functionality

#### Feedback Platform - Categories

- [ ] **View Categories**
  - Navigate to `/pilot/feedback`
  - Verify categories displayed
  - Check post counts accurate
  - Test "All Posts" filter

- [ ] **Create Category**
  - Click "New Category"
  - Select icon from grid
  - Test custom icon input
  - Enter category name and description
  - Submit category
  - Verify category appears in list
  - Check slug generated correctly

#### Feedback Platform - Posts

- [ ] **Create Post (Public)**
  - Click "New Post"
  - Select category
  - Enter title (test min 10 chars)
  - Enter content (test min 20 chars)
  - Add tags (comma-separated)
  - Leave anonymous toggle OFF
  - Submit post
  - Verify post appears in feed
  - Check author name displayed

- [ ] **Create Post (Anonymous)**
  - Click "New Post"
  - Select category
  - Enter title and content
  - Toggle anonymous ON
  - Verify preview shows "Anonymous Pilot"
  - Submit post
  - Verify post displays as "Anonymous Pilot"
  - Check purple anonymous badge

- [ ] **View Post Detail**
  - Click on a post
  - Verify view count incremented
  - Check full content displayed
  - Verify category badge shown
  - Check metadata (views, comments, date)

- [ ] **Search Posts**
  - Use search bar
  - Test search by title
  - Test search by content
  - Test search by tags
  - Verify results filtered correctly

#### Feedback Platform - Comments

- [ ] **Create Comment**
  - On post detail page
  - Enter comment content
  - Submit comment
  - Verify comment appears
  - Check comment count incremented

- [ ] **Reply to Comment**
  - Click "Reply" on existing comment
  - Enter reply content
  - Submit reply
  - Verify reply appears nested
  - Check indentation displayed

- [ ] **Delete Comment**
  - On recent comment (< 1 hour)
  - Click "Delete"
  - Confirm deletion
  - Verify content changed to "[Comment deleted by author]"
  - Verify `deleted_at` set

- [ ] **Delete Comment (After 1 Hour)**
  - Manually set comment `created_at` to > 1 hour ago
  - Attempt delete
  - Verify error message
  - Confirm 1-hour window enforced

#### Admin Moderation

- [ ] **View Moderation Dashboard**
  - Navigate to `/dashboard/admin/feedback-moderation`
  - Verify all posts displayed
  - Check statistics (total, active, pinned, anonymous, archived)
  - Verify real author shown for anonymous posts

- [ ] **Pin Post**
  - Click "Pin" on a post
  - Confirm action
  - Verify post has pin badge
  - Check post appears first in feed

- [ ] **Unpin Post**
  - Click "Unpin" on pinned post
  - Confirm action
  - Verify pin badge removed

- [ ] **Archive Post**
  - Click "Archive" on a post
  - Confirm action
  - Verify post status = archived
  - Verify post hidden from pilot view
  - Check orange archived badge in admin view

- [ ] **Activate Post**
  - On archived post, click "Activate"
  - Confirm action
  - Verify post status = active
  - Verify post visible to pilots again

### Performance Testing

- [ ] **Load Testing**
  - Test with 50+ posts
  - Test with 100+ comments
  - Verify page load times acceptable (<2 seconds)
  - Check database query performance

- [ ] **Concurrent Users**
  - Simulate multiple pilots logged in
  - Test simultaneous post creation
  - Test simultaneous commenting
  - Verify no race conditions

### Security Testing

- [ ] **Authentication**
  - Test unauthenticated access to `/pilot/dashboard` (should redirect)
  - Test unauthenticated API calls (should return 401)
  - Verify session expiration handling

- [ ] **Authorization**
  - Test pilot accessing admin routes (should return 403)
  - Test pilot editing other pilot's comments (should fail)
  - Test pilot viewing archived posts (should not appear)

- [ ] **RLS Policies**
  - Verify pilots can only see active posts
  - Verify pilots can't see pilot_user_id for anonymous posts
  - Verify admins can see all data
  - Test SQL injection protection

- [ ] **Input Validation**
  - Test XSS attacks in post content
  - Test SQL injection in search queries
  - Test oversized inputs (titles, content, tags)
  - Verify Zod validation on all endpoints

### Mobile Responsiveness

- [ ] **Pilot Portal (Mobile)**
  - Test registration form on mobile
  - Test login page on mobile
  - Test dashboard navigation
  - Test leave request form
  - Test feedback feed layout
  - Test post detail page
  - Test comment threading

- [ ] **Admin (Mobile)**
  - Test registration approval table
  - Test moderation dashboard
  - Verify horizontal scroll on tables

### Accessibility

- [ ] **Keyboard Navigation**
  - Test tab navigation through forms
  - Test modal focus trapping
  - Verify focus indicators visible

- [ ] **Screen Reader**
  - Test with VoiceOver (Mac) or NVDA (Windows)
  - Verify ARIA labels present
  - Check heading hierarchy

- [ ] **Color Contrast**
  - Verify text meets WCAG AA standards
  - Check button states distinguishable

---

## Production Deployment

### Database Migration

- [ ] **Backup Production Database**
  ```bash
  # Via Supabase dashboard or CLI
  supabase db dump > backup_pre_pilot_portal.sql
  ```

- [ ] **Apply Migration to Production**
  ```bash
  # Using Supabase MCP or dashboard
  # Execute migration file
  ```

- [ ] **Verify Migration Success**
  - Check all tables created
  - Verify RLS policies enabled
  - Test database triggers

### Environment Variables

- [ ] **Set Production Environment Variables**
  - Via Vercel dashboard or deployment platform
  - Verify all variables present
  - Verify no trailing characters

### Code Deployment

- [ ] **Deploy to Production**
  ```bash
  # Via Git push (if Vercel connected)
  git push origin main

  # OR via Vercel CLI
  vercel --prod
  ```

- [ ] **Verify Build Success**
  - Check Vercel build logs
  - Verify no build errors
  - Check bundle size acceptable

### Post-Deployment Verification

- [ ] **Smoke Tests**
  - Navigate to production URL
  - Test pilot registration flow
  - Test pilot login
  - Test leave request submission
  - Test feedback post creation
  - Test admin approval workflow
  - Test admin moderation

- [ ] **Monitor Errors**
  - Check Vercel logs for errors
  - Monitor Supabase logs
  - Set up error tracking (Sentry, etc.)

### Admin Setup

- [ ] **Create Admin Accounts**
  - Verify existing admin accounts have access
  - Add new admin users if needed
  - Test admin navigation links

- [ ] **Initial Data**
  - Create default feedback categories (if not done)
  - Pin welcome/announcement post
  - Test all admin features

### User Communication

- [ ] **Announce to Pilots**
  - Send email announcement
  - Include registration instructions
  - Provide portal URL: `https://yourdomain.com/pilot/register`
  - Include support contact

- [ ] **Train Admin Users**
  - Walkthrough registration approval process
  - Demonstrate moderation features
  - Review privacy/security considerations
  - Provide admin guide documentation

### Monitoring

- [ ] **Set Up Monitoring**
  - Database query performance
  - API response times
  - Error rates
  - User registration rate
  - Feedback platform engagement

- [ ] **Set Up Alerts**
  - High error rates
  - Slow database queries
  - Pending registrations > 24 hours
  - Inappropriate content detection (manual for now)

---

## Post-Launch (First Week)

- [ ] **Daily Review (Days 1-7)**
  - Check pending registrations
  - Approve/reject new pilots
  - Review new feedback posts
  - Monitor for inappropriate content
  - Address user-reported issues

- [ ] **Weekly Review**
  - Review analytics:
    - Total registrations
    - Active users
    - Leave requests submitted
    - Feedback posts created
    - Comments posted
  - Collect user feedback
  - Identify areas for improvement
  - Plan iterative enhancements

---

## Rollback Plan

**If critical issues arise:**

1. **Disable Features**
   - Set feature flags to hide pilot portal links
   - Redirect `/pilot/*` routes to "Under Maintenance" page

2. **Database Rollback**
   ```sql
   -- Drop new tables (preserves existing data)
   DROP TABLE IF EXISTS feedback_comments CASCADE;
   DROP TABLE IF EXISTS feedback_posts CASCADE;
   DROP TABLE IF EXISTS feedback_categories CASCADE;
   DROP TABLE IF EXISTS pilot_users CASCADE;

   -- Restore from backup if needed
   psql -h ... -U ... -d ... < backup_pre_pilot_portal.sql
   ```

3. **Code Rollback**
   ```bash
   # Revert to previous deployment
   vercel rollback
   ```

4. **Notify Users**
   - Send email to affected pilots
   - Provide estimated resolution time

---

## Success Criteria

### Week 1
- [ ] ≥ 10 pilot registrations
- [ ] ≥ 80% approval rate
- [ ] ≥ 5 leave requests submitted
- [ ] ≥ 10 feedback posts created
- [ ] 0 critical bugs
- [ ] < 5 minor bugs

### Month 1
- [ ] ≥ 50% of pilots registered
- [ ] ≥ 90% approval rate
- [ ] ≥ 30 leave requests submitted
- [ ] ≥ 50 feedback posts created
- [ ] ≥ 200 comments posted
- [ ] ≥ 5 active feedback categories
- [ ] Positive pilot feedback (survey)

---

## Known Limitations

1. **Email Verification**: Uses Supabase Auth default emails (can customize templates later)
2. **Real-time Updates**: Not implemented (future enhancement with Supabase subscriptions)
3. **Rich Text Editor**: Plain text only (Markdown planned for v2)
4. **Mobile App**: Web-only (native app planned for future)
5. **Notifications**: Email only (in-app notifications planned)

---

## Support Contacts

**Technical Issues:**
- Development Team: [email]

**Admin Questions:**
- System Administrator: [email]

**Pilot Support:**
- Help Desk: [email]

---

## Documentation

- **Feature Guide**: `PILOT_PORTAL_AND_FEEDBACK_PLATFORM.md`
- **API Reference**: See documentation file
- **Database Schema**: See migration file
- **User Guide**: To be created based on pilot feedback

---

**Deployment Checklist Version**: 1.0
**Last Updated**: October 2025
**Status**: Ready for Production

✅ **All items must be checked before production deployment**
