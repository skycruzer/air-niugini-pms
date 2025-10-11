const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkDatabaseSecurity() {
  console.log('🔍 Checking Database Security...\n');

  // Check which tables exist
  console.log('1. Checking table existence:');
  const tables = ['pilots', 'pilot_checks', 'check_types', 'leave_requests', 'settings', 'contract_types', 
                  'an_users', 'an_pilots', 'an_pilot_checks', 'an_check_types', 'an_leave_requests'];
  
  for (const table of tables) {
    const { data, error } = await supabase.from(table).select('*').limit(1);
    if (error) {
      console.log(`   ❌ ${table}: ${error.message}`);
    } else {
      console.log(`   ✅ ${table}: EXISTS (${data ? data.length : 0} sample records)`);
    }
  }

  // Check RLS policies
  console.log('\n2. Checking RLS policies on production tables:');
  const { data: rlsData, error: rlsError } = await supabase.rpc('exec_sql', {
    sql: `
      SELECT 
        schemaname,
        tablename,
        policyname,
        permissive,
        roles,
        cmd
      FROM pg_policies
      WHERE schemaname = 'public' 
        AND tablename IN ('pilots', 'pilot_checks', 'check_types', 'leave_requests', 'settings', 'contract_types', 'an_users')
      ORDER BY tablename, policyname;
    `
  });

  if (rlsError) {
    // Try direct query instead
    const { data: policies } = await supabase
      .from('pg_policies')
      .select('*')
      .in('tablename', ['pilots', 'pilot_checks', 'check_types', 'leave_requests', 'an_users']);
    
    console.log('   Policies query result:', policies ? policies.length : 0, 'policies found');
  }

  // Check if RLS is enabled
  console.log('\n3. Checking if RLS is enabled on tables:');
  const checkRLS = async (tableName) => {
    try {
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .limit(1);
      
      return { table: tableName, hasData: !!data, error: error?.message };
    } catch (err) {
      return { table: tableName, hasData: false, error: err.message };
    }
  };

  const results = await Promise.all([
    checkRLS('pilots'),
    checkRLS('pilot_checks'),
    checkRLS('check_types'),
    checkRLS('leave_requests'),
    checkRLS('an_users')
  ]);

  results.forEach(r => {
    console.log(`   ${r.hasData ? '✅' : '❌'} ${r.table}: ${r.error || 'OK'}`);
  });

  // Count records
  console.log('\n4. Counting records in production tables:');
  const counts = {
    pilots: await supabase.from('pilots').select('*', { count: 'exact', head: true }),
    pilot_checks: await supabase.from('pilot_checks').select('*', { count: 'exact', head: true }),
    check_types: await supabase.from('check_types').select('*', { count: 'exact', head: true }),
    leave_requests: await supabase.from('leave_requests').select('*', { count: 'exact', head: true }),
    an_users: await supabase.from('an_users').select('*', { count: 'exact', head: true })
  };

  for (const [table, result] of Object.entries(counts)) {
    console.log(`   ${table}: ${result.count || 0} records`);
  }
}

checkDatabaseSecurity().then(() => {
  console.log('\n✅ Security check complete');
  process.exit(0);
}).catch(err => {
  console.error('❌ Error:', err);
  process.exit(1);
});
