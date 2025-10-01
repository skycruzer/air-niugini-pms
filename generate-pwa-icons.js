/**
 * PWA Icon Generator Script
 * Generates placeholder PWA icons with Air Niugini branding
 *
 * NOTE: This script creates basic SVG placeholders.
 * For production, replace with high-quality PNG icons designed by your design team.
 *
 * Usage: node generate-pwa-icons.js
 */

const fs = require('fs');
const path = require('path');

// Icon sizes needed for PWA
const ICON_SIZES = [72, 96, 128, 144, 152, 192, 384, 512];

// Air Niugini brand colors
const BRAND_RED = '#E4002B';
const BRAND_GOLD = '#FFC72C';
const BRAND_WHITE = '#FFFFFF';

/**
 * Generate SVG icon content
 */
function generateSVG(size) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <!-- Background -->
  <rect width="${size}" height="${size}" fill="${BRAND_RED}"/>

  <!-- Circle accent -->
  <circle cx="${size / 2}" cy="${size / 2}" r="${size * 0.35}" fill="${BRAND_WHITE}" opacity="0.1"/>

  <!-- Aircraft Icon (simplified B767) -->
  <g transform="translate(${size / 2}, ${size / 2})">
    <!-- Fuselage -->
    <rect x="${-size * 0.15}" y="${-size * 0.05}" width="${size * 0.3}" height="${size * 0.1}" fill="${BRAND_WHITE}" rx="${size * 0.02}"/>

    <!-- Wings -->
    <rect x="${-size * 0.25}" y="${-size * 0.02}" width="${size * 0.5}" height="${size * 0.04}" fill="${BRAND_WHITE}" rx="${size * 0.01}"/>

    <!-- Tail -->
    <polygon points="${size * 0.13},${-size * 0.05} ${size * 0.15},${-size * 0.15} ${size * 0.17},${-size * 0.05}" fill="${BRAND_GOLD}"/>
  </g>

  <!-- Text: AN -->
  <text x="${size / 2}" y="${size * 0.75}" font-family="Arial, sans-serif" font-size="${size * 0.18}" font-weight="bold" text-anchor="middle" fill="${BRAND_WHITE}">AN</text>

  <!-- Subtitle: PMS -->
  <text x="${size / 2}" y="${size * 0.88}" font-family="Arial, sans-serif" font-size="${size * 0.08}" text-anchor="middle" fill="${BRAND_GOLD}">PMS</text>
</svg>`;
}

/**
 * Generate favicon (simplified version)
 */
function generateFavicon() {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
  <rect width="32" height="32" fill="${BRAND_RED}"/>
  <text x="16" y="22" font-family="Arial, sans-serif" font-size="18" font-weight="bold" text-anchor="middle" fill="${BRAND_WHITE}">AN</text>
</svg>`;
}

/**
 * Main function
 */
function main() {
  const publicDir = path.join(__dirname, 'public');

  // Ensure public directory exists
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }

  console.log('🎨 Generating PWA icons with Air Niugini branding...\n');

  // Generate icons for each size
  ICON_SIZES.forEach((size) => {
    const filename = `icon-${size}x${size}.png`;
    const svgContent = generateSVG(size);
    const svgPath = path.join(publicDir, `icon-${size}x${size}.svg`);

    // Write SVG file
    fs.writeFileSync(svgPath, svgContent);
    console.log(`✅ Created ${filename} (SVG placeholder)`);
  });

  // Generate favicon
  const faviconSVG = generateFavicon();
  fs.writeFileSync(path.join(publicDir, 'favicon.svg'), faviconSVG);
  console.log('✅ Created favicon.svg');

  // Generate apple-touch-icon (using 192x192)
  fs.copyFileSync(
    path.join(publicDir, 'icon-192x192.svg'),
    path.join(publicDir, 'apple-touch-icon.svg')
  );
  console.log('✅ Created apple-touch-icon.svg');

  // Create browserconfig.xml for Windows
  const browserConfig = `<?xml version="1.0" encoding="utf-8"?>
<browserconfig>
  <msapplication>
    <tile>
      <square70x70logo src="/icon-72x72.png"/>
      <square150x150logo src="/icon-152x152.png"/>
      <square310x310logo src="/icon-192x192.png"/>
      <TileColor>${BRAND_RED}</TileColor>
    </tile>
  </msapplication>
</browserconfig>`;

  fs.writeFileSync(path.join(publicDir, 'browserconfig.xml'), browserConfig);
  console.log('✅ Created browserconfig.xml');

  // Create README for designers
  const readme = `# PWA Icons

## Current Status
These are **SVG placeholder icons** generated automatically.

## Production Requirements
For production deployment, please replace these SVG files with high-quality PNG icons:

### Required Sizes:
- 72x72px
- 96x96px
- 128x128px
- 144x144px
- 152x152px
- 192x192px (most important - used for Android/Chrome)
- 384x384px
- 512x512px (most important - used for splash screens)

### Design Guidelines:
- Use Air Niugini brand colors: Red (#E4002B) and Gold (#FFC72C)
- Include the B767 aircraft or Air Niugini logo
- Ensure icons are recognizable at all sizes
- Test on both light and dark backgrounds
- Use PNG format with transparency
- Follow Material Design icon guidelines

### Tools:
- [PWA Asset Generator](https://github.com/onderceylan/pwa-asset-generator)
- [Real Favicon Generator](https://realfavicongenerator.net/)
- Figma/Adobe Illustrator for design

### Conversion:
To convert these SVG placeholders to PNG:
\`\`\`bash
# Using ImageMagick (if installed)
for size in 72 96 128 144 152 192 384 512; do
  convert icon-\${size}x\${size}.svg icon-\${size}x\${size}.png
done
\`\`\`

Or use an online converter like:
- https://cloudconvert.com/svg-to-png
- https://convertio.co/svg-png/

## Files Generated:
- icon-{size}x{size}.svg - App icons (8 sizes)
- favicon.svg - Browser favicon
- apple-touch-icon.svg - iOS home screen icon
- browserconfig.xml - Windows tile configuration
`;

  fs.writeFileSync(path.join(publicDir, 'PWA-ICONS-README.md'), readme);
  console.log('✅ Created PWA-ICONS-README.md');

  console.log('\n📋 Summary:');
  console.log(`   Generated ${ICON_SIZES.length} icon sizes`);
  console.log('   Created favicon and Apple touch icon');
  console.log('   Created Windows browserconfig.xml');
  console.log('\n⚠️  IMPORTANT:');
  console.log(
    '   These are SVG placeholders. For production, replace with high-quality PNG icons.'
  );
  console.log('   See public/PWA-ICONS-README.md for instructions.');
  console.log('\n✨ PWA icon generation complete!');
}

// Run the script
main();
