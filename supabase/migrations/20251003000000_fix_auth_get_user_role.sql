-- Fix auth_get_user_role() to use an_users table instead of JWT metadata
-- This fixes the RLS policy issue where admins couldn't update data
--
-- ISSUE: The function was reading role from JWT user_metadata which has "user"
-- but the actual admin role is stored in the an_users table as "admin"
-- This caused RLS policies to fail for admin users allowing only SELECT operations

CREATE OR REPLACE FUNCTION public.auth_get_user_role()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
  -- Check if user is authenticated
  IF auth.uid() IS NULL THEN
    RETURN 'anonymous';
  END IF;

  -- Get role from an_users table based on auth.uid()
  -- This is the source of truth for user roles, not JWT metadata
  RETURN COALESCE(
    (
      SELECT role
      FROM public.an_users
      WHERE id::text = auth.uid()::text
      LIMIT 1
    ),
    'user'
  );
END;
$function$;
