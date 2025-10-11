#!/bin/bash

# Air Niugini PMS - Library Reorganization Script
# This script reorganizes the src/lib directory into logical subdirectories
# Run with: bash scripts/reorganize-lib.sh

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Project lib directory
LIB_DIR="/Users/skycruzer/Desktop/Fleet Office Management/air-niugini-pms/src/lib"

echo -e "${GREEN}Starting src/lib Reorganization...${NC}"
echo "Library Directory: $LIB_DIR"
echo ""

# Function to move file and update imports
move_lib_file() {
    local file="$1"
    local destination="$2"
    local filename=$(basename "$file")

    if [ -f "$file" ]; then
        mv "$file" "$destination/$filename"
        echo -e "${GREEN}✓${NC} Moved: $filename → lib/$destination/"

        # Track for import updates
        echo "$filename|$destination" >> /tmp/lib_moves.txt
    fi
}

# Initialize tracking file
> /tmp/lib_moves.txt

echo -e "${BLUE}=== Categorizing Library Files ===${NC}\n"

# ===========================================
# SERVICES - Business Logic
# ===========================================

echo -e "${YELLOW}Moving Service Files...${NC}"

services=(
    "pilot-service.ts"
    "leave-service.ts"
    "leave-eligibility-service.ts"
    "expiring-certifications-service.ts"
    "certification-service.ts"
    "analytics-service.ts"
    "analytics-data-service.ts"
    "dashboard-service.ts"
    "audit-log-service.ts"
    "document-service.ts"
    "disciplinary-service.ts"
    "notification-service.ts"
    "backup-service.ts"
    "cache-service.ts"
    "todo-service.ts"
    "settings-service.ts"
    "health-service.ts"
)

for service in "${services[@]}"; do
    move_lib_file "$LIB_DIR/$service" "$LIB_DIR/services"
done

# ===========================================
# DATA - Database & Data Access
# ===========================================

echo -e "\n${YELLOW}Moving Data Layer Files...${NC}"

data_files=(
    "supabase.ts"
    "supabase-admin.ts"
    "supabase-client.ts"
    "supabase-server.ts"
    "database.types.ts"
    "connection-pool.ts"
    "database-pool.ts"
    "dashboard-data.ts"
)

for data_file in "${data_files[@]}"; do
    move_lib_file "$LIB_DIR/$data_file" "$LIB_DIR/data"
done

# ===========================================
# UTILS - Utility Functions
# ===========================================

echo -e "\n${YELLOW}Moving Utility Files...${NC}"

utils=(
    "date-utils.ts"
    "roster-utils.ts"
    "certification-utils.ts"
    "calendar-utils.ts"
    "validation-utils.ts"
    "format-utils.ts"
    "sort-utils.ts"
    "accessibility-utils.ts"
    "chart-export.ts"
    "export-utils.ts"
    "mobile-utils.ts"
    "network-utils.ts"
    "seo-utils.ts"
    "url-utils.ts"
)

for util in "${utils[@]}"; do
    move_lib_file "$LIB_DIR/$util" "$LIB_DIR/utils"
done

# ===========================================
# PDF - PDF Generation
# ===========================================

echo -e "\n${YELLOW}Moving PDF Files...${NC}"

pdf_files=(
    "pdf-data-service.ts"
    "pdf-generator.ts"
    "pdf-templates.ts"
    "pdf-utils.ts"
)

for pdf in "${pdf_files[@]}"; do
    move_lib_file "$LIB_DIR/$pdf" "$LIB_DIR/pdf"
done

# ===========================================
# AUTH - Authentication & Authorization
# ===========================================

echo -e "\n${YELLOW}Moving Auth Files...${NC}"

auth_files=(
    "auth-utils.ts"
    "auth.ts"
    "permissions.ts"
    "rbac.ts"
    "session-utils.ts"
)

for auth in "${auth_files[@]}"; do
    move_lib_file "$LIB_DIR/$auth" "$LIB_DIR/auth"
done

# ===========================================
# API - API Utilities
# ===========================================

echo -e "\n${YELLOW}Moving API Files...${NC}"

api_files=(
    "api-client.ts"
    "api-response.ts"
    "api-error.ts"
    "api-utils.ts"
    "csrf.ts"
    "rate-limit.ts"
)

for api in "${api_files[@]}"; do
    move_lib_file "$LIB_DIR/$api" "$LIB_DIR/api"
done

# ===========================================
# UI/THEME - UI Related
# ===========================================

echo -e "\n${YELLOW}Creating UI/Theme Directory...${NC}"
mkdir -p "$LIB_DIR/ui"

ui_files=(
    "design-tokens.ts"
    "theme.ts"
    "ui-utils.ts"
)

for ui in "${ui_files[@]}"; do
    move_lib_file "$LIB_DIR/$ui" "$LIB_DIR/ui"
done

# ===========================================
# MONITORING - Monitoring & Logging
# ===========================================

echo -e "\n${YELLOW}Creating Monitoring Directory...${NC}"
mkdir -p "$LIB_DIR/monitoring"

monitoring_files=(
    "logger.ts"
    "error-reporting.ts"
    "audit-integration.ts"
    "performance-monitoring.ts"
    "tracing.ts"
)

for monitor in "${monitoring_files[@]}"; do
    move_lib_file "$LIB_DIR/$monitor" "$LIB_DIR/monitoring"
