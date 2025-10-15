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

async function checkUsers() {
  console.log('🔍 Checking users in an_users table...\n');
  
  try {
    const { data: users, error } = await supabase
      .from('an_users')
      .select('*')
      .order('created_at', { ascending: true });

    if (error) {
      console.error('❌ Error fetching users:', error.message);
      return;
    }

    if (!users || users.length === 0) {
      console.log('❌ No users found in an_users table!\n');
      console.log('Creating default admin user...\n');
      
      // Create default admin user
      const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
        email: 'admin@airniugini.com.pg',
        password: 'Admin123!',
        email_confirm: true,
        user_metadata: {
          full_name: 'System Administrator',
          role: 'admin'
        }
      });

      if (createError) {
        console.error('❌ Error creating admin user:', createError.message);
        return;
      }

      console.log('✅ Admin user created successfully!');
      console.log('\n📧 Email: admin@airniugini.com.pg');
      console.log('🔑 Password: Admin123!');
      console.log('👤 Role: admin\n');
      
      // Insert into an_users table
      const { error: insertError } = await supabase
        .from('an_users')
        .insert([{
          id: newUser.user.id,
          email: 'admin@airniugini.com.pg',
          full_name: 'System Administrator',
          role: 'admin'
        }]);

      if (insertError) {
        console.error('❌ Error inserting into an_users:', insertError.message);
      } else {
        console.log('✅ User record created in an_users table\n');
      }
      
      return;
    }

    console.log(`✅ Found ${users.length} users:\n`);
    users.forEach((user, index) => {
      console.log(`${index + 1}. Email: ${user.email}`);
      console.log(`   Role: ${user.role}`);
      console.log(`   Name: ${user.full_name}`);
      console.log(`   ID: ${user.id}`);
      console.log('');
    });

    console.log('\n🔐 To reset admin password, use:');
    console.log('Email: admin@airniugini.com.pg');
    console.log('Password: Admin123!');
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

checkUsers();
