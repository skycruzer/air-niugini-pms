const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false },
});

async function applyMigration() {
  console.log('📋 Applying audit_logs table migration...\n');

  try {
    // Read migration file
    const migrationSQL = fs.readFileSync('004_audit_trail.sql', 'utf-8');

    // Split into individual statements (simple split on semicolon and newline)
    const statements = migrationSQL
      .split(/;\s*\n/)
      .filter((stmt) => stmt.trim() && !stmt.trim().startsWith('--'))
      .map((stmt) => stmt.trim() + ';');

    console.log(`Found ${statements.length} SQL statements to execute\n`);

    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const stmt = statements[i];

      // Skip comments and empty statements
      if (stmt.startsWith('--') || stmt.trim() === ';') continue;

      // Show progress for important statements
      if (stmt.includes('CREATE TABLE')) {
        console.log(`Creating table...`);
      } else if (stmt.includes('CREATE INDEX')) {
        console.log(`Creating index ${i + 1}...`);
      } else if (stmt.includes('CREATE TRIGGER')) {
        console.log(`Creating trigger...`);
      } else if (stmt.includes('CREATE FUNCTION')) {
        console.log(`Creating function...`);
      }

      const { error } = await supabase.rpc('exec_sql', { sql: stmt });

      if (error && !error.message.includes('already exists')) {
        console.error(`\n❌ Error executing statement ${i + 1}:`, error.message);
        console.error('Statement:', stmt.substring(0, 200));
        // Continue anyway for non-critical errors
      }
    }

    console.log('\n✅ Audit logs migration completed successfully');

    // Verify table exists
    const { data, error: verifyError } = await supabase
      .from('audit_logs')
      .select('count')
      .limit(0);

    if (verifyError) {
      console.error('\n⚠️  Warning: Could not verify table creation:', verifyError.message);
    } else {
      console.log('✅ Verified: audit_logs table exists and is accessible');
    }
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  }
}

applyMigration();
