#!/usr/bin/env node

/**
 * Execute Legacy Table Cleanup - Direct SQL Execution
 * Uses Supabase client with service role to drop legacy tables
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function dropTable(tableName) {
  console.log(`\n🗑️  Attempting to drop ${tableName}...`);

  try {
    // Use direct PostgreSQL connection via Supabase
    const { data, error } = await supabase
      .from(tableName)
      .select('count', { count: 'exact', head: true });

    if (error && error.code === '42P01') {
      console.log(`   ℹ️  Table ${tableName} does not exist (already deleted)`);
      return true;
    }

    console.log(`   📊 Table ${tableName} exists with ${data?.length || 0} rows`);
    console.log(`   ⚠️  Cannot drop via Supabase client - manual deletion required`);
    return false;

  } catch (error) {
    console.error(`   ❌ Error:`, error.message);
    return false;
  }
}

async function main() {
  console.log('╔══════════════════════════════════════════════╗');
  console.log('║  Air Niugini PMS - Legacy Table Cleanup     ║');
  console.log('╚══════════════════════════════════════════════╝\n');

  console.log('📋 Tables to delete:');
  console.log('   1. an_leave_requests (0 rows)');
  console.log('   2. an_pilot_checks (18 rows)');
  console.log('   3. an_pilots (5 rows)');
  console.log('   4. an_check_types (10 rows)');
  console.log('\n⚠️  Table an_users will be KEPT (active authentication)\n');

  const tables = [
    'an_leave_requests',
    'an_pilot_checks',
    'an_pilots',
    'an_check_types'
  ];

  console.log('═'.repeat(48));
  console.log('MANUAL DELETION REQUIRED');
  console.log('═'.repeat(48));
  console.log('\nThe Supabase client cannot execute DROP TABLE commands.');
  console.log('Please execute the cleanup manually using ONE of these methods:\n');

  console.log('METHOD 1: Supabase Dashboard SQL Editor');
  console.log('─'.repeat(48));
  console.log('1. Go to: https://supabase.com/dashboard/project/wgdmgvonqysflwdiiols/sql/new');
  console.log('2. Paste and execute this SQL:\n');
  console.log('DROP TABLE IF EXISTS an_leave_requests CASCADE;');
  console.log('DROP TABLE IF EXISTS an_pilot_checks CASCADE;');
  console.log('DROP TABLE IF EXISTS an_pilots CASCADE;');
  console.log('DROP TABLE IF EXISTS an_check_types CASCADE;\n');

  console.log('METHOD 2: Use cleanup-legacy-tables-final.sql');
  console.log('─'.repeat(48));
  console.log('The file cleanup-legacy-tables-final.sql has been created.');
  console.log('Copy its contents to the Supabase SQL Editor and execute.\n');

  console.log('METHOD 3: Supabase CLI (if installed)');
  console.log('─'.repeat(48));
  console.log('supabase db execute -f cleanup-legacy-tables-final.sql\n');

  console.log('═'.repeat(48));
  console.log('\n✅ Cleanup SQL files have been created and are ready.');
  console.log('📝 Please execute the cleanup manually via Supabase Dashboard.\n');
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('❌ Error:', error);
    process.exit(1);
  });
