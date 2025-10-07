#!/bin/bash

# Script to replace console statements with logger utility
# Air Niugini PMS - Service Layer Logging Migration

set -e

PROJECT_DIR="/Users/skycruzer/Desktop/Fleet Office Management/air-niugini-pms"
cd "$PROJECT_DIR"

# Files to process (excluding logger.ts and __tests__)
FILES=(
  "src/lib/leave-service.ts"
  "src/lib/pwa-cache.ts"
  "src/lib/notification-queue.ts"
  "src/lib/dashboard-data.ts"
  "src/lib/disciplinary-service.ts"
  "src/lib/backup-service.ts"
  "src/lib/optimistic-updates.ts"
  "src/lib/pagination-utils.ts"
  "src/lib/audit-log-service.ts"
)

# Function to add logger import if not present
add_logger_import() {
  local file="$1"
  if ! grep -q "import { logger } from '@/lib/logger';" "$file"; then
    # Find the last import line and add logger import after it
    sed -i.bak "1,/^import /{ /^import /a\\
import { logger } from '@/lib/logger';
}" "$file"
  fi
}

# Function to replace console statements
replace_console_statements() {
  local file="$1"

  # Backup file
  cp "$file" "$file.backup"

  # Replace console.error patterns
  sed -i '' \
    -e "s/console\.error('\([^']*\)', error);/logger.error('\1', error instanceof Error ? error : new Error(String(error)));/g" \
    -e "s/console\.error('\([^']*\):', error);/logger.error('\1', error instanceof Error ? error : new Error(String(error)));/g" \
    "$file"

  # Replace console.log with logger.info (for success messages)
  sed -i '' \
    -e "s/console\.log('\([^']*\) successfully', \(.*\));/logger.info('\1 successfully', { data: \2 });/g" \
    -e "s/console\.log('\([^']*\) successfully:', \(.*\));/logger.info('\1 successfully', { data: \2 });/g" \
    -e "s/console\.log('\([^']*\)');/logger.info('\1');/g" \
    "$file"

  # Replace console.log with logger.debug (for debug messages)
  sed -i '' \
    -e "s/console\.log('\([^']*\)\.\.\.');/logger.debug('\1');/g" \
    -e "s/console\.log('\([^']*\)', \(.*\));/logger.debug('\1', \2);/g" \
    "$file"

  # Replace console.warn
  sed -i '' \
    -e "s/console\.warn('\([^']*\)', \(.*\));/logger.warn('\1', \2);/g" \
    -e "s/console\.warn('\([^']*\)');/logger.warn('\1');/g" \
    "$file"

  # Clean up emoji prefixes
  sed -i '' \
    -e "s/logger\.error('❌ /logger.error('/g" \
    -e "s/logger\.error('🚫 /logger.error('/g" \
    -e "s/logger\.info('✅ /logger.info('/g" \
    -e "s/logger\.debug('📝 /logger.debug('/g" \
    -e "s/logger\.debug('🔄 /logger.debug('/g" \
    -e "s/logger\.debug('🔧 /logger.debug('/g" \
    -e "s/logger\.debug('🧹 /logger.debug('/g" \
    -e "s/logger\.debug('📊 /logger.debug('/g" \
    -e "s/logger\.warn('⚠️  /logger.warn('/g" \
    "$file"

  echo "✓ Processed: $file"
}

# Process each file
for file in "${FILES[@]}"; do
  if [ -f "$file" ]; then
    echo "Processing $file..."
    add_logger_import "$file"
    replace_console_statements "$file"
  else
    echo "⚠️  File not found: $file"
  fi
done

echo ""
echo "✅ Console statement migration complete!"
echo "Review the changes and run: npm run build"
