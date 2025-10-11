const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkSecurity() {
  console.log('Checking Database Security...\n');

  const tables = ['pilots', 'pilot_checks', 'check_types', 'leave_requests', 'an_users'];
  
  for (const table of tables) {
    const result = await supabase.from(table).select('*', { count: 'exact', head: true });
    console.log(`${table}: ${result.count || 0} records, Error: ${result.error ? result.error.message : 'None'}`);
  }
}

checkSecurity().then(() => process.exit(0)).catch(err => { console.error(err); process.exit(1); });
