/**
 * @fileoverview Supabase Admin Client Configuration
 * Re-exports the admin client from the main supabase configuration
 * This file provides a dedicated import path for admin operations
 */

import { getSupabaseAdmin } from './supabase';

/**
 * Supabase admin client with service role privileges
 * Re-exported from the main supabase configuration
 */
export const supabaseAdmin = getSupabaseAdmin();

// For backward compatibility
export { getSupabaseAdmin } from './supabase';
