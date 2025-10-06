const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

// Create Supabase admin client
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function applyAuthFix() {
  try {
    console.log('🔧 Applying auth_get_user_role() function fix...\n');

    // Read the SQL file
    const sqlPath = path.join(__dirname, 'fix-auth-role-function.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    // Execute the SQL
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });

    if (error) {
      console.error('❌ Error applying fix:', error);

      // Try alternative method using raw SQL
      console.log('\n🔄 Trying alternative method...\n');

      const functionSql = `
CREATE OR REPLACE FUNCTION public.auth_get_user_role()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN 'anonymous';
  END IF;

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
`;

      // Use Supabase REST API directly
      const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: supabaseServiceKey,
          Authorization: `Bearer ${supabaseServiceKey}`,
        },
        body: JSON.stringify({ query: functionSql }),
      });

      const result = await response.json();

      if (response.ok) {
        console.log('✅ Function updated successfully via REST API!');
      } else {
        console.error('❌ REST API error:', result);
        console.log('\n📋 Manual Steps Required:');
        console.log('1. Go to Supabase Dashboard → SQL Editor');
        console.log('2. Paste and run the contents of fix-auth-role-function.sql');
        console.log('3. Or run: cat fix-auth-role-function.sql | psql <connection-string>');
      }
    } else {
      console.log('✅ Function updated successfully!');
      console.log('📊 Result:', data);
    }

    // Test the function
    console.log('\n🧪 Testing auth_get_user_role() function...');
    const { data: testData, error: testError } = await supabase
      .from('an_users')
      .select('email, role')
      .eq('email', 'admin@airniugini.com')
      .single();

    if (testError) {
      console.error('❌ Test error:', testError);
    } else {
      console.log('✅ Test user found:', testData);
      console.log('   Expected role: admin');
      console.log('   The function should now return "admin" for this user');
    }
  } catch (error) {
    console.error('❌ Fatal error:', error);
    console.log('\n📋 Please apply fix-auth-role-function.sql manually in Supabase Dashboard');
  }
}

applyAuthFix();
