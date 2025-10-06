const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing environment variables');
  console.error('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? 'SET' : 'MISSING');
  console.error('SUPABASE_SERVICE_ROLE_KEY:', supabaseKey ? 'SET' : 'MISSING');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function applyMigration() {
  try {
    console.log('📂 Reading migration file...');
    const sql = fs.readFileSync('fix-database-advisor-issues.sql', 'utf8');

    console.log('🔧 Applying database migration to fix 52 advisor issues...');
    console.log('   - 14 Security DEFINER views');
    console.log('   - 5 Function search_path fixes');
    console.log('   - 3 Extension schema moves');
    console.log('   - 9 RLS policy optimizations');
    console.log('   - 8 Multiple permissive policy consolidations');
    console.log('   - 1 Missing foreign key index');
    console.log('   - 20 Unused index removals');
    console.log('');

    // Execute the SQL migration
    const { data, error } = await supabase.rpc('exec', { sql });

    if (error) {
      console.error('❌ Migration failed:', error.message);
      console.error('Details:', error);
      process.exit(1);
    }

    console.log('✅ Migration completed successfully!');
    console.log('');
    console.log('📋 Next steps (manual configuration in Supabase Dashboard):');
    console.log('   1. Enable leaked password protection');
    console.log('   2. Enable additional MFA options (TOTP, WebAuthn)');
    console.log('   3. Schedule Postgres upgrade to apply security patches');
    console.log('');
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

applyMigration();
