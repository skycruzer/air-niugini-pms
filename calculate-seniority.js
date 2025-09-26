#!/usr/bin/env node

/**
 * Calculate and optionally update seniority numbers for all pilots
 * Run with: node calculate-seniority.js
 */

const { createClient } = require('@supabase/supabase-js')
const { config } = require('dotenv')

// Load environment variables
config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables')
  console.error('NEXT_PUBLIC_SUPABASE_URL:', !!supabaseUrl)
  console.error('SUPABASE_SERVICE_ROLE_KEY:', !!supabaseServiceKey)
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function calculateAllSeniority() {
  try {
    console.log('📊 Fetching all pilots with commencement dates...')

    // Get all pilots with commencement dates
    const { data: pilots, error } = await supabase
      .from('pilots')
      .select('id, employee_id, first_name, last_name, commencement_date')
      .not('commencement_date', 'is', null)
      .order('commencement_date', { ascending: true })

    if (error) throw error

    console.log(`✅ Found ${pilots.length} pilots with commencement dates`)
    console.log('\n🏆 Seniority Rankings:')
    console.log('================================')

    pilots.forEach((pilot, index) => {
      const seniority = index + 1
      const commenceDate = new Date(pilot.commencement_date).toLocaleDateString()

      console.log(
        `#${seniority.toString().padStart(2)} - ${pilot.first_name} ${pilot.last_name} ` +
        `(${pilot.employee_id}) - ${commenceDate}`
      )
    })

    console.log('\n💡 To update database with these seniority numbers:')
    console.log('   1. Ensure database is not in read-only mode')
    console.log('   2. Run: node calculate-seniority.js --update')

    // Check if --update flag is provided
    if (process.argv.includes('--update')) {
      console.log('\n🔄 Updating database with seniority numbers...')

      for (let i = 0; i < pilots.length; i++) {
        const pilot = pilots[i]
        const seniority = i + 1

        try {
          const { error: updateError } = await supabase
            .from('pilots')
            .update({ seniority_number: seniority })
            .eq('id', pilot.id)

          if (updateError) {
            console.error(`❌ Failed to update ${pilot.first_name} ${pilot.last_name}:`, updateError.message)
          } else {
            console.log(`✅ Updated ${pilot.first_name} ${pilot.last_name} to seniority #${seniority}`)
          }
        } catch (err) {
          console.error(`❌ Error updating ${pilot.first_name} ${pilot.last_name}:`, err.message)
        }
      }

      console.log('\n🎉 Seniority update complete!')
    }

  } catch (error) {
    console.error('❌ Error:', error.message)
    process.exit(1)
  }
}

calculateAllSeniority()