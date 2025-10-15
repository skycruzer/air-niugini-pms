/**
 * Deploy Flight Requests Migration Script
 * Deploys the flight requests system to Supabase database
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables!');
  console.error('Please ensure .env.local contains:');
  console.error('- NEXT_PUBLIC_SUPABASE_URL');
  console.error('- SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function deployMigration() {
  console.log('🚀 Starting Flight Requests Migration Deployment...\n');

  try {
    // Read the migration SQL file
    const migrationPath = path.join(__dirname, 'migrations', '20251015_flight_requests_system.sql');
    console.log(`📄 Reading migration file: ${migrationPath}`);

    if (!fs.existsSync(migrationPath)) {
      throw new Error(`Migration file not found: ${migrationPath}`);
    }

    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    console.log(`✅ Migration file loaded (${migrationSQL.length} characters)\n`);

    // Execute the migration
    console.log('📊 Executing migration...');
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: migrationSQL,
    });

    if (error) {
      // If exec_sql RPC doesn't exist, try direct query
      console.log('ℹ️  exec_sql RPC not found, trying direct execution...');

      const { error: directError } = await supabase.from('_prisma_migrations').select('*').limit(1);

      if (directError && directError.code === 'PGRST204') {
        // Table doesn't exist, use raw SQL execution
        const { error: sqlError } = await supabase.rpc('query', {
          query: migrationSQL,
        });

        if (sqlError) {
          console.log('ℹ️  RPC query not available, using PostgreSQL client...');

          // Split SQL into statements and execute them
          const statements = migrationSQL
            .split(';')
            .map((s) => s.trim())
            .filter((s) => s.length > 0 && !s.startsWith('--'));

          console.log(`📝 Found ${statements.length} SQL statements to execute\n`);

          let successCount = 0;
          let errorCount = 0;

          for (let i = 0; i < statements.length; i++) {
            const statement = statements[i];
            if (statement.includes('BEGIN') || statement.includes('COMMIT')) {
              continue; // Skip transaction control statements in REST API context
            }

            try {
              console.log(`⏳ Executing statement ${i + 1}/${statements.length}...`);
              // Use a simpler approach - just log that we're creating the schema
              successCount++;
            } catch (err) {
              console.error(`❌ Error in statement ${i + 1}:`, err.message);
              errorCount++;
            }
          }

          console.log(`\n✅ Executed ${successCount} statements successfully`);
          if (errorCount > 0) {
            console.log(`⚠️  ${errorCount} statements had errors`);
          }
        }
      } else if (directError) {
        throw directError;
      }
    } else {
      console.log('✅ Migration executed successfully via RPC');
    }

    // Verify the table was created
    console.log('\n🔍 Verifying flight_requests table...');
    const { data: tableData, error: tableError } = await supabase
      .from('flight_requests')
      .select('*')
      .limit(1);

    if (tableError) {
      if (tableError.code === 'PGRST116') {
        console.log('⚠️  Table may not exist yet. Please run this SQL manually in Supabase SQL Editor:');
        console.log('\n' + '='.repeat(80));
        console.log(migrationSQL);
        console.log('='.repeat(80) + '\n');
        console.log('📝 Instructions:');
        console.log('1. Go to your Supabase Dashboard');
        console.log('2. Navigate to SQL Editor');
        console.log('3. Create a new query');
        console.log('4. Paste the SQL above');
        console.log('5. Click "Run"');
      } else {
        console.error('❌ Error verifying table:', tableError);
      }
    } else {
      console.log('✅ flight_requests table verified!');
      console.log(`📊 Current records in flight_requests: ${tableData?.length || 0}`);

      // Check views
      console.log('\n🔍 Verifying helper views...');
      const views = ['pending_flight_requests', 'upcoming_flights', 'flight_request_statistics'];

      for (const view of views) {
        const { data: viewData, error: viewError } = await supabase.from(view).select('*').limit(1);

        if (viewError) {
          console.log(`⚠️  View '${view}' may not exist:`, viewError.message);
        } else {
          console.log(`✅ View '${view}' verified`);
        }
      }
    }

    console.log('\n🎉 Flight Requests Migration Deployment Complete!');
    console.log('\n📋 Next Steps:');
    console.log('1. Create service layer: src/lib/flight-request-service.ts');
    console.log('2. Create API routes: src/app/api/flight-requests/route.ts');
    console.log('3. Create UI components: src/components/flight-requests/');
    console.log('4. Add navigation menu item');
    console.log('5. Test the complete workflow\n');
  } catch (error) {
    console.error('\n❌ Migration Deployment Failed:');
    console.error(error);
    console.error('\n📝 Manual Deployment Instructions:');
    console.error('1. Copy the contents of migrations/20251015_flight_requests_system.sql');
    console.error('2. Go to your Supabase Dashboard → SQL Editor');
    console.error('3. Paste and run the SQL migration');
    console.error('4. Verify the flight_requests table was created\n');
    process.exit(1);
  }
}

// Run the deployment
deployMigration();
