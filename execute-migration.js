#!/usr/bin/env node

/**
 * Execute migration directly using pg client
 * Run with: node execute-migration.js
 */

const fs = require('fs')
const { createClient } = require('@supabase/supabase-js')
const { config } = require('dotenv')

// Load environment variables
config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables')
  process.exit(1)
}

// Create Supabase client with service role
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function executeMigration() {
  try {
    console.log('📋 Reading migration SQL file...')
    const sqlContent = fs.readFileSync('./seniority-migration.sql', 'utf8')

    console.log('🔧 Executing migration on remote database...')
    console.log('SQL Content:')
    console.log('=' + '='.repeat(60))
    console.log(sqlContent)
    console.log('=' + '='.repeat(60))

    // Split the SQL into individual statements
    const statements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => {
        // Remove empty statements and comment-only statements
        if (!stmt || stmt.length === 0) return false

        // Remove comment lines
        const lines = stmt.split('\n').filter(line => {
          const trimmed = line.trim()
          return trimmed.length > 0 && !trimmed.startsWith('--')
        })

        return lines.length > 0
      })
      .map(stmt => {
        // Clean up each statement by removing comment lines
        return stmt.split('\n')
          .filter(line => {
            const trimmed = line.trim()
            return trimmed.length > 0 && !trimmed.startsWith('--')
          })
          .join('\n')
          .trim()
      })

    console.log(`\n📝 Found ${statements.length} SQL statements to execute...`)

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i]
      console.log(`\n⚡ Executing statement ${i + 1}/${statements.length}:`)
      console.log(`   ${statement.substring(0, 50)}...`)

      try {
        // Execute each statement individually using RPC
        const { data, error } = await supabase.rpc('exec_sql', {
          sql: statement + ';'
        })

        if (error) {
          console.error(`❌ Failed to execute statement ${i + 1}:`, error.message)

          // If it's a column already exists error, that's OK
          if (error.message.includes('already exists') || error.message.includes('duplicate column')) {
            console.log(`   ⚠️  Column may already exist, continuing...`)
            continue
          }

          // If exec_sql function doesn't exist, try alternative approach
          if (error.message.includes('Could not find the function public.exec_sql')) {
            console.log(`   ⚡ exec_sql not available, trying direct query execution...`)

            // For ALTER TABLE, we need to use a different approach
            if (statement.toUpperCase().includes('ALTER TABLE')) {
              console.log(`   ⚠️  Cannot execute ALTER TABLE without exec_sql function`)
              console.log(`   💡 The database schema may not allow direct alterations`)
              continue
            }
          }

          throw error
        }

        console.log(`   ✅ Statement ${i + 1} executed successfully`)

      } catch (statementError) {
        console.error(`❌ Error in statement ${i + 1}:`, statementError.message)

        // Continue with remaining statements for non-critical errors
        if (statementError.message.includes('already exists')) {
          console.log('   ⚠️  Resource already exists, continuing...')
          continue
        }
      }
    }

    console.log('\n🎉 Migration execution completed!')

    // Verify the column was added
    console.log('\n🔍 Verifying column addition...')
    await verifyColumn()

  } catch (error) {
    console.error('❌ Migration failed:', error.message)

    // Check if we can at least verify current state
    console.log('\n💡 Checking current database state...')
    await verifyColumn()
  }
}

async function verifyColumn() {
  try {
    // Try to query the pilots table to see if seniority_number column exists
    const { data: pilots, error } = await supabase
      .from('pilots')
      .select('id, seniority_number, first_name, last_name, commencement_date')
      .not('commencement_date', 'is', null)
      .order('commencement_date', { ascending: true })
      .limit(5)

    if (error) {
      if (error.message.includes('seniority_number') && error.message.includes('does not exist')) {
        console.log('❌ Column seniority_number does not exist in the database')
        console.log('💡 Continuing with on-the-fly calculation approach')
        return false
      }
      throw error
    }

    console.log('✅ Column seniority_number exists!')
    console.log('📊 Sample data:')
    pilots.forEach((pilot, index) => {
      console.log(`   #${pilot.seniority_number || (index + 1)} - ${pilot.first_name} ${pilot.last_name}`)
    })

    return true

  } catch (error) {
    console.error('❌ Verification failed:', error.message)
    return false
  }
}

// Execute the migration
executeMigration()