const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://wgdmgvonqysflwdiiols.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndnZG1ndm9ucXlzZmx3ZGlpb2xzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU1ODIzMjAsImV4cCI6MjA3MTE1ODMyMH0.MJrbK8qtJLJXz_mSHF9Le_DebGCXfZ4eXFd7h5JCKyk'

const supabase = createClient(supabaseUrl, supabaseKey)

const sampleUsers = [
  {
    email: 'admin@airniugini.com',
    name: 'System Administrator',
    role: 'admin'
  },
  {
    email: 'manager@airniugini.com',
    name: 'Fleet Manager',
    role: 'manager'
  },
  {
    email: 'skycruzer@icloud.com',
    name: 'Sky Cruzer',
    role: 'admin'
  }
]

async function createUsers() {
  console.log('🚀 Creating Air Niugini user accounts...')

  for (const user of sampleUsers) {
    try {
      console.log(`Creating user: ${user.email}`)

      // Create auth user first
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: user.email,
        password: 'airniugini123', // Default password for all users
        options: {
          emailRedirectTo: undefined // Skip email confirmation for dev
        }
      })

      if (authError && !authError.message.includes('already registered')) {
        console.error(`❌ Failed to create auth user ${user.email}:`, authError.message)
        continue
      }

      // Create profile in our users table
      const { data: userData, error: userError } = await supabase
        .from('an_users')
        .insert([{
          email: user.email,
          name: user.name,
          role: user.role
        }])
        .select()

      if (userError && !userError.message.includes('duplicate')) {
        console.log(`⚠️ User profile may already exist: ${user.email}`)
      } else {
        console.log(`✅ Created user: ${user.email} (${user.role})`)
      }

    } catch (error) {
      console.error(`❌ Error creating user ${user.email}:`, error.message)
    }
  }

  console.log('\n🎉 User creation completed!')
  console.log('📝 Default credentials:')
  console.log('  Email: admin@airniugini.com | Password: airniugini123')
  console.log('  Email: manager@airniugini.com | Password: airniugini123')
  console.log('  Email: skycruzer@icloud.com | Password: airniugini123')
  console.log('\n✈️ Air Niugini PMS authentication is ready!')
}

createUsers()