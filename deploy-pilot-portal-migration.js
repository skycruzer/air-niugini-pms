/**
 * Deploy Pilot Portal & Feedback Platform Migration
 * Safely applies the database schema changes for new features
 */

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
  console.log('\n' + '='.repeat(70));
  log(title, 'bright');
  console.log('='.repeat(70) + '\n');
}

async function main() {
  logSection('🚀 B767 Pilot Portal & Feedback Platform Migration');

  // Validate environment variables
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    log('❌ Error: Missing required environment variables', 'red');
    log('   Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY', 'yellow');
    process.exit(1);
  }

  log(`📍 Database: ${supabaseUrl}`, 'cyan');
  log(`🔐 Using service role key for admin access`, 'cyan');

  // Create Supabase admin client
  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  // Read migration file
  const migrationPath = path.join(__dirname, 'migrations', '20250110_pilot_portal_and_feedback_platform.sql');
  log(`\n📄 Reading migration file: ${path.basename(migrationPath)}`, 'blue');

  if (!fs.existsSync(migrationPath)) {
    log(`❌ Migration file not found: ${migrationPath}`, 'red');
    process.exit(1);
  }

  const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
  const lines = migrationSQL.split('\n').length;
  log(`✅ Migration loaded: ${lines} lines`, 'green');

  // Confirm before proceeding
  log('\n⚠️  This migration will:', 'yellow');
  log('   • Create 5 new tables (pilot_users, feedback_categories, feedback_posts, feedback_comments, notifications)', 'yellow');
  log('   • Modify leave_requests table (add submission_type, pilot_user_id columns)', 'yellow');
  log('   • Create comprehensive RLS policies', 'yellow');
  log('   • Insert 6 default feedback categories', 'yellow');
  log('   • Create helper functions and database views', 'yellow');

  log('\n🔍 Starting migration deployment...', 'cyan');

  try {
    // Execute migration
    log('\n📊 Executing SQL migration...', 'blue');
    const { error } = await supabase.rpc('exec_sql', { sql: migrationSQL }).catch(async (err) => {
      // If exec_sql function doesn't exist, try direct query
      log('⚠️  exec_sql function not available, using direct query...', 'yellow');
      return await supabase.from('_migration_test').select('*').limit(0).then(() => {
        // Split and execute each statement
        return executeMigrationStatements(supabase, migrationSQL);
      });
    });

    if (error) {
      log(`\n❌ Migration failed: ${error.message}`, 'red');
      log(`\nError details:`, 'red');
      console.error(error);
      process.exit(1);
    }

    // Verify new tables exist
    log('\n✅ Migration executed successfully!', 'green');
    log('\n🔍 Verifying migration...', 'cyan');

    const tablesToVerify = [
      'pilot_users',
      'feedback_categories',
      'feedback_posts',
      'feedback_comments',
      'notifications',
    ];

    let verificationSuccess = true;

    for (const table of tablesToVerify) {
      const { data, error } = await supabase.from(table).select('*').limit(1);

      if (error) {
        log(`❌ Table verification failed: ${table}`, 'red');
        log(`   Error: ${error.message}`, 'red');
        verificationSuccess = false;
      } else {
        log(`✅ Table exists and accessible: ${table}`, 'green');
      }
    }

    // Verify leave_requests modifications
    const { data: leaveData, error: leaveError } = await supabase
      .from('leave_requests')
      .select('submission_type, pilot_user_id')
      .limit(1);

    if (leaveError && leaveError.message.includes('column')) {
      log(`❌ leave_requests table modification failed`, 'red');
      log(`   Error: ${leaveError.message}`, 'red');
      verificationSuccess = false;
    } else {
      log(`✅ leave_requests table modified successfully`, 'green');
    }

    // Check default categories
    const { data: categories, error: catError } = await supabase
      .from('feedback_categories')
      .select('name, slug')
      .eq('is_default', true);

    if (!catError && categories && categories.length > 0) {
      log(`\n✅ Default categories created: ${categories.length} categories`, 'green');
      categories.forEach((cat) => {
        log(`   • ${cat.name} (${cat.slug})`, 'cyan');
      });
    }

    if (verificationSuccess) {
      logSection('✅ MIGRATION COMPLETED SUCCESSFULLY');
      log('🎉 Pilot Portal & Feedback Platform database schema is ready!', 'green');
      log('\nNext steps:', 'cyan');
      log('  1. Update TypeScript types: npm run db:types (or use Supabase MCP)', 'cyan');
      log('  2. Build pilot registration UI', 'cyan');
      log('  3. Build feedback platform UI', 'cyan');
      log('  4. Test authentication flows', 'cyan');
      log('  5. Test RLS policies', 'cyan');
    } else {
      log('\n⚠️  Migration completed with some verification issues', 'yellow');
      log('Please review the errors above and fix as needed.', 'yellow');
    }
  } catch (error) {
    log('\n❌ Unexpected error during migration:', 'red');
    console.error(error);
    process.exit(1);
  }
}

/**
 * Execute migration by splitting into individual statements
 * Fallback for when exec_sql RPC is not available
 */
async function executeMigrationStatements(supabase, migrationSQL) {
  log('📝 Splitting migration into individual statements...', 'blue');

  // Split by semicolons but be careful with function definitions
  const statements = migrationSQL
    .split(/;\s*\n/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0 && !s.startsWith('--'));

  log(`   Found ${statements.length} statements to execute`, 'cyan');

  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i] + ';';

    // Skip comments
    if (statement.startsWith('--') || statement.trim() === ';') {
      continue;
    }

    // Log progress for longer migrations
    if (i % 10 === 0) {
      log(`   Processing statement ${i + 1}/${statements.length}...`, 'blue');
    }

    try {
      // Use Supabase client's underlying pg client if available
      // This is a simplified approach - in production, use proper migration tools
      const { error } = await supabase.rpc('exec_sql', { sql: statement });

      if (error) {
        // Some statements might fail gracefully (e.g., IF NOT EXISTS)
        if (error.message.includes('already exists')) {
          log(`   ⚠️  Skipping: ${error.message}`, 'yellow');
        } else {
          throw error;
        }
      }
    } catch (err) {
      log(`\n❌ Error executing statement ${i + 1}:`, 'red');
      log(statement.substring(0, 200) + '...', 'red');
      throw err;
    }
  }

  return { error: null };
}

// Run migration
main().catch((error) => {
  log('\n❌ Fatal error:', 'red');
  console.error(error);
  process.exit(1);
});
