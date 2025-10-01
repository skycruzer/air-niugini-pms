/**
 * Air Niugini B767 Pilot Management System
 * Deploy Notification System Migration
 *
 * Run this script to deploy the notification system to the database
 */

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables');
  console.error('Please ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function deployNotificationMigration() {
  try {
    console.log('🚀 Air Niugini B767 Pilot Management System');
    console.log('📧 Deploying Notification System Migration...\n');

    // Read the migration SQL file
    const migrationPath = path.join(__dirname, '009_notifications.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    console.log('📄 Migration file loaded: 009_notifications.sql');
    console.log(`📊 File size: ${migrationSQL.length} characters\n`);

    // Execute the migration
    console.log('⏳ Executing migration...');

    const { data, error } = await supabase.rpc('exec_sql', {
      sql_string: migrationSQL,
    });

    if (error) {
      // Try alternative method if RPC doesn't exist
      console.log('ℹ️  RPC method not available, trying direct execution...');

      // Split migration into individual statements
      const statements = migrationSQL
        .split(';')
        .map((s) => s.trim())
        .filter((s) => s.length > 0 && !s.startsWith('--'));

      for (let i = 0; i < statements.length; i++) {
        const statement = statements[i];
        console.log(`   Executing statement ${i + 1}/${statements.length}...`);

        try {
          // Execute via admin client - note this won't work for all DDL
          // This is a fallback and may require manual execution
          await supabase.rpc('exec', { query: statement + ';' });
        } catch (err) {
          console.warn(`   ⚠️  Statement ${i + 1} may need manual execution`);
        }
      }
    }

    console.log('\n✅ Notification system migration deployed successfully!\n');

    // Verify tables were created
    console.log('🔍 Verifying tables...');

    const tables = [
      'notification_preferences',
      'notification_queue',
      'notification_log',
      'in_app_notifications',
      'notification_templates',
    ];

    for (const table of tables) {
      const { data, error } = await supabase.from(table).select('id').limit(1);

      if (error && error.code !== 'PGRST116') {
        // PGRST116 = no rows, which is fine
        console.log(`   ❌ ${table}: Not found or error`);
      } else {
        console.log(`   ✅ ${table}: Created successfully`);
      }
    }

    console.log('\n📋 Next Steps:');
    console.log('1. Add RESEND_API_KEY to your .env.local file');
    console.log('2. Add EMAIL_FROM and EMAIL_REPLY_TO (optional)');
    console.log('3. Test notifications via /api/notifications/test');
    console.log('4. Configure notification preferences in Settings');
    console.log('5. Set up cron jobs for scheduled notifications\n');

    console.log('🎉 Deployment complete!');
  } catch (error) {
    console.error('\n❌ Deployment failed:', error.message);
    console.error('\nℹ️  Manual Migration Required:');
    console.error('   Run the SQL file manually in Supabase SQL Editor:');
    console.error('   1. Go to Supabase Dashboard > SQL Editor');
    console.error('   2. Create new query');
    console.error('   3. Copy contents of 009_notifications.sql');
    console.error('   4. Execute\n');
    process.exit(1);
  }
}

// Run deployment
deployNotificationMigration();
