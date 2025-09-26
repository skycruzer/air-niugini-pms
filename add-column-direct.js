#!/usr/bin/env node

/**
 * Add seniority_number column directly using service role key
 * Run with: node add-column-direct.js
 */

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

console.log('🔑 Using Service Role Key for database modifications...')
console.log('🔗 Project URL:', supabaseUrl)

// Use service role key for admin access
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function addColumn() {
  try {
    console.log('🔧 Attempting to add seniority_number column...')

    // Try using a PostgreSQL function to add the column
    const alterTableSQL = `
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'pilots' AND column_name = 'seniority_number'
        ) THEN
          ALTER TABLE pilots ADD COLUMN seniority_number INTEGER;
          CREATE INDEX IF NOT EXISTS idx_pilots_seniority_number ON pilots(seniority_number);
        END IF;
      END $$;
    `

    // Execute the SQL directly using the REST API
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'apikey': supabaseServiceKey,
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify({
        query: alterTableSQL
      })
    })

    if (!response.ok) {
      console.log('❌ REST API approach failed, trying direct SQL...')

      // Try using raw SQL through Supabase client
      const { data, error } = await supabase.rpc('exec_sql', {
        sql: alterTableSQL
      })

      if (error) {
        console.error('❌ exec_sql failed:', error.message)

        // Try using PostgreSQL's query interface directly
        console.log('🔧 Trying alternative approach with prepared statement...')

        const { data: checkResult, error: checkError } = await supabase
          .from('information_schema.columns')
          .select('column_name')
          .eq('table_name', 'pilots')
          .eq('column_name', 'seniority_number')

        if (checkError) {
          console.error('❌ Cannot check if column exists:', checkError.message)
          return false
        }

        if (checkResult && checkResult.length > 0) {
          console.log('✅ Column already exists!')
          return await populateSeniority()
        } else {
          console.log('❌ Cannot add column through any method')
          console.log('💡 The system will continue using on-the-fly calculation')
          return false
        }
      } else {
        console.log('✅ Column added successfully via exec_sql!')
      }
    } else {
      console.log('✅ Column added successfully via REST API!')
    }

    return await populateSeniority()

  } catch (error) {
    console.error('❌ Error adding column:', error.message)
    return false
  }
}

async function populateSeniority() {
  try {
    console.log('📊 Populating seniority numbers...')

    // Get all pilots ordered by commencement date
    const { data: pilots, error } = await supabase
      .from('pilots')
      .select('id, employee_id, first_name, last_name, commencement_date')
      .not('commencement_date', 'is', null)
      .order('commencement_date', { ascending: true })

    if (error) throw error

    console.log(`Found ${pilots.length} pilots with commencement dates`)

    // Update each pilot's seniority number
    for (let i = 0; i < pilots.length; i++) {
      const pilot = pilots[i]
      const seniority = i + 1

      const { error: updateError } = await supabase
        .from('pilots')
        .update({ seniority_number: seniority })
        .eq('id', pilot.id)

      if (updateError) {
        console.error(`❌ Failed to update ${pilot.first_name} ${pilot.last_name}:`, updateError.message)
        return false
      } else {
        console.log(`✅ #${seniority.toString().padStart(2)} - ${pilot.first_name} ${pilot.last_name}`)
      }
    }

    console.log('🎉 Seniority numbers populated successfully!')
    return true

  } catch (error) {
    console.error('❌ Error populating seniority:', error.message)
    return false
  }
}

// Run the function
addColumn().then(success => {
  if (success) {
    console.log('\n🎯 Database update completed successfully!')
    console.log('   The seniority_number column has been added and populated.')
  } else {
    console.log('\n💡 Database update not completed.')
    console.log('   The application will continue using on-the-fly seniority calculation.')
  }
})