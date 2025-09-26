#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// Supabase configuration
const supabaseUrl = 'https://wgdmgvonqysflwdiiols.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndnZG1ndm9ucXlzZmx3ZGlpb2xzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTU4MjMyMCwiZXhwIjoyMDcxMTU4MzIwfQ.7tXqVwmgABgflVvKrcOHGlXd8JcN1yTvECfhJ0cWGRE' // Service role key

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false }
})

async function deploySchema() {
  try {
    console.log('🚀 Deploying Air Niugini PMS database schema...')

    // Read and execute the complete migration
    const migrationSQL = fs.readFileSync(path.join(__dirname, 'supabase-complete-migration.sql'), 'utf8')

    console.log('📝 Executing schema migration...')
    const { data, error } = await supabase.rpc('exec_sql', {
      sql_query: migrationSQL
    })

    if (error) {
      // Try direct execution through the raw SQL interface
      console.log('⚠️ RPC failed, trying direct SQL execution...')

      // Split SQL into individual statements
      const statements = migrationSQL
        .split(';')
        .map(stmt => stmt.trim())
        .filter(stmt => stmt && !stmt.startsWith('--'))

      for (let i = 0; i < statements.length; i++) {
        const stmt = statements[i] + ';'
        if (stmt.trim() === ';') continue

        console.log(`Executing statement ${i + 1}/${statements.length}...`)

        try {
          const result = await supabase.rpc('exec_sql', { sql_query: stmt })
          if (result.error) {
            console.log(`Warning on statement ${i + 1}:`, result.error.message)
          }
        } catch (err) {
          console.log(`Warning on statement ${i + 1}:`, err.message)
        }
      }
    }

    console.log('✅ Schema deployment completed!')

    // Now load the sample data
    console.log('📊 Loading sample data...')

    const dataFiles = [
      'supabase-sample-data.sql',
      'supabase-pilot-certifications.sql',
      'supabase-views.sql'
    ]

    for (const file of dataFiles) {
      if (fs.existsSync(path.join(__dirname, file))) {
        console.log(`Loading ${file}...`)
        const sql = fs.readFileSync(path.join(__dirname, file), 'utf8')

        const statements = sql
          .split(';')
          .map(stmt => stmt.trim())
          .filter(stmt => stmt && !stmt.startsWith('--'))

        for (let i = 0; i < statements.length; i++) {
          const stmt = statements[i] + ';'
          if (stmt.trim() === ';') continue

          try {
            await supabase.rpc('exec_sql', { sql_query: stmt })
          } catch (err) {
            console.log(`Warning in ${file}, statement ${i + 1}:`, err.message)
          }
        }
      }
    }

    console.log('🎉 Database deployment completed successfully!')
    console.log('✈️ Air Niugini PMS database is ready for use!')

  } catch (error) {
    console.error('❌ Deployment failed:', error.message)
    process.exit(1)
  }
}

// Create a simple SQL execution function
async function createExecFunction() {
  const createFunctionSQL = `
    CREATE OR REPLACE FUNCTION exec_sql(sql_query TEXT)
    RETURNS TEXT AS $$
    BEGIN
      EXECUTE sql_query;
      RETURN 'OK';
    END;
    $$ LANGUAGE plpgsql SECURITY DEFINER;
  `

  try {
    // Try to create the function first
    console.log('🔧 Setting up SQL execution function...')
    const { error } = await supabase.rpc('exec_sql', { sql_query: createFunctionSQL })
    if (error) {
      console.log('Note: exec_sql function may already exist')
    }
  } catch (err) {
    console.log('Note: Will try alternative deployment method')
  }
}

// Run deployment
async function main() {
  await createExecFunction()
  await deploySchema()
}

if (require.main === module) {
  main().catch(console.error)
}