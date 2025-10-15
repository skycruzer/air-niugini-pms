const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function updateUsers() {
  console.log('🔧 Updating user records...\n');

  try {
    // Update admin user in an_users table
    console.log('1️⃣  Updating admin in an_users table...');
    const { error: adminError } = await supabase
      .from('an_users')
      .upsert({
        id: '69cbf6c3-9b3f-45e3-96a3-85d0dd7530f7',
        email: 'admin@airniugini.com',
        name: 'System Administrator',
        role: 'admin'
      }, {
        onConflict: 'id'
      });

    if (adminError) {
      console.log('⚠️  Error updating admin:', adminError.message);
    } else {
      console.log('✅ Admin record updated\n');
    }

    // Check and update skycruzer@icloud.com
    console.log('2️⃣  Checking skycruzer@icloud.com account...');
    const { data: skyUser } = await supabase
      .from('an_users')
      .select('*')
      .eq('id', '08c7b547-47b9-40a4-9831-4df8f3ceebc9')
      .single();

    if (!skyUser) {
      console.log('Creating record for skycruzer@icloud.com...');
      const { error: skyError } = await supabase
        .from('an_users')
        .insert({
          id: '08c7b547-47b9-40a4-9831-4df8f3ceebc9',
          email: 'skycruzer@icloud.com',
          name: 'Maurice Rondeau',
          role: 'admin'
        });

      if (skyError) {
        console.log('⚠️  Error creating user:', skyError.message);
      } else {
        console.log('✅ User record created\n');
      }
    } else {
      console.log('✅ User already exists with role:', skyUser.role, '\n');
    }

    // List all users
    console.log('3️⃣  Current users in an_users table:');
    const { data: allUsers } = await supabase
      .from('an_users')
      .select('*')
      .order('email');

    if (allUsers) {
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
      allUsers.forEach(user => {
        console.log('📧', user.email);
        console.log('👤 Role:', user.role);
        console.log('👨', 'Name:', user.name || 'Not set');
        console.log('');
      });
    }

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ ALL UPDATES COMPLETE!\n');
    console.log('You can now log in with either:');
    console.log('');
    console.log('1️⃣  Admin Account:');
    console.log('   📧 Email: admin@airniugini.com');
    console.log('   🔑 Password: Admin123!');
    console.log('');
    console.log('2️⃣  Your Personal Account:');
    console.log('   📧 Email: skycruzer@icloud.com');
    console.log('   🔑 Password: (your password)');
    console.log('   👤 Role: admin');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

updateUsers();
