const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://wgdmgvonqysflwdiiols.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndnZG1ndm9ucXlzZmx3ZGlpb2xzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTU4MjMyMCwiZXhwIjoyMDcxMTU4MzIwfQ.7tXqVwmgABgflVvKrcOHGlXd8JcN1yTvECfhJ0cWGRE',
  { auth: { persistSession: false } }
);

async function listTables() {
  console.log('📊 Checking Supabase schema for Air Niugini PMS...\n');
  
  const tablesToCheck = [
    'pilots', 'pilot_checks', 'check_types', 'an_users',
    'leave_requests', 'settings', 'contract_types',
    'an_pilots', 'an_pilot_checks', 'an_check_types',
    'audit_logs', 'notifications', 'documents'
  ];
  
  console.log('📋 Checking tables:\n');
  
  for (const table of tablesToCheck) {
    const { data, error, count } = await supabase
      .from(table)
      .select('*', { count: 'exact', head: true });
    
    if (!error) {
      const spaces = ' '.repeat(25 - table.length);
      console.log('✅ ' + table + spaces + ' - ' + (count || 0) + ' records');
    }
  }
}

listTables().catch(console.error);
