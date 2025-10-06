require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkSchema() {
  console.log('📊 Checking Supabase schema...\n');

  // Get all tables
  const { data, error } = await supabase.rpc('exec_sql', {
    query: `
        SELECT 
          table_name,
          (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name AND table_schema = 'public') as column_count
        FROM information_schema.tables t
        WHERE table_schema = 'public' 
        AND table_type = 'BASE TABLE'
        ORDER BY table_name;
      `,
  });

  if (error) {
    console.error('❌ Error:', error.message);
    // Try alternative approach
    const { data: alt, error: altError } = await supabase
      .from('information_schema.tables')
      .select('*')
      .eq('table_schema', 'public');

    if (altError) {
      console.error('❌ Alternative approach failed:', altError.message);
    } else {
      console.log('✅ Tables found:', alt);
    }
  } else {
    console.log('✅ Database Tables:');
    console.log(data);
  }
}

checkSchema();
