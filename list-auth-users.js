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

async function listAuthUsers() {
  console.log('🔍 Checking Supabase Auth users...\n');

  try {
    // List all auth users
    const { data: { users }, error } = await supabase.auth.admin.listUsers();

    if (error) {
      console.error('❌ Error listing users:', error.message);
      return;
    }

    if (!users || users.length === 0) {
      console.log('❌ No users found in Supabase Auth!\n');
      console.log('Creating new admin user...\n');
      
      const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
        email: 'admin@airniugini.com',
        password: 'Admin123!',
        email_confirm: true,
        user_metadata: {
          full_name: 'System Administrator',
          role: 'admin'
        }
      });

      if (createError) {
        console.error('❌ Error creating user:', createError.message);
        return;
      }

      console.log('✅ Admin user created!\n');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('📧 Email: admin@airniugini.com');
      console.log('🔑 Password: Admin123!');
      console.log('👤 Role: admin');
      console.log('🆔 User ID:', newUser.user.id);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

      // Update an_users table
      const { error: updateError } = await supabase
        .from('an_users')
        .upsert({
          id: newUser.user.id,
          email: 'admin@airniugini.com',
          full_name: 'System Administrator',
          role: 'admin'
        });

      if (updateError) {
        console.log('⚠️  Warning: Could not update an_users table:', updateError.message);
      } else {
        console.log('✅ an_users table updated\n');
      }

      return;
    }

    console.log('✅ Found', users.length, 'users in Supabase Auth:\n');
    users.forEach((user, index) => {
      console.log((index + 1) + '. Email:', user.email);
      console.log('   ID:', user.id);
      console.log('   Confirmed:', user.email_confirmed_at ? 'Yes' : 'No');
      console.log('   Metadata:', JSON.stringify(user.user_metadata));
      console.log('');
    });

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

listAuthUsers();
