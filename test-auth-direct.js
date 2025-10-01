const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function testAuth() {
  console.log('🔐 Testing authentication with provided credentials...');
  console.log('📧 Email: skycruzer@icloud.com');
  console.log('🔑 Password: [HIDDEN]');
  console.log('');

  try {
    // Test Supabase Auth login
    console.log('🔍 Step 1: Testing Supabase Auth login...');
    const {
      data: { user: authUser },
      error: signInError,
    } = await supabase.auth.signInWithPassword({
      email: 'skycruzer@icloud.com',
      password: 'mron2393',
    });

    console.log('📊 Auth Response:', {
      hasUser: !!authUser,
      userId: authUser?.id,
      email: authUser?.email,
      confirmed: authUser?.email_confirmed_at ? 'YES' : 'NO',
      error: signInError?.message || 'None',
    });

    if (signInError || !authUser) {
      console.log('❌ Supabase Authentication FAILED');
      console.log('   Error:', signInError?.message);
      return;
    }

    console.log('✅ Supabase Authentication SUCCESS');
    console.log('');

    // Test user profile lookup
    console.log('🔍 Step 2: Testing user profile lookup...');
    const { data: userData, error: userError } = await supabase
      .from('an_users')
      .select('*')
      .eq('email', authUser.email)
      .single();

    console.log('📊 Profile Response:', {
      hasData: !!userData,
      userEmail: userData?.email,
      userName: userData?.name,
      userRole: userData?.role,
      error: userError?.message || 'None',
    });

    if (userError || !userData) {
      console.log('❌ User Profile Lookup FAILED');
      console.log('   Error:', userError?.message);
      return;
    }

    console.log('✅ User Profile Lookup SUCCESS');
    console.log('');

    // Final authentication result
    console.log('🎉 OVERALL AUTHENTICATION STATUS: SUCCESS');
    console.log('👤 User Details:');
    console.log('   - Name:', userData.name);
    console.log('   - Email:', userData.email);
    console.log('   - Role:', userData.role);
    console.log('   - ID:', userData.id);
    console.log('');

    // Test session persistence
    console.log('🔍 Step 3: Testing session persistence...');
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    console.log('📊 Session Check:', {
      hasSession: !!session,
      isValid: session?.access_token ? 'YES' : 'NO',
      expiresAt: session?.expires_at ? new Date(session.expires_at * 1000).toISOString() : 'N/A',
      error: sessionError?.message || 'None',
    });

    if (session) {
      console.log('✅ Session is active and valid');
    } else {
      console.log('⚠️  No active session found');
    }
  } catch (error) {
    console.log('🚨 AUTHENTICATION TEST FAILED');
    console.log('   Error:', error.message);
    console.log('   Stack:', error.stack);
  }
}

testAuth();
