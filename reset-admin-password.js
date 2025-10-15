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

async function resetAdminPassword() {
  console.log('🔐 Resetting admin password...\n');

  try {
    // Update password for admin@airniugini.com
    const { data, error } = await supabase.auth.admin.updateUserById(
      'ea5e67c8-f5a9-4455-a477-316874478d12',
      { password: 'Admin123!' }
    );

    if (error) {
      console.error('❌ Error resetting password:', error.message);
      return;
    }

    console.log('✅ Admin password reset successfully!\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📧 Email: admin@airniugini.com');
    console.log('🔑 Password: Admin123!');
    console.log('👤 Role: admin');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('✨ You can now log in with these credentials');

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

resetAdminPassword();
