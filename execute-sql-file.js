#!/usr/bin/env node

/**
 * Execute any SQL file directly using Supabase client
 * Run with: node execute-sql-file.js <filename.sql>
 */

const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');
const { config } = require('dotenv');

// Load environment variables
config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

// Get filename from command line argument
const filename = process.argv[2];
if (!filename) {
  console.error('❌ Usage: node execute-sql-file.js <filename.sql>');
  process.exit(1);
}

if (!fs.existsSync(filename)) {
  console.error(`❌ File not found: ${filename}`);
  process.exit(1);
}

// Create Supabase client with service role
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function executeSQLFile() {
  try {
    console.log(`📋 Reading SQL file: ${filename}...`);
    const sqlContent = fs.readFileSync(filename, 'utf8');

    console.log('🔧 Executing SQL on remote database...');
    console.log('SQL Content:');
    console.log('=' + '='.repeat(60));
    console.log(sqlContent);
    console.log('=' + '='.repeat(60));

    // Split the SQL into individual statements
    const statements = sqlContent
      .split(';')
      .map((stmt) => stmt.trim())
      .filter((stmt) => {
        if (!stmt || stmt.length === 0) return false;
        const lines = stmt.split('\n').filter((line) => {
          const trimmed = line.trim();
          return trimmed.length > 0 && !trimmed.startsWith('--');
        });
        return lines.length > 0;
      })
      .map((stmt) => {
        return stmt
          .split('\n')
          .filter((line) => {
            const trimmed = line.trim();
            return trimmed.length > 0 && !trimmed.startsWith('--');
          })
          .join('\n')
          .trim();
      });

    console.log(`\n📝 Found ${statements.length} SQL statements to execute...`);

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      console.log(`\n⚡ Executing statement ${i + 1}/${statements.length}:`);
      console.log(`   ${statement.substring(0, 80)}...`);

      try {
        // Try direct query execution using Supabase client
        const { data, error } = await supabase.rpc('exec_sql', {
          sql: statement + ';',
        });

        if (error) {
          // If exec_sql doesn't exist, try alternative for CREATE VIEW
          if (error.message.includes('Could not find the function')) {
            console.log(`   ⚡ Trying alternative execution method...`);

            // For SELECT queries, try direct query
            if (statement.toUpperCase().includes('SELECT') && !statement.toUpperCase().includes('CREATE')) {
              const selectResult = await supabase.from('raw').select(statement);
              if (selectResult.error) {
                console.error(`   ❌ Failed:`, selectResult.error.message);
              } else {
                console.log(`   ✅ Query executed successfully`);
                if (selectResult.data) {
                  console.log(`   📊 Returned ${selectResult.data.length} rows`);
                }
              }
              continue;
            }

            // For other statements, we need exec_sql function
            console.log(`   ⚠️  exec_sql function not available`);
            console.log(`   💡 Please execute this SQL manually in Supabase SQL Editor`);
            continue;
          }

          // If it's an "already exists" error, that's OK
          if (
            error.message.includes('already exists') ||
            error.message.includes('duplicate')
          ) {
            console.log(`   ⚠️  Resource already exists, continuing...`);
            continue;
          }

          throw error;
        }

        console.log(`   ✅ Statement ${i + 1} executed successfully`);
      } catch (statementError) {
        console.error(`   ❌ Error in statement ${i + 1}:`, statementError.message);

        if (statementError.message.includes('already exists')) {
          console.log('   ⚠️  Resource already exists, continuing...');
          continue;
        }

        // Don't stop on errors for non-critical statements
        console.log('   ⚠️  Continuing with remaining statements...');
      }
    }

    console.log('\n🎉 SQL file execution completed!');
    console.log('\n💡 Note: If some statements failed due to missing exec_sql function,');
    console.log('   please execute them manually in the Supabase SQL Editor at:');
    console.log(`   ${supabaseUrl.replace('.supabase.co', '.supabase.co/project/_/sql')}`);
  } catch (error) {
    console.error('❌ Execution failed:', error.message);
    console.error('\n💡 Please try executing the SQL manually in Supabase SQL Editor');
    process.exit(1);
  }
}

// Execute the SQL file
executeSQLFile();
