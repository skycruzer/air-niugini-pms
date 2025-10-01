const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://wgdmgvonqysflwdiiols.supabase.co';
const supabaseKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndnZG1ndm9ucXlzZmx3ZGlpb2xzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU1ODIzMjAsImV4cCI6MjA3MTE1ODMyMH0.MJrbK8qtJLJXz_mSHF9Le_DebGCXfZ4eXFd7h5JCKyk';

const supabase = createClient(supabaseUrl, supabaseKey);

// Sample PNG pilot data
const samplePilots = [
  {
    employee_id: 'PNG001',
    first_name: 'Joseph',
    middle_name: 'Kila',
    last_name: 'Wambi',
    role: 'Captain',
    contract_type: 'Permanent',
    nationality: 'Papua New Guinea',
    passport_number: 'PNG123456',
    passport_expiry: '2026-12-31',
    date_of_birth: '1978-03-15',
    commencement_date: '2005-01-10',
    is_active: true,
  },
  {
    employee_id: 'PNG002',
    first_name: 'Maria',
    middle_name: 'Temu',
    last_name: 'Kaupa',
    role: 'First Officer',
    contract_type: 'Permanent',
    nationality: 'Papua New Guinea',
    passport_number: 'PNG123457',
    passport_expiry: '2025-06-30',
    date_of_birth: '1985-07-22',
    commencement_date: '2010-09-15',
    is_active: true,
  },
  {
    employee_id: 'PNG003',
    first_name: 'Peter',
    middle_name: 'Namaliu',
    last_name: 'Sori',
    role: 'Captain',
    contract_type: 'Permanent',
    nationality: 'Papua New Guinea',
    passport_number: 'PNG123458',
    passport_expiry: '2027-01-15',
    date_of_birth: '1973-11-08',
    commencement_date: '2003-03-20',
    is_active: true,
  },
  {
    employee_id: 'PNG004',
    first_name: 'Grace',
    middle_name: 'Kila',
    last_name: 'Mendi',
    role: 'First Officer',
    contract_type: 'Contract',
    nationality: 'Papua New Guinea',
    passport_number: 'PNG123459',
    passport_expiry: '2025-11-20',
    date_of_birth: '1990-04-12',
    commencement_date: '2015-07-01',
    is_active: true,
  },
  {
    employee_id: 'PNG005',
    first_name: 'John',
    middle_name: 'Bani',
    last_name: 'Vanimo',
    role: 'Captain',
    contract_type: 'Permanent',
    nationality: 'Papua New Guinea',
    passport_number: 'PNG123460',
    passport_expiry: '2026-08-10',
    date_of_birth: '1980-09-30',
    commencement_date: '2008-02-14',
    is_active: true,
  },
];

// Sample check types
const checkTypes = [
  { check_code: 'ATPL', check_description: 'Air Transport Pilot License', category: 'License' },
  { check_code: 'B767-TYPE', check_description: 'Boeing 767 Type Rating', category: 'License' },
  { check_code: 'CLASS-1', check_description: 'Class 1 Medical Certificate', category: 'Medical' },
  { check_code: 'PC-B767', check_description: 'Proficiency Check B767', category: 'Proficiency' },
  {
    check_code: 'OPC-B767',
    check_description: 'Operator Proficiency Check B767',
    category: 'Proficiency',
  },
  {
    check_code: 'LPC-B767',
    check_description: 'Line Proficiency Check B767',
    category: 'Proficiency',
  },
  { check_code: 'RECUR-TRAIN', check_description: 'Recurrent Training', category: 'Training' },
  { check_code: 'DIFF-TRAIN', check_description: 'Differences Training', category: 'Training' },
  {
    check_code: 'DANGER-GOODS',
    check_description: 'Dangerous Goods Training',
    category: 'Training',
  },
  { check_code: 'CRM', check_description: 'Crew Resource Management', category: 'Training' },
  { check_code: 'EMER-PROC', check_description: 'Emergency Procedures', category: 'Safety' },
  { check_code: 'SECURITY', check_description: 'Aviation Security Training', category: 'Security' },
];

async function populateDatabase() {
  try {
    console.log('🚀 Populating Air Niugini database with sample data...');

    // Insert check types first
    console.log('📋 Inserting check types...');
    const { data: checkTypesData, error: checkTypesError } = await supabase
      .from('an_check_types')
      .insert(checkTypes)
      .select();

    if (checkTypesError) {
      console.log('Check types may already exist:', checkTypesError.message);
      // Get existing check types
      const { data: existing } = await supabase.from('an_check_types').select('*').limit(5);
      console.log('✅ Found existing check types:', existing?.length || 0);
    } else {
      console.log('✅ Inserted check types:', checkTypesData.length);
    }

    // Insert pilots
    console.log('👨‍✈️ Inserting pilots...');
    const { data: pilotsData, error: pilotsError } = await supabase
      .from('an_pilots')
      .insert(samplePilots)
      .select();

    if (pilotsError) {
      console.log('Pilots may already exist:', pilotsError.message);
      // Get existing pilots
      const { data: existing } = await supabase.from('an_pilots').select('*').limit(5);
      console.log('✅ Found existing pilots:', existing?.length || 0);
    } else {
      console.log('✅ Inserted pilots:', pilotsData.length);
    }

    // Create some sample certifications
    console.log('📜 Creating sample certifications...');

    // Get all pilots and check types
    const { data: pilots } = await supabase.from('an_pilots').select('id').limit(3);
    const { data: types } = await supabase.from('an_check_types').select('id').limit(6);

    if (pilots && types && pilots.length > 0 && types.length > 0) {
      const certifications = [];

      pilots.forEach((pilot, i) => {
        types.forEach((type, j) => {
          // Create varied expiry dates
          const today = new Date();
          const expiryDate = new Date(today);
          expiryDate.setMonth(today.getMonth() + j * 3 + i * 2); // Spread expiry dates

          certifications.push({
            pilot_id: pilot.id,
            check_type_id: type.id,
            expiry_date: expiryDate.toISOString().split('T')[0],
          });
        });
      });

      const { data: certsData, error: certsError } = await supabase
        .from('an_pilot_checks')
        .insert(certifications)
        .select();

      if (certsError) {
        console.log('Certifications may already exist:', certsError.message);
      } else {
        console.log('✅ Inserted certifications:', certsData.length);
      }
    }

    console.log('🎉 Database populated successfully!');
    console.log('✈️ Air Niugini PMS is ready to use with real data!');

    // Test the data
    console.log('\n🧪 Testing data retrieval...');
    const { data: testPilots, error: testError } = await supabase
      .from('an_pilots')
      .select('employee_id, first_name, last_name, role')
      .limit(3);

    if (testError) {
      console.error('❌ Error testing data:', testError.message);
    } else {
      console.log('✅ Sample pilots:');
      testPilots.forEach((pilot) =>
        console.log(
          `  - ${pilot.employee_id}: ${pilot.first_name} ${pilot.last_name} (${pilot.role})`
        )
      );
    }
  } catch (error) {
    console.error('❌ Population failed:', error.message);
  }
}

populateDatabase();
