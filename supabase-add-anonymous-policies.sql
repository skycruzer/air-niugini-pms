-- Add policies to allow anonymous (public) read access for dashboard statistics
-- This enables the landing page to fetch real data without authentication

-- Allow anonymous users to view pilots (for dashboard stats)
CREATE POLICY "Anonymous users can view pilot statistics" ON public.pilots
  FOR SELECT TO anon USING (true);

-- Allow anonymous users to view pilot checks (for dashboard stats)
CREATE POLICY "Anonymous users can view pilot check statistics" ON public.pilot_checks
  FOR SELECT TO anon USING (true);

-- Allow anonymous users to view check types (for dashboard stats)
CREATE POLICY "Anonymous users can view check type statistics" ON public.check_types
  FOR SELECT TO anon USING (true);

-- Verify the policies were created
SELECT schemaname, tablename, policyname, roles, cmd
FROM pg_policies
WHERE schemaname = 'public'
AND tablename IN ('pilots', 'pilot_checks', 'check_types')
AND roles @> ARRAY['anon'];