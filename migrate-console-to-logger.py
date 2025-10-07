#!/usr/bin/env python3
"""
Migrate console.log/error/warn statements to logger utility
Air Niugini PMS - Service Layer Logging Migration
"""

import re
import os
from pathlib import Path

PROJECT_DIR = "/Users/skycruzer/Desktop/Fleet Office Management/air-niugini-pms"

# Files to process (excluding logger.ts and __tests__)
FILES_TO_PROCESS = [
    "src/lib/leave-service.ts",
    "src/lib/pwa-cache.ts",
    "src/lib/notification-queue.ts",
    "src/lib/dashboard-data.ts",
    "src/lib/disciplinary-service.ts",
    "src/lib/backup-service.ts",
    "src/lib/optimistic-updates.ts",
    "src/lib/pagination-utils.ts",
    "src/lib/audit-log-service.ts",
    "src/lib/task-service.ts",
    "src/lib/email-service.ts",
]

def add_logger_import(content: str) -> str:
    """Add logger import if not present"""
    if "import { logger } from '@/lib/logger';" in content:
        return content

    # Find last import line and add logger import
    lines = content.split('\n')
    last_import_idx = -1
    for i, line in enumerate(lines):
        if line.strip().startswith('import '):
            last_import_idx = i

    if last_import_idx >= 0:
        lines.insert(last_import_idx + 1, "import { logger } from '@/lib/logger';")

    return '\n'.join(lines)

def migrate_console_statements(content: str) -> str:
    """Replace console statements with logger calls"""

    # Remove emoji prefixes first
    emojis = ['❌', '✅', '🚫', '📝', '🔄', '🔧', '🧹', '📊', '⚠️ ', '🗑️', '🔐']
    for emoji in emojis:
        content = content.replace(f"'{emoji} ", "'")
        content = content.replace(f"`{emoji} ", "`")

    # Replace console.error with logger.error
    # Pattern: console.error('message:', error);
    content = re.sub(
        r"console\.error\('([^']+):', error\);",
        r"logger.error('\1', error instanceof Error ? error : new Error(String(error)));",
        content
    )
    content = re.sub(
        r"console\.error\('([^']+)', error\);",
        r"logger.error('\1', error instanceof Error ? error : new Error(String(error)));",
        content
    )

    # Replace console.log success messages with logger.info
    content = re.sub(
        r"console\.log\('([^']+) successfully:', ([^)]+)\);",
        r"logger.info('\1 successfully', { data: \2 });",
        content
    )
    content = re.sub(
        r"console\.log\('([^']+) successfully'\);",
        r"logger.info('\1 successfully');",
        content
    )

    # Replace console.log with logger.debug (general case)
    content = re.sub(
        r"console\.log\('([^']+)\.\.\.'\);",
        r"logger.debug('\1');",
        content
    )
    content = re.sub(
        r"console\.log\(([`'])([^`']+)\1\);",
        r"logger.debug('\2');",
        content
    )
    content = re.sub(
        r"console\.log\('([^']+)', ([^)]+)\);",
        r"logger.debug('\1', \2);",
        content
    )

    # Replace console.warn with logger.warn
    content = re.sub(
        r"console\.warn\('([^']+)', ([^)]+)\);",
        r"logger.warn('\1', \2);",
        content
    )
    content = re.sub(
        r"console\.warn\('([^']+)'\);",
        r"logger.warn('\1');",
        content
    )

    return content

def process_file(file_path: Path) -> bool:
    """Process a single file"""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()

        original_content = content

        # Add logger import
        content = add_logger_import(content)

        # Migrate console statements
        content = migrate_console_statements(content)

        if content != original_content:
            # Create backup
            backup_path = file_path.with_suffix('.ts.backup')
            with open(backup_path, 'w', encoding='utf-8') as f:
                f.write(original_content)

            # Write updated content
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(content)

            print(f"✓ Processed: {file_path.relative_to(PROJECT_DIR)}")
            return True
        else:
            print(f"- No changes: {file_path.relative_to(PROJECT_DIR)}")
            return False
    except Exception as e:
        print(f"✗ Error processing {file_path}: {e}")
        return False

def main():
    """Main migration script"""
    os.chdir(PROJECT_DIR)

    print("Starting console → logger migration...")
    print(f"Project: {PROJECT_DIR}\n")

    processed_count = 0
    for file_rel in FILES_TO_PROCESS:
        file_path = Path(PROJECT_DIR) / file_rel
        if file_path.exists():
            if process_file(file_path):
                processed_count += 1
        else:
            print(f"⚠  File not found: {file_rel}")

    print(f"\n✅ Migration complete! Processed {processed_count} files")
    print("Run 'npm run build' to verify changes")

if __name__ == '__main__':
    main()
