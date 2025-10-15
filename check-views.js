const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkViews() {
  console.log('🔍 Checking database views...\n');

  try {
    // Check for materialized views
    const { data: views, error } = await supabase
      .rpc('exec_sql', {
        query: `
          SELECT schemaname, viewname, definition
          FROM pg_views
          WHERE schemaname = 'public'
          ORDER BY viewname;
        `
      });

    if (error) {
      console.log('ℹ️  Could not query views directly, trying alternative method...\n');
      
      // List known views from the codebase
      const knownViews = [
        'compliance_dashboard',
        'pilot_report_summary',
        'detailed_expiring_checks',
        'expiring_checks',
        'captain_qualifications_summary'
      ];

      console.log('Known views from CLAUDE.md:');
      knownViews.forEach(view => console.log('  -', view));
      
      console.log('\n🔄 Testing if views are accessible...\n');
      
      for (const viewName of knownViews) {
        try {
          const { data, error: viewError } = await supabase
            .from(viewName)
            .select('*')
            .limit(1);
          
          if (viewError) {
            console.log(`❌ ${viewName}:`, viewError.message);
          } else {
            console.log(`✅ ${viewName}: Accessible (${data ? data.length : 0} sample rows)`);
          }
        } catch (e) {
          console.log(`❌ ${viewName}: Error -`, e.message);
        }
      }
    } else {
      console.log('✅ Found views:\n');
      views.forEach(view => {
        console.log(`📊 ${view.viewname}`);
      });
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkViews();
