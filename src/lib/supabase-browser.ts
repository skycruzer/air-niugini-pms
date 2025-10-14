/**
 * Supabase Browser Client
 * For use in client components and pages
 * Uses @supabase/ssr for cookie compatibility with middleware
 */

import { createBrowserClient } from '@supabase/ssr';
import type { Database } from '@/types/supabase';

/**
 * Create a Supabase client for browser-side use (client components, pages)
 * Uses @supabase/ssr for proper cookie handling that's compatible with middleware
 */
export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
