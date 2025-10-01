# PWA Icons

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

```bash
# Using ImageMagick (if installed)
for size in 72 96 128 144 152 192 384 512; do
  convert icon-${size}x${size}.svg icon-${size}x${size}.png
done
```

Or use an online converter like:

- https://cloudconvert.com/svg-to-png
- https://convertio.co/svg-png/

## Files Generated:

- icon-{size}x{size}.svg - App icons (8 sizes)
- favicon.svg - Browser favicon
- apple-touch-icon.svg - iOS home screen icon
- browserconfig.xml - Windows tile configuration
