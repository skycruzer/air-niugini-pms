#!/usr/bin/env node

/**
 * Execute Legacy Table Cleanup
 *
 * This script removes unused an_* prefixed legacy tables from the database.
 * It keeps an_users (active authentication table) and removes:
 * - an_pilots (5 rows)
 * - an_check_types (10 rows)
 * - an_pilot_checks (18 rows)
 * - an_leave_requests (0 rows)
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables');
  console.error('   NEXT_PUBLIC_SUPABASE_URL:', !!supabaseUrl);
  console.error('   SUPABASE_SERVICE_ROLE_KEY:', !!supabaseServiceKey);
  process.exit(1);
}

// Create admin client
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function executeCleanup() {
  console.log('🗑️  Air Niugini PMS - Legacy Table Cleanup');
  console.log('==========================================\n');

  try {
    // Read the cleanup SQL file
    const sqlFilePath = path.join(__dirname, 'cleanup-legacy-tables-final.sql');
    const cleanupSQL = fs.readFileSync(sqlFilePath, 'utf8');

    console.log('📋 Cleanup Plan:');
    console.log('   ✅ Keep: an_users (active authentication)');
    console.log('   ❌ Delete: an_pilots (5 rows)');
    console.log('   ❌ Delete: an_check_types (10 rows)');
    console.log('   ❌ Delete: an_pilot_checks (18 rows)');
    console.log('   ❌ Delete: an_leave_requests (0 rows)\n');

    console.log('⏳ Executing cleanup SQL...\n');

    // Execute the cleanup SQL
    const { data, error } = await supabase.rpc('exec_sql', { sql: cleanupSQL });

    if (error) {
      // Try direct execution if RPC doesn't work
      console.log('⚠️  RPC method failed, trying direct execution...\n');

      // Split and execute each DROP statement individually
      const statements = [
        "DROP TABLE IF EXISTS an_leave_requests CASCADE",
        "DROP TABLE IF EXISTS an_pilot_checks CASCADE",
        "DROP TABLE IF EXISTS an_pilots CASCADE",
        "DROP TABLE IF EXISTS an_check_types CASCADE"
      ];

      for (const statement of statements) {
        const tableName = statement.match(/an_\w+/)[0];
        console.log(`🗑️  Dropping ${tableName}...`);

        const { error: dropError } = await supabase.rpc('exec_sql', { sql: statement });

        if (dropError) {
          console.error(`   ❌ Error dropping ${tableName}:`, dropError.message);
        } else {
          console.log(`   ✅ Successfully dropped ${tableName}`);
        }
      }
    } else {
      console.log('✅ Cleanup SQL executed successfully!\n');
      if (data) {
        console.log('📊 Results:', data);
      }
    }

    // Verify remaining tables
    console.log('\n📋 Verifying remaining tables...\n');

    const { data: tables, error: tableError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .order('table_name');

    if (tableError) {
      console.error('❌ Error fetching tables:', tableError.message);
    } else {
      console.log('Remaining tables:');
      tables.forEach(table => {
        const name = table.table_name;
        if (name === 'an_users') {
          console.log(`   ✅ ${name} (Active Auth Table - KEPT)`);
        } else if (name.startsWith('an_')) {
          console.log(`   ⚠️  ${name} (Legacy - should have been deleted!)`);
        } else {
          console.log(`   ✅ ${name} (Production Table)`);
        }
      });
    }

    console.log('\n✅ Legacy table cleanup complete!');
    console.log('==========================================\n');

  } catch (error) {
    console.error('❌ Unexpected error:', error);
    process.exit(1);
  }
}

// Execute cleanup
executeCleanup()
  .then(() => {
    console.log('✨ Done!');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  });
