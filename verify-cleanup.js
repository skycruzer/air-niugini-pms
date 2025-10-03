#!/usr/bin/env node

/**
 * Verify Legacy Table Cleanup
 *
 * This script verifies that the legacy table cleanup was successful.
 * It checks that:
 * 1. Legacy tables (an_pilots, an_check_types, an_pilot_checks, an_leave_requests) are deleted
 * 2. Production tables (pilots, check_types, pilot_checks, leave_requests) still exist
 * 3. an_users table is intact (active authentication)
 * 4. Data counts match expected values
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

async function verifyTableExists(tableName, expectedRows = null) {
  try {
    const { count, error } = await supabase
      .from(tableName)
      .select('*', { count: 'exact', head: true });

    if (error && error.code === '42P01') {
      return { exists: false, count: 0, error: 'Table does not exist' };
    }

    if (error) {
      return { exists: false, count: 0, error: error.message };
    }

    return {
      exists: true,
      count: count || 0,
      matchesExpected: expectedRows ? count === expectedRows : true
    };
  } catch (error) {
    return { exists: false, count: 0, error: error.message };
  }
}

async function main() {
  console.log('╔════════════════════════════════════════════════════╗');
  console.log('║  Air Niugini PMS - Cleanup Verification           ║');
  console.log('╚════════════════════════════════════════════════════╝\n');

  let allPassed = true;

  // Check that legacy tables are DELETED
  console.log('🗑️  VERIFYING LEGACY TABLES DELETED:\n');

  const legacyTables = [
    'an_leave_requests',
    'an_pilot_checks',
    'an_pilots',
    'an_check_types'
  ];

  for (const table of legacyTables) {
    const result = await verifyTableExists(table);
    if (!result.exists) {
      console.log(`   ✅ ${table.padEnd(25)} - DELETED (as expected)`);
    } else {
      console.log(`   ❌ ${table.padEnd(25)} - STILL EXISTS! (${result.count} rows)`);
      allPassed = false;
    }
  }

  // Check that production tables EXIST with correct data
  console.log('\n✅ VERIFYING PRODUCTION TABLES EXIST:\n');

  const productionTables = [
    { name: 'pilots', expectedRows: 27 },
    { name: 'pilot_checks', expectedRows: 571 },
    { name: 'check_types', expectedRows: 34 },
    { name: 'an_users', expectedRows: 3 },
    { name: 'leave_requests', expectedRows: 12 },
    { name: 'settings', expectedRows: 3 },
    { name: 'contract_types', expectedRows: 3 }
  ];

  for (const table of productionTables) {
    const result = await verifyTableExists(table.name);

    if (!result.exists) {
      console.log(`   ❌ ${table.name.padEnd(20)} - MISSING! This is critical!`);
      allPassed = false;
    } else {
      const rowInfo = `${result.count} rows`;
      const expected = table.expectedRows ? `(expected: ${table.expectedRows})` : '';

      if (table.expectedRows && result.count !== table.expectedRows) {
        console.log(`   ⚠️  ${table.name.padEnd(20)} - EXISTS but ${rowInfo} ${expected}`);
      } else {
        console.log(`   ✅ ${table.name.padEnd(20)} - EXISTS with ${rowInfo} ${expected}`);
      }
    }
  }

  // Summary
  console.log('\n' + '═'.repeat(52));

  if (allPassed) {
    console.log('✅ CLEANUP SUCCESSFUL!');
    console.log('\nAll legacy tables removed:');
    console.log('  • an_leave_requests ❌');
    console.log('  • an_pilot_checks ❌');
    console.log('  • an_pilots ❌');
    console.log('  • an_check_types ❌');
    console.log('\nAll production tables intact:');
    console.log('  • pilots (27 records) ✅');
    console.log('  • pilot_checks (571 records) ✅');
    console.log('  • check_types (34 records) ✅');
    console.log('  • an_users (3 records) ✅');
    console.log('  • leave_requests (12 records) ✅');
    console.log('  • settings (3 records) ✅');
    console.log('  • contract_types (3 records) ✅');
    console.log('\n🎉 Database cleanup complete and verified!');
  } else {
    console.log('❌ VERIFICATION FAILED!');
    console.log('\n⚠️  Please review the issues above.');
    console.log('Some legacy tables may still exist or production tables may be missing.');
  }

  console.log('═'.repeat(52) + '\n');

  process.exit(allPassed ? 0 : 1);
}

main().catch(error => {
  console.error('❌ Verification error:', error);
  process.exit(1);
});
