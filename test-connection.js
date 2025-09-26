const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://wgdmgvonqysflwdiiols.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndnZG1ndm9ucXlzZmx3ZGlpb2xzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU1ODIzMjAsImV4cCI6MjA3MTE1ODMyMH0.MJrbK8qtJLJXz_mSHF9Le_DebGCXfZ4eXFd7h5JCKyk'

const supabase = createClient(supabaseUrl, supabaseKey)

async function testConnection() {
  try {
    console.log('🔍 Testing Supabase connection...')

    // Test basic connection by listing tables
    const { data, error } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .limit(5)

    if (error) {
      console.error('❌ Connection failed:', error.message)
    } else {
      console.log('✅ Connection successful!')
      console.log('📋 Current public tables:')
      data.forEach(table => console.log(`  - ${table.table_name}`))
    }

    // Check if our tables exist
    console.log('\n🔍 Checking for Air Niugini tables...')
    const { data: anTables, error: anError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .like('table_name', 'an_%')

    if (anTables && anTables.length > 0) {
      console.log('✅ Air Niugini tables found:')
      anTables.forEach(table => console.log(`  - ${table.table_name}`))
    } else {
      console.log('❌ No Air Niugini tables found. Need to create schema.')
    }

    // Test a simple query
    console.log('\n🧪 Testing a simple query...')
    const { data: testData, error: testError } = await supabase
      .from('an_pilots')
      .select('*')
      .limit(1)

    if (testError) {
      console.log('❌ an_pilots table not accessible:', testError.message)
    } else {
      console.log('✅ an_pilots table accessible!')
      if (testData.length > 0) {
        console.log('📊 Sample data exists')
      } else {
        console.log('📊 Table is empty - need to load data')
      }
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message)
  }
}

testConnection()