const https = require('https');
require('dotenv').config({ path: '.env.local' });

const sql = `
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

const options = {
  hostname: 'wgdmgvonqysflwdiiols.supabase.co',
  port: 443,
  path: '/rest/v1/rpc/exec_sql',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    apikey: process.env.SUPABASE_SERVICE_ROLE_KEY,
    Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
    Prefer: 'return=representation',
  },
};

const data = JSON.stringify({ query: sql });

const req = https.request(options, (res) => {
  let body = '';

  res.on('data', (chunk) => {
    body += chunk;
  });

  res.on('end', () => {
    console.log('Status:', res.statusCode);
    console.log('Response:', body);

    if (res.statusCode === 200 || res.statusCode === 201) {
      console.log('\n✅ Function updated successfully!');
      console.log('   Pilot edit should now work correctly.');
      console.log('   Certification edit should now work correctly.');
    } else {
      console.log('\n❌ Failed to update function.');
      console.log('   Please apply fix-auth-role-function.sql manually in Supabase Dashboard.');
    }
  });
});

req.on('error', (e) => {
  console.error('Error:', e.message);
  console.log('\n📋 Manual fix required:');
  console.log('   1. Open: https://supabase.com/dashboard/project/wgdmgvonqysflwdiiols/sql');
  console.log('   2. Copy contents of fix-auth-role-function.sql');
  console.log('   3. Paste and run in SQL Editor');
});

req.write(data);
req.end();
