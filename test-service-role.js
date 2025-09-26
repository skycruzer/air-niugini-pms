const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

// Test with service role key (full access)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndnZG1ndm9ucXlzZmx3ZGlpb2xzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTU4MjMyMCwiZXhwIjoyMDcxMTU4MzIwfQ.byfbMS__aOJzhhty54h7ap3XK19f9-3Wu7S-ZWWV2Cg'

const supabaseService = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false }
})

const supabaseAnon = createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)

async function testBothConnections() {
  console.log('🔗 Testing both service role and anonymous access...\n')

  try {
    // Test with SERVICE ROLE (should have full access)
    console.log('👑 SERVICE ROLE ACCESS:')
    const { data: servicePilots, error: servicePilotError } = await supabaseService
      .from('pilots')
      .select('*')

    if (servicePilotError) {
      console.error('❌ Service role pilot error:', servicePilotError)
    } else {
      console.log('✅ Service role pilots:', servicePilots?.length || 0, 'found')
      if (servicePilots?.length > 0) {
        console.log('📋 First pilot:', servicePilots[0])
      }
    }

    const { data: serviceCerts, error: serviceCertError } = await supabaseService
      .from('pilot_checks')
      .select('*')
      .limit(5)

    if (serviceCertError) {
      console.error('❌ Service role cert error:', serviceCertError)
    } else {
      console.log('✅ Service role certifications:', serviceCerts?.length || 0, 'found')
    }

    // Test with ANONYMOUS (should work now with new policies)
    console.log('\n🌐 ANONYMOUS ACCESS:')
    const { data: anonPilots, error: anonPilotError } = await supabaseAnon
      .from('pilots')
      .select('role')
      .eq('is_active', true)

    if (anonPilotError) {
      console.error('❌ Anonymous pilot error:', anonPilotError)
    } else {
      console.log('✅ Anonymous pilots:', anonPilots?.length || 0, 'found')
    }

    const { count: anonCertCount, error: anonCertError } = await supabaseAnon
      .from('pilot_checks')
      .select('*', { count: 'exact', head: true })

    if (anonCertError) {
      console.error('❌ Anonymous cert error:', anonCertError)
    } else {
      console.log('✅ Anonymous certifications:', anonCertCount || 0, 'found')
    }

    // Check RLS policies
    console.log('\n🔐 CHECKING RLS POLICIES:')
    const { data: policies, error: policyError } = await supabaseService
      .from('pg_policies')
      .select('*')
      .in('tablename', ['pilots', 'pilot_checks', 'check_types'])
      .contains('roles', ['anon'])

    if (policyError) {
      console.error('❌ Policy check error:', policyError)
    } else {
      console.log('📋 Anonymous policies found:', policies?.length || 0)
      policies?.forEach(policy => {
        console.log(`  - ${policy.tablename}: ${policy.policyname}`)
      })
    }

  } catch (error) {
    console.error('💥 Test failed:', error)
  }
}

testBothConnections()