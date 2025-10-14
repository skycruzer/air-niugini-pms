const fs = require('fs');
const path = require('path');

const filesToFix = [
  'src/app/dashboard/analytics/page.tsx',
  'src/app/dashboard/audit/page.tsx',
  'src/app/dashboard/disciplinary/page.tsx',
  'src/app/dashboard/documents/page.tsx',
  'src/app/dashboard/forms/page.tsx',
  'src/app/dashboard/leave/page.tsx',
  'src/app/dashboard/pilots/page.tsx',
  'src/app/dashboard/reports/page.tsx',
  'src/app/dashboard/settings/page.tsx',
  'src/app/dashboard/tasks/page.tsx',
  'src/app/dashboard/audit/[id]/page.tsx',
  'src/app/dashboard/certifications/calendar/page.tsx',
  'src/app/dashboard/certifications/expiry-planning/page.tsx',
  'src/app/dashboard/disciplinary/new/page.tsx',
  'src/app/dashboard/leave/calendar/page.tsx',
  'src/app/dashboard/leave/roster-planning/page.tsx',
  'src/app/dashboard/pilots/[id]/page.tsx',
  'src/app/dashboard/tasks/new/page.tsx',
];

let fixedCount = 0;
let skippedCount = 0;

filesToFix.forEach((file) => {
  const filePath = path.join(__dirname, file);

  try {
    let content = fs.readFileSync(filePath, 'utf8');

    // Check if file has DashboardLayout import and usage
    if (!content.includes('DashboardLayout')) {
      console.log(`⏭️  Skipping ${file} (no DashboardLayout found)`);
      skippedCount++;
      return;
    }

    // Remove import
    content = content.replace(
      /import\s+{\s*DashboardLayout\s*}\s+from\s+['"]@\/components\/layout\/DashboardLayout['"];?\n/g,
      ''
    );

    // Remove opening tag <DashboardLayout>
    content = content.replace(/<DashboardLayout>\s*/g, '');

    // Remove closing tag </DashboardLayout>
    content = content.replace(/\s*<\/DashboardLayout>/g, '');

    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✅ Fixed ${file}`);
    fixedCount++;
  } catch (error) {
    console.error(`❌ Error fixing ${file}:`, error.message);
  }
});

console.log(`\n📊 Summary:`);
console.log(`   ✅ Fixed: ${fixedCount} files`);
console.log(`   ⏭️  Skipped: ${skippedCount} files`);