done

# ===========================================
# Create Index Files (Barrel Exports)
# ===========================================

echo -e "\n${BLUE}=== Creating Index Files ===${NC}\n"

# Services index
cat > "$LIB_DIR/services/index.ts" << 'EOF'
// Service Layer Exports
export * from './pilot-service';
export * from './leave-service';
export * from './leave-eligibility-service';
export * from './certification-service';
export * from './analytics-service';
export * from './dashboard-service';
export * from './audit-log-service';
export * from './document-service';
export * from './disciplinary-service';
export * from './notification-service';
export * from './backup-service';
export * from './cache-service';
export * from './settings-service';
EOF
echo -e "${GREEN}✓${NC} Created services/index.ts"

# Data index
cat > "$LIB_DIR/data/index.ts" << 'EOF'
// Data Layer Exports
export * from './supabase';
export * from './supabase-admin';
export * from './database.types';
export * from './connection-pool';
export * from './dashboard-data';
EOF
echo -e "${GREEN}✓${NC} Created data/index.ts"

# Utils index
cat > "$LIB_DIR/utils/index.ts" << 'EOF'
// Utility Function Exports
export * from './date-utils';
export * from './roster-utils';
export * from './certification-utils';
export * from './calendar-utils';
export * from './validation-utils';
export * from './format-utils';
export * from './accessibility-utils';
export * from './chart-export';
EOF
echo -e "${GREEN}✓${NC} Created utils/index.ts"

# Auth index
cat > "$LIB_DIR/auth/index.ts" << 'EOF'
// Authentication & Authorization Exports
export * from './auth-utils';
export * from './permissions';
export * from './session-utils';
EOF
echo -e "${GREEN}✓${NC} Created auth/index.ts"

# API index
cat > "$LIB_DIR/api/index.ts" << 'EOF'
// API Utility Exports
export * from './api-client';
export * from './api-response';
export * from './api-error';
export * from './csrf';
EOF
echo -e "${GREEN}✓${NC} Created api/index.ts"

# PDF index
cat > "$LIB_DIR/pdf/index.ts" << 'EOF'
// PDF Generation Exports
export * from './pdf-data-service';
export * from './pdf-generator';
export * from './pdf-templates';
EOF
echo -e "${GREEN}✓${NC} Created pdf/index.ts"

# ===========================================
# Generate Import Update Script
# ===========================================

echo -e "\n${BLUE}=== Generating Import Update Script ===${NC}\n"

cat > "$LIB_DIR/update-imports.sh" << 'EOF'
#!/bin/bash
# Script to update imports after lib reorganization

echo "Updating imports in TypeScript/JavaScript files..."

# Function to update imports
update_imports() {
    local old_path="$1"
    local new_path="$2"

    # Find all .ts, .tsx, .js, .jsx files and update imports
    find /Users/skycruzer/Desktop/Fleet Office Management/air-niugini-pms/src \
        -type f \( -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" \) \
        -exec sed -i.bak "s|@/lib/${old_path}|@/lib/${new_path}|g" {} \;

    echo "Updated: @/lib/${old_path} → @/lib/${new_path}"
}

# Update imports based on moves
EOF

# Add specific import updates based on moves
while IFS='|' read -r filename subdir; do
    if [ ! -z "$filename" ]; then
        basename_no_ext="${filename%.*}"
        echo "update_imports \"$basename_no_ext\" \"$subdir/$basename_no_ext\"" >> "$LIB_DIR/update-imports.sh"
    fi
done < /tmp/lib_moves.txt

echo 'echo "Import updates complete!"' >> "$LIB_DIR/update-imports.sh"
chmod +x "$LIB_DIR/update-imports.sh"

echo -e "${GREEN}✓${NC} Created update-imports.sh script"

# ===========================================
# Summary Report
# ===========================================

echo -e "\n${GREEN}========================================${NC}"
echo -e "${GREEN}    Library Reorganization Complete!${NC}"
echo -e "${GREEN}========================================${NC}"

# Count files in each directory
echo -e "\n${YELLOW}File Distribution:${NC}"
for dir in services data utils pdf auth api ui monitoring; do
    if [ -d "$LIB_DIR/$dir" ]; then
        count=$(ls -1 "$LIB_DIR/$dir" 2>/dev/null | grep -v index.ts | wc -l)
        printf "  %-15s: %2d files\n" "$dir" "$count"
    fi
done

# Count remaining files
remaining=$(ls -1 "$LIB_DIR" 2>/dev/null | grep -E '\.(ts|js)$' | wc -l)
echo -e "  ${YELLOW}Uncategorized   : $remaining files${NC}"

echo -e "\n${YELLOW}Next Steps:${NC}"
echo "1. Review any uncategorized files in src/lib/"
echo "2. Run the update-imports.sh script to update all imports:"
echo "   ${BLUE}bash $LIB_DIR/update-imports.sh${NC}"
echo "3. Run TypeScript compiler to check for import errors:"
echo "   ${BLUE}npm run type-check${NC}"
echo "4. Update any manual imports that use relative paths"
echo "5. Test the application thoroughly"

echo -e "\n${GREEN}Library structure has been reorganized!${NC}"

# Clean up tracking file
rm -f /tmp/lib_moves.txt