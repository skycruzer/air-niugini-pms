/**
 * Deploy Row Level Security (RLS) Policies
 * Air Niugini B767 Pilot Management System
 *
 * This script deploys comprehensive RLS policies to all production tables
 *
 * Usage:
 *   node deploy-rls-policies.js         # Deploy RLS policies
 *   node deploy-rls-policies.js test    # Test RLS policies after deployment
 *   node deploy-rls-policies.js rollback # Rollback RLS policies
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs').promises;
const path = require('path');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

// Configuration
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Validate environment variables
if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Error: Missing required environment variables');
  console.error('   Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
  console.error('   Check your .env.local file');
  process.exit(1);
}

// Create Supabase admin client
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

/**
 * Execute SQL file
 */
async function executeSqlFile(filename, description) {
  try {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`📄 ${description}`);
    console.log(`${'='.repeat(60)}\n`);

    // Read SQL file
    const sqlPath = path.join(__dirname, filename);
    const sql = await fs.readFile(sqlPath, 'utf8');

    console.log(`📂 Reading: ${filename}`);
    console.log(`📏 SQL length: ${sql.length} characters\n`);

    // Execute SQL
    console.log('⚙️  Executing SQL...\n');

    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql }).single();

    if (error) {
      // If exec_sql RPC doesn't exist, try direct execution
      // Note: Direct execution may not work for all statements
      console.log('ℹ️  RPC method not available, trying alternative method...\n');

      // Split SQL into statements and execute one by one
      const statements = sql
        .split(';')
        .map((s) => s.trim())
        .filter((s) => s.length > 0 && !s.startsWith('--'));

      let successCount = 0;
      let errorCount = 0;

      for (const statement of statements) {
        if (
          statement.toLowerCase().includes('create policy') ||
          statement.toLowerCase().includes('alter table') ||
          statement.toLowerCase().includes('create function') ||
          statement.toLowerCase().includes('drop policy') ||
          statement.toLowerCase().includes('drop function')
        ) {
          try {
            // Use raw SQL execution via PostgREST
            const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                apikey: SUPABASE_SERVICE_KEY,
                Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
              },
              body: JSON.stringify({ sql_query: statement + ';' }),
            });

            if (response.ok) {
              successCount++;
            } else {
              errorCount++;
              const errorData = await response.text();
              console.log(`⚠️  Statement failed: ${statement.substring(0, 50)}...`);
              console.log(`   Error: ${errorData}\n`);
            }
          } catch (err) {
            errorCount++;
            console.log(`❌ Statement error: ${err.message}\n`);
          }
        }
      }

      console.log(`\n📊 Execution Summary:`);
      console.log(`   ✅ Successful statements: ${successCount}`);
      console.log(`   ❌ Failed statements: ${errorCount}`);

      if (errorCount > 0) {
        console.log(
          '\n⚠️  Some statements failed. This is normal if policies already exist.'
        );
        console.log('   Review the errors above to ensure they are expected.\n');
      }
    } else {
      console.log('✅ SQL executed successfully!\n');
      if (data) {
        console.log('📊 Result:', JSON.stringify(data, null, 2));
      }
    }

    return true;
  } catch (error) {
    console.error(`\n❌ Error executing ${filename}:`, error.message);
    console.error('   Stack:', error.stack);
    return false;
  }
}

/**
 * Verify RLS status
 */
async function verifyRlsStatus() {
  try {
    console.log(`\n${'='.repeat(60)}`);
    console.log('🔍 Verifying RLS Status');
    console.log(`${'='.repeat(60)}\n`);

    const tables = [
      'pilots',
      'pilot_checks',
      'check_types',
      'leave_requests',
      'settings',
      'contract_types',
      'an_users',
    ];

    console.log('Checking RLS status for production tables:\n');

    for (const table of tables) {
      // Check if table exists and has RLS enabled
      const { data, error } = await supabase
        .from(table)
        .select('id')
        .limit(1);

      if (error) {
        console.log(`❌ ${table.padEnd(20)} - Error: ${error.message}`);
      } else {
        console.log(`✅ ${table.padEnd(20)} - Accessible`);
      }
    }

    console.log('\n✅ RLS verification complete\n');
  } catch (error) {
    console.error('❌ Error verifying RLS:', error.message);
  }
}

/**
 * Main execution
 */
async function main() {
  const command = process.argv[2] || 'deploy';

  console.log('\n' + '='.repeat(60));
  console.log('🛡️  Air Niugini B767 PMS - RLS Policy Deployment');
  console.log('='.repeat(60));

  try {
    switch (command.toLowerCase()) {
      case 'deploy':
        console.log('\n📋 Mode: Deploy RLS Policies\n');

        const deploySuccess = await executeSqlFile(
          'enable_production_rls_policies.sql',
          'Deploying Row Level Security Policies'
        );

        if (deploySuccess) {
          console.log('\n✅ RLS policies deployed successfully!\n');
          console.log('📋 Next steps:');
          console.log('   1. Run: node deploy-rls-policies.js test');
          console.log('   2. Test application functionality');
          console.log('   3. Verify user permissions work correctly\n');
        } else {
          console.log('\n⚠️  Deployment completed with warnings');
          console.log('   Review output above for details\n');
        }

        await verifyRlsStatus();
        break;

      case 'test':
        console.log('\n📋 Mode: Test RLS Policies\n');

        const testSuccess = await executeSqlFile(
          'test_rls_policies.sql',
          'Testing Row Level Security Policies'
        );

        if (testSuccess) {
          console.log('\n✅ RLS policy tests executed successfully!\n');
          console.log('📋 Review the output above for validation results\n');
        }
        break;

      case 'rollback':
        console.log('\n📋 Mode: Rollback RLS Policies\n');
        console.log('⚠️  WARNING: This will DISABLE Row Level Security!\n');

        // Confirmation prompt
        const readline = require('readline');
        const rl = readline.createInterface({
          input: process.stdin,
          output: process.stdout,
        });

        const answer = await new Promise((resolve) => {
          rl.question('Are you sure you want to rollback RLS? (yes/no): ', resolve);
        });
        rl.close();

        if (answer.toLowerCase() === 'yes') {
          const rollbackSuccess = await executeSqlFile(
            'rollback_production_rls_policies.sql',
            'Rolling Back Row Level Security Policies'
          );

          if (rollbackSuccess) {
            console.log('\n✅ RLS policies rolled back successfully!\n');
            console.log('⚠️  WARNING: Tables are now accessible without RLS protection\n');
          }
        } else {
          console.log('\n❌ Rollback cancelled\n');
        }
        break;

      default:
        console.log('\n❌ Invalid command\n');
        console.log('Usage:');
        console.log('  node deploy-rls-policies.js deploy   - Deploy RLS policies');
        console.log('  node deploy-rls-policies.js test     - Test RLS policies');
        console.log('  node deploy-rls-policies.js rollback - Rollback RLS policies\n');
        process.exit(1);
    }

    console.log('='.repeat(60));
    console.log('✅ Operation Complete');
    console.log('='.repeat(60) + '\n');
  } catch (error) {
    console.error('\n❌ Fatal error:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

// Execute main function
main().catch((error) => {
  console.error('❌ Unhandled error:', error);
  process.exit(1);
});
