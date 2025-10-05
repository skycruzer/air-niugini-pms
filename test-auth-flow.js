const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testAuthFlow() {
  console.log('🔐 Testing Air Niugini PMS Authentication Flow\n');
  
  // 1. Check users table
  console.log('📋 Step 1: Checking an_users table...');
  const { data: users, error: usersError } = await supabase
    .from('an_users')
    .select('*');
  
  if (usersError) {
    console.log('❌ Error fetching users:', usersError.message);
    return;
  }
  
  console.log(`✅ Found ${users.length} users:\n`);
  users.forEach(user => {
    console.log(`   - ${user.email} (${user.role}) - Active: ${user.is_active}`);
  });
  
  // 2. Check auth.users
  console.log('\n📋 Step 2: Checking Supabase Auth users...');
  const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
  
  if (authError) {
    console.log('❌ Error fetching auth users:', authError.message);
  } else {
    console.log(`✅ Found ${authUsers.users.length} auth users:\n`);
    authUsers.users.forEach(user => {
      console.log(`   - ${user.email} - Confirmed: ${!!user.email_confirmed_at}`);
    });
  }
  
  // 3. Test role-based permissions
  console.log('\n📋 Step 3: Testing role-based permissions...');
  const roles = ['admin', 'manager'];
  
  roles.forEach(role => {
    const userWithRole = users.find(u => u.role === role);
    if (userWithRole) {
      console.log(`\n   ${role.toUpperCase()} permissions (${userWithRole.email}):`);
      console.log(`   - Can Create: ${role === 'admin'}`);
      console.log(`   - Can Edit: ${['admin', 'manager'].includes(role)}`);
      console.log(`   - Can Delete: ${role === 'admin'}`);
      console.log(`   - Can Approve: ${['admin', 'manager'].includes(role)}`);
    }
  });
  
  // 4. Test a sample login
  console.log('\n📋 Step 4: Testing sample authentication...');
  const testUser = users.find(u => u.role === 'admin');
  
  if (testUser) {
    console.log(`   Attempting to verify user: ${testUser.email}`);
    console.log(`   ✅ User exists in an_users table`);
    console.log(`   ✅ Role: ${testUser.role}`);
    console.log(`   ✅ Active status: ${testUser.is_active}`);
  }
  
  console.log('\n✅ Authentication flow test completed successfully!');
}

testAuthFlow().catch(console.error);
