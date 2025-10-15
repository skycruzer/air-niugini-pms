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

async function fixAdminLogin() {
  console.log('🔧 Fixing admin login...\n');

  const adminId = '69cbf6c3-9b3f-45e3-96a3-85d0dd7530f7';
  const adminEmail = 'admin@airniugini.com';

  try {
    // Step 1: Reset password
    console.log('1️⃣  Resetting admin password...');
    const { error: pwdError } = await supabase.auth.admin.updateUserById(adminId, {
      password: 'Admin123!',
      email_confirm: true
    });

    if (pwdError) {
      console.error('❌ Error resetting password:', pwdError.message);
      return;
    }
    console.log('✅ Password reset successful\n');

    // Step 2: Update user metadata
    console.log('2️⃣  Updating user metadata...');
    const { error: metaError } = await supabase.auth.admin.updateUserById(adminId, {
      user_metadata: {
        full_name: 'System Administrator',
        role: 'admin'
      }
    });

    if (metaError) {
      console.log('⚠️  Warning: Could not update metadata:', metaError.message);
    } else {
      console.log('✅ Metadata updated\n');
    }

    // Step 3: Update/Insert in an_users table
    console.log('3️⃣  Updating an_users table...');
    const { error: dbError } = await supabase
      .from('an_users')
      .upsert({
        id: adminId,
        email: adminEmail,
        full_name: 'System Administrator',
        role: 'admin'
      }, {
        onConflict: 'id'
      });

    if (dbError) {
      console.log('⚠️  Warning: Could not update an_users:', dbError.message);
    } else {
      console.log('✅ Database record updated\n');
    }

    // Success message
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ ADMIN LOGIN FIXED!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('📧 Email: admin@airniugini.com');
    console.log('🔑 Password: Admin123!');
    console.log('👤 Role: admin\n');
    console.log('🌐 Login URL: http://localhost:3000/login');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

fixAdminLogin();
