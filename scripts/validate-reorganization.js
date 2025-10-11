#!/usr/bin/env node

/**
 * Air Niugini PMS - Reorganization Validation Script
 * This script validates the project after reorganization
 * Checks for broken imports, missing files, and configuration issues
 * Run with: node scripts/validate-reorganization.js
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
};

const PROJECT_ROOT = '/Users/skycruzer/Desktop/Fleet Office Management/air-niugini-pms';

class ReorganizationValidator {
  constructor() {
    this.errors = [];
    this.warnings = [];
    this.successes = [];
  }

  log(message, type = 'info') {
    const prefix = {
      error: `${colors.red}✗${colors.reset}`,
      warning: `${colors.yellow}⚠${colors.reset}`,
      success: `${colors.green}✓${colors.reset}`,
      info: `${colors.blue}ℹ${colors.reset}`,
      section: `${colors.magenta}═══${colors.reset}`,
    };

    if (type === 'section') {
      console.log(`\n${prefix[type]} ${colors.magenta}${message}${colors.reset}`);
    } else {
      console.log(`${prefix[type]} ${message}`);
    }

    if (type === 'error') this.errors.push(message);
    if (type === 'warning') this.warnings.push(message);
    if (type === 'success') this.successes.push(message);
  }

  // Check if directory structure is correct
  validateDirectoryStructure() {
    this.log('VALIDATING DIRECTORY STRUCTURE', 'section');

    const expectedDirs = [
      'database/migrations',
      'database/schemas',
      'database/seeds',
      'database/views',
      'database/scripts',
      'scripts/database',
      'scripts/deployment',
      'scripts/development',
      'scripts/testing',
      'tests/e2e',
      'tests/unit',
      'tests/integration',
      'tests/fixtures',
      'docs/api',
      'docs/architecture',
      'docs/deployment',
      'docs/features',
      'docs/testing',
      'config/jest',
      'config/playwright',
      'config/build',
      'src/lib/services',
      'src/lib/data',
      'src/lib/utils',
      'src/lib/pdf',
      'src/lib/auth',
      'src/lib/api',
    ];

    expectedDirs.forEach(dir => {
      const fullPath = path.join(PROJECT_ROOT, dir);
      if (fs.existsSync(fullPath)) {
        this.log(`Directory exists: ${dir}`, 'success');
      } else {
        this.log(`Missing directory: ${dir}`, 'error');
      }
    });
  }

  // Check for broken imports in TypeScript/JavaScript files
  validateImports() {
    this.log('VALIDATING IMPORTS', 'section');

    const srcDir = path.join(PROJECT_ROOT, 'src');
    const files = this.getAllFiles(srcDir, ['.ts', '.tsx', '.js', '.jsx']);

    let brokenImports = 0;
    let checkedFiles = 0;

    files.forEach(file => {
      const content = fs.readFileSync(file, 'utf-8');
      const importRegex = /import\s+(?:[\w\s{},*]+\s+from\s+)?['"](@\/lib\/[^'"]+)['"]/g;

      let match;
      while ((match = importRegex.exec(content)) !== null) {
        const importPath = match[1];
        const resolvedPath = this.resolveImportPath(importPath);

        if (!fs.existsSync(resolvedPath)) {
          this.log(`Broken import in ${path.relative(PROJECT_ROOT, file)}: ${importPath}`, 'error');
          brokenImports++;
        }
      }
      checkedFiles++;
    });

    if (brokenImports === 0) {
      this.log(`All imports valid in ${checkedFiles} files`, 'success');
    } else {
      this.log(`Found ${brokenImports} broken imports`, 'error');
    }
  }

  // Resolve @/lib import paths to actual file paths
  resolveImportPath(importPath) {
    const libPath = importPath.replace('@/lib/', '');
    const basePath = path.join(PROJECT_ROOT, 'src/lib', libPath);

    // Check for .ts, .tsx, .js, .jsx extensions
    const extensions = ['.ts', '.tsx', '.js', '.jsx'];
    for (const ext of extensions) {
      if (fs.existsSync(basePath + ext)) {
        return basePath + ext;
      }
    }

    // Check for index file in directory
    const indexPath = path.join(basePath, 'index');
    for (const ext of extensions) {
      if (fs.existsSync(indexPath + ext)) {
        return indexPath + ext;
      }
    }

    return basePath;
  }

  // Check if package.json scripts are updated
  validatePackageJsonScripts() {
    this.log('VALIDATING PACKAGE.JSON SCRIPTS', 'section');

    const packageJsonPath = path.join(PROJECT_ROOT, 'package.json');
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));

    const scriptChecks = [
      { script: 'db:test', shouldContain: 'scripts/database' },
      { script: 'db:deploy', shouldContain: 'scripts/database' },
      { script: 'db:seed', shouldContain: 'scripts/database' },
    ];

    scriptChecks.forEach(({ script, shouldContain }) => {
      if (packageJson.scripts[script]) {
        if (packageJson.scripts[script].includes(shouldContain)) {
          this.log(`Script "${script}" correctly updated`, 'success');
        } else {
          this.log(`Script "${script}" needs updating to use ${shouldContain}`, 'warning');
        }
      }
    });
  }

  // Check if test configurations are updated
  validateTestConfigs() {
    this.log('VALIDATING TEST CONFIGURATIONS', 'section');

    // Check Jest config
    const jestConfigPath = path.join(PROJECT_ROOT, 'jest.config.js');
    if (fs.existsSync(jestConfigPath)) {
      const jestConfig = fs.readFileSync(jestConfigPath, 'utf-8');

      if (jestConfig.includes('tests/unit') || jestConfig.includes('tests/integration')) {
        this.log('Jest config updated for new test structure', 'success');
      } else if (jestConfig.includes('config/jest/jest.setup.js')) {
        this.log('Jest config using new setup file location', 'success');
      } else {
        this.log('Jest config may need updating for new test structure', 'warning');
      }
    }

    // Check Playwright config
    const playwrightConfigPath = path.join(PROJECT_ROOT, 'playwright.config.js');
    if (fs.existsSync(playwrightConfigPath)) {
      const playwrightConfig = fs.readFileSync(playwrightConfigPath, 'utf-8');

      if (playwrightConfig.includes('tests/e2e')) {
        this.log('Playwright config updated for new test structure', 'success');
      } else {
        this.log('Playwright config may need updating for new test structure', 'warning');
      }
    }
  }

  // Check for orphaned files in root
  checkRootClutter() {
    this.log('CHECKING ROOT DIRECTORY CLEANUP', 'section');

    const rootFiles = fs.readdirSync(PROJECT_ROOT);
    const allowedRootPatterns = [
      /^\./, // Hidden files (like .gitignore, .env)
      /^README/,
      /^CLAUDE/,
      /^package/,
      /^tsconfig/,
      /^next/,
      /^tailwind/,
      /^postcss/,
      /^components/,
      /^vercel/,
      /^commitlint/,
    ];

    const problemFiles = [];
    rootFiles.forEach(file => {
      const fullPath = path.join(PROJECT_ROOT, file);
      if (fs.statSync(fullPath).isFile()) {
        const isAllowed = allowedRootPatterns.some(pattern => pattern.test(file));
        if (!isAllowed && !file.includes('node_modules')) {
          if (file.endsWith('.sql')) {
            problemFiles.push(`SQL file in root: ${file}`);
          } else if (file.endsWith('.md')) {
            problemFiles.push(`Documentation in root: ${file}`);
          } else if (file.endsWith('.js') && !file.includes('config')) {
            problemFiles.push(`Script in root: ${file}`);
          } else if (file.endsWith('.log')) {
            problemFiles.push(`Log file in root: ${file}`);
          }
        }
      }
    });

    if (problemFiles.length === 0) {
      this.log('Root directory is clean', 'success');
    } else {
      problemFiles.forEach(file => this.log(file, 'warning'));
      this.log(`Found ${problemFiles.length} files that could be moved`, 'warning');
    }
  }

  // Check TypeScript compilation
  checkTypeScriptCompilation() {
    this.log('CHECKING TYPESCRIPT COMPILATION', 'section');

    try {
      execSync('npx tsc --noEmit', { cwd: PROJECT_ROOT, stdio: 'pipe' });
      this.log('TypeScript compilation successful', 'success');
    } catch (error) {
      const output = error.stdout ? error.stdout.toString() : '';
      const errorLines = output.split('\n').filter(line => line.trim());

      if (errorLines.length > 0) {
        this.log(`TypeScript compilation errors found:`, 'error');
        errorLines.slice(0, 10).forEach(line => console.log(`  ${line}`));
        if (errorLines.length > 10) {
          console.log(`  ... and ${errorLines.length - 10} more errors`);
        }
      }
    }
  }

  // Get all files with specific extensions
  getAllFiles(dir, extensions, fileList = []) {
    const files = fs.readdirSync(dir);

    files.forEach(file => {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);

      if (stat.isDirectory() && !file.includes('node_modules') && !file.startsWith('.')) {
        this.getAllFiles(filePath, extensions, fileList);
      } else if (stat.isFile() && extensions.some(ext => file.endsWith(ext))) {
        fileList.push(filePath);
      }
    });

    return fileList;
  }

  // Generate summary report
  generateReport() {
    this.log('VALIDATION SUMMARY', 'section');

    console.log(`\n${colors.green}Successes: ${this.successes.length}${colors.reset}`);
    console.log(`${colors.yellow}Warnings: ${this.warnings.length}${colors.reset}`);
    console.log(`${colors.red}Errors: ${this.errors.length}${colors.reset}`);

    if (this.errors.length === 0) {
      console.log(`\n${colors.green}✅ Reorganization validation passed!${colors.reset}`);
      console.log('The project structure has been successfully reorganized.');
    } else {
      console.log(`\n${colors.red}❌ Validation found issues that need attention${colors.reset}`);
      console.log('\nTop issues to fix:');
      this.errors.slice(0, 5).forEach((error, i) => {
        console.log(`${i + 1}. ${error}`);
      });
    }

    if (this.warnings.length > 0) {
      console.log(`\n${colors.yellow}⚠️  Recommendations:${colors.reset}`);
      this.warnings.slice(0, 5).forEach((warning, i) => {
        console.log(`${i + 1}. ${warning}`);
      });
    }

    // Generate fix script if needed
    if (this.errors.length > 0) {
      this.generateFixScript();
    }
  }

  // Generate a script to fix common issues
  generateFixScript() {
    const fixScriptPath = path.join(PROJECT_ROOT, 'scripts/fix-reorganization.sh');

    let fixScript = `#!/bin/bash
# Auto-generated script to fix reorganization issues
# Generated: ${new Date().toISOString()}

set -e

echo "Fixing reorganization issues..."

`;

    // Add fixes based on errors
    if (this.errors.some(e => e.includes('Missing directory'))) {
      fixScript += `
# Create missing directories
`;
      this.errors
        .filter(e => e.includes('Missing directory'))
        .forEach(error => {
          const dir = error.replace('Missing directory: ', '');
          fixScript += `mkdir -p "${PROJECT_ROOT}/${dir}"\n`;
        });
    }

    if (this.errors.some(e => e.includes('Broken import'))) {
      fixScript += `
# Fix broken imports
echo "Please manually fix the broken imports listed above"
echo "Run: npm run type-check to verify"
`;
    }

    fixScript += `
echo "Fixes applied. Please run validation again."
`;

    fs.writeFileSync(fixScriptPath, fixScript);
    fs.chmodSync(fixScriptPath, '755');

    console.log(`\n${colors.blue}Generated fix script: scripts/fix-reorganization.sh${colors.reset}`);
  }

  // Main validation runner
  async run() {
    console.log(`${colors.blue}${'='.repeat(50)}${colors.reset}`);
    console.log(`${colors.blue}  Air Niugini PMS - Reorganization Validator${colors.reset}`);
    console.log(`${colors.blue}${'='.repeat(50)}${colors.reset}`);

    this.validateDirectoryStructure();
    this.validateImports();
    this.validatePackageJsonScripts();
    this.validateTestConfigs();
    this.checkRootClutter();
    this.checkTypeScriptCompilation();

    this.generateReport();

    // Exit with appropriate code
    process.exit(this.errors.length > 0 ? 1 : 0);
  }
}

// Run the validator
const validator = new ReorganizationValidator();
validator.run().catch(error => {
  console.error(`${colors.red}Validation failed:${colors.reset}`, error);
  process.exit(1);
});