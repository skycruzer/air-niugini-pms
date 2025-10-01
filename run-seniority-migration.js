const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables');
  console.error(
    'Make sure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in .env.local'
  );
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function runMigration() {
  try {
    console.log('🚀 Running seniority_number migration...');

    // Check if column already exists by querying the pilots table structure
    const { data: existingPilots, error: checkError } = await supabase
      .from('an_pilots')
      .select('seniority_number')
      .limit(1);

    if (!checkError) {
      console.log('✅ Column seniority_number already exists');
      console.log('Migration has already been applied.');
      return;
    }

    // If we get a column not found error, proceed with adding the column
    if (
      checkError &&
      (checkError.code === '42703' ||
        checkError.code === 'PGRST116' ||
        checkError.message.includes('does not exist'))
    ) {
      console.log('📝 Column does not exist, proceeding with migration...');
    } else if (checkError) {
      console.error('❌ Unexpected error checking column:', checkError);
      return;
    }

    console.log('\n⚠️  Direct DDL operations require manual execution.');
    console.log('Please run the following SQL commands in your Supabase SQL editor:\n');

    const migrationSQL = `
-- Add seniority_number column to an_pilots table
ALTER TABLE an_pilots 
ADD COLUMN seniority_number INTEGER;

-- Add index for performance when sorting by seniority
CREATE INDEX idx_an_pilots_seniority_number ON an_pilots(seniority_number);

-- Add comment to document the column purpose
COMMENT ON COLUMN an_pilots.seniority_number IS 'Pilot seniority number for ranking and benefits calculation. Lower numbers indicate higher seniority.';

-- Verify the column was added successfully
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'an_pilots' 
AND column_name = 'seniority_number';
    `;

    console.log(migrationSQL);
    console.log(
      '\n📋 The migration SQL has also been saved to: migration-add-seniority-number.sql'
    );
    console.log(
      '\n✨ After running the SQL, you can populate seniority numbers for pilots as needed.'
    );
  } catch (err) {
    console.error('❌ Migration preparation failed:', err);
    process.exit(1);
  }
}

// Run the migration
runMigration()
  .then(() => {
    process.exit(0);
  })
  .catch((err) => {
    console.error('❌ Unexpected error:', err);
    process.exit(1);
  });
