const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

// Test Supabase connection
async function testSupabaseConnection() {
  console.log('🔗 Testing Supabase connection...');
  console.log('URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
  console.log('Key exists:', !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  try {
    // Test 1: Get pilot count
    console.log('\n📊 Testing pilot count...');
    const { data: pilotData, error: pilotError } = await supabase
      .from('pilots')
      .select('role')
      .eq('is_active', true);

    if (pilotError) {
      console.error('❌ Pilot query error:', pilotError);
      return;
    }

    console.log('✅ Pilot data:', pilotData?.length, 'active pilots');

    // Test 2: Get certification count
    console.log('\n📄 Testing certification count...');
    const { count: certCount, error: certError } = await supabase
      .from('pilot_checks')
      .select('*', { count: 'exact', head: true });

    if (certError) {
      console.error('❌ Certification query error:', certError);
      return;
    }

    console.log('✅ Certification data:', certCount, 'total certifications');

    // Test 3: Get check types count
    console.log('\n🔍 Testing check types count...');
    const { count: checkCount, error: checkError } = await supabase
      .from('check_types')
      .select('*', { count: 'exact', head: true });

    if (checkError) {
      console.error('❌ Check types query error:', checkError);
      return;
    }

    console.log('✅ Check types data:', checkCount, 'total check types');

    console.log('\n🎉 All Supabase tests passed!');
  } catch (error) {
    console.error('💥 Test failed:', error);
  }
}

testSupabaseConnection();
