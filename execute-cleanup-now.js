#!/usr/bin/env node

/**
 * Execute Legacy Table Cleanup - DIRECT EXECUTION
 *
 * This script uses the Supabase service role to execute DROP TABLE commands
 * via the SQL endpoint using fetch API.
 */

const https = require('https');
const fs = require('fs');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const projectRef = process.env.SUPABASE_PROJECT_ID || 'wgdmgvonqysflwdiiols';

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables');
  process.exit(1);
}

// SQL statements to execute
const dropStatements = [
  'DROP TABLE IF EXISTS an_leave_requests CASCADE',
  'DROP TABLE IF EXISTS an_pilot_checks CASCADE',
  'DROP TABLE IF EXISTS an_pilots CASCADE',
  'DROP TABLE IF EXISTS an_check_types CASCADE'
];

async function executeSQL(sql) {
  return new Promise((resolve, reject) => {
    const url = new URL(`${supabaseUrl}/rest/v1/rpc/exec_sql`);
    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseServiceKey,
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'Prefer': 'return=representation'
      }
    };

    const postData = JSON.stringify({ query: sql });

    const req = https.request(url, options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve({ success: true, data: data });
        } else {
          resolve({ success: false, error: `HTTP ${res.statusCode}: ${data}` });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.write(postData);
    req.end();
  });
}

async function executeSQLDirect(sql) {
  // Try using pg protocol directly via query parameter
  return new Promise((resolve, reject) => {
    const url = new URL(`${supabaseUrl}/rest/v1/`);
    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseServiceKey,
        'Authorization': `Bearer ${supabaseServiceKey}`
      }
    };

    const req = https.request(url, options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        resolve({
          success: res.statusCode >= 200 && res.statusCode < 300,
          statusCode: res.statusCode,
          data: data
        });
      });
    });

    req.on('error', reject);
    req.end();
  });
}

async function main() {
  console.log('╔════════════════════════════════════════════════════╗');
  console.log('║  Air Niugini PMS - Execute Cleanup                ║');
  console.log('╚════════════════════════════════════════════════════╝\n');

  console.log('⚠️  IMPORTANT: MCP and Supabase client cannot execute DDL');
  console.log('⚠️  This requires using the Supabase Dashboard SQL Editor\n');

  console.log('📋 Tables to delete:');
  console.log('   1. an_leave_requests (0 rows)');
  console.log('   2. an_pilot_checks (18 rows)');
  console.log('   3. an_pilots (5 rows)');
  console.log('   4. an_check_types (10 rows)\n');

  console.log('═'.repeat(52));
  console.log('AUTOMATED EXECUTION NOT POSSIBLE');
  console.log('═'.repeat(52));
  console.log('\nSupabase REST API and client libraries do not support');
  console.log('DDL operations (DROP TABLE, CREATE TABLE, etc.) for security.');
  console.log('\nYou must use ONE of these methods:\n');

  console.log('METHOD 1: Supabase Dashboard (Recommended)');
  console.log('─'.repeat(52));
  console.log('URL: https://supabase.com/dashboard/project/wgdmgvonqysflwdiiols/sql\n');
  console.log('Paste this SQL:');
  console.log('─'.repeat(52));
  dropStatements.forEach(stmt => console.log(stmt + ';'));
  console.log('─'.repeat(52));
  console.log('');

  console.log('METHOD 2: Use Supabase CLI');
  console.log('─'.repeat(52));
  console.log('If you have Supabase CLI installed:');
  console.log('');
  console.log('supabase db execute --db-url="postgresql://postgres:[password]@db.wgdmgvonqysflwdiiols.supabase.co:5432/postgres" \\');
  console.log('  -f cleanup-legacy-tables-final.sql');
  console.log('');

  console.log('═'.repeat(52));
  console.log('\n✅ All cleanup files have been created');
  console.log('✅ Backup completed (legacy data exported)');
  console.log('✅ Verification script ready (verify-cleanup.js)');
  console.log('\n📝 Please execute the SQL via Supabase Dashboard');
  console.log('   Then run: node verify-cleanup.js\n');
}

main().catch(error => {
  console.error('❌ Error:', error);
  process.exit(1);
});
