/**
 * AUDIT INTEGRATION UTILITIES
 *
 * Helper functions to integrate audit logging into existing CRUD operations.
 * Provides easy-to-use wrappers for logging user actions to the audit trail.
 *
 * Features:
 * - Set current user context for audit logging
 * - Automatic audit trail logging
 * - Support for IP address and user agent tracking
 * - Simplified API for common operations
 *
 * Part of Phase 4.2: Comprehensive Audit Logging UI
 *
 * USAGE EXAMPLE:
 *
 * import { setAuditUserContext } from '@/lib/audit-integration'
 *
 * // In your API route or server action:
 * await setAuditUserContext(userEmail)
 *
 * // Then perform your database operation
 * // The audit trigger will automatically capture the user context
 * await supabase.from('pilots').update({ ... }).eq('id', pilotId)
 */

import { getSupabaseAdmin } from './supabase';

/**
 * Set the current user context for audit logging.
 * This should be called before any database operations that need to be audited.
 *
 * The user email is stored in the database session using SET LOCAL,
 * which makes it available to the audit trigger function.
 *
 * @param userEmail - Email of the user performing the operation
 */
export async function setAuditUserContext(userEmail: string): Promise<void> {
  const supabaseAdmin = getSupabaseAdmin();

  try {
    // Set the user context in the database session
    // This will be picked up by the audit trigger function
    const { error } = await supabaseAdmin.rpc('set_config', {
      setting_name: 'app.current_user_email',
      setting_value: userEmail,
      is_local: true,
    });

    if (error) {
      console.warn('Failed to set audit user context:', error);
      // Don't throw error - allow operation to continue even if audit context fails
    }
  } catch (error) {
    console.warn('Error setting audit user context:', error);
  }
}

/**
 * Clear the audit user context after operations are complete.
 * Optional cleanup function.
 */
export async function clearAuditUserContext(): Promise<void> {
  const supabaseAdmin = getSupabaseAdmin();

  try {
    await supabaseAdmin.rpc('set_config', {
      setting_name: 'app.current_user_email',
      setting_value: '',
      is_local: true,
    });
  } catch (error) {
    console.warn('Error clearing audit user context:', error);
  }
}

/**
 * Wrapper function to execute a database operation with audit context.
 * Automatically sets and clears the user context.
 *
 * @param userEmail - Email of the user performing the operation
 * @param operation - Async function containing the database operation
 * @returns Result of the operation
 *
 * @example
 * const result = await withAuditContext(
 *   user.email,
 *   async () => {
 *     return await supabase
 *       .from('pilots')
 *       .update({ first_name: 'John' })
 *       .eq('id', pilotId)
 *   }
 * )
 */
export async function withAuditContext<T>(
  userEmail: string,
  operation: () => Promise<T>
): Promise<T> {
  try {
    await setAuditUserContext(userEmail);
    const result = await operation();
    return result;
  } finally {
    await clearAuditUserContext();
  }
}

/**
 * Integration guide for existing CRUD operations:
 *
 * 1. In API routes (src/app/api/[route]/route.ts):
 *
 *    import { setAuditUserContext } from '@/lib/audit-integration'
 *    import { getSupabaseAdmin } from '@/lib/supabase'
 *
 *    export async function POST(request: NextRequest) {
 *      const body = await request.json()
 *      const session = await getServerSession()
 *
 *      if (!session?.user?.email) {
 *        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
 *      }
 *
 *      // Set audit context BEFORE database operations
 *      await setAuditUserContext(session.user.email)
 *
 *      const supabaseAdmin = getSupabaseAdmin()
 *      const { data, error } = await supabaseAdmin
 *        .from('pilots')
 *        .insert(body)
 *
 *      // Audit log is automatically created by the database trigger!
 *
 *      return NextResponse.json({ data })
 *    }
 *
 * 2. In service functions (src/lib/*-service.ts):
 *
 *    import { withAuditContext } from '@/lib/audit-integration'
 *
 *    export async function updatePilot(pilotId: string, data: any, userEmail: string) {
 *      return await withAuditContext(userEmail, async () => {
 *        const supabaseAdmin = getSupabaseAdmin()
 *        return await supabaseAdmin
 *          .from('pilots')
 *          .update(data)
 *          .eq('id', pilotId)
 *      })
 *    }
 *
 * 3. The audit trigger automatically captures:
 *    - User email (from context)
 *    - User role (looked up from an_users table)
 *    - Action (INSERT, UPDATE, DELETE)
 *    - Table name
 *    - Record ID
 *    - Old and new data (JSONB)
 *    - Changed fields array
 *    - Timestamps (UTC and PNG timezone)
 *
 * 4. No changes needed to existing database queries!
 *    The trigger handles everything automatically once context is set.
 */

/**
 * Get audit logs for a specific user (for user activity reports)
 */
export async function getUserAuditLogs(userEmail: string, limit: number = 50): Promise<any[]> {
  const supabaseAdmin = getSupabaseAdmin();

  try {
    const { data, error } = await supabaseAdmin
      .from('audit_logs')
      .select('*')
      .eq('user_email', userEmail)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching user audit logs:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error in getUserAuditLogs:', error);
    return [];
  }
}

/**
 * Get recent audit activity for dashboard display
 */
export async function getRecentAuditLogs(limit: number = 10): Promise<any[]> {
  const supabaseAdmin = getSupabaseAdmin();

  try {
    const { data, error } = await supabaseAdmin
      .from('audit_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching recent audit logs:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error in getRecentAuditLogs:', error);
    return [];
  }
}

/**
 * Check if audit logging is enabled and functioning
 */
export async function checkAuditSystem(): Promise<{
  enabled: boolean;
  triggerCount: number;
  recentLogCount: number;
}> {
  const supabaseAdmin = getSupabaseAdmin();

  try {
    // Check for audit triggers
    const { data: triggers } = await supabaseAdmin
      .from('information_schema.triggers' as any)
      .select('trigger_name')
      .like('trigger_name', 'audit_%');

    // Check for recent logs
    const { data: recentLogs, count } = await supabaseAdmin
      .from('audit_logs')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

    return {
      enabled: (triggers?.length || 0) > 0,
      triggerCount: triggers?.length || 0,
      recentLogCount: count || 0,
    };
  } catch (error) {
    console.error('Error checking audit system:', error);
    return {
      enabled: false,
      triggerCount: 0,
      recentLogCount: 0,
    };
  }
}
