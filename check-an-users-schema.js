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

async function checkSchema() {
  console.log('🔍 Checking an_users table schema...\n');

  try {
    const { data, error } = await supabase
      .from('an_users')
      .select('*')
      .limit(1);

    if (error) {
      console.error('❌ Error:', error.message);
      return;
    }

    if (data && data.length > 0) {
      console.log('✅ Table structure (columns):');
      console.log(Object.keys(data[0]));
    } else {
      console.log('⚠️  Table is empty, checking by inserting test data...');
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

checkSchema();
