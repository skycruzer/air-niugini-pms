#!/usr/bin/env node

/**
 * Air Niugini Pilot Management System - MCP Server
 *
 * Claude Agent SDK MCP Server providing tools for:
 * - Pilot management and seniority tracking
 * - Certification tracking and compliance monitoring
 * - Leave request management and crew availability
 *
 * Usage:
 *   npm run mcp:server
 *
 * Configuration in .mcp.json (workspace root):
 * {
 *   "mcpServers": {
 *     "air-niugini-pms": {
 *       "command": "node",
 *       "args": ["air-niugini-pms/mcp-server/index.js"],
 *       "env": {
 *         "SUPABASE_URL": "your-url",
 *         "SUPABASE_SERVICE_ROLE_KEY": "your-key"
 *       }
 *     }
 *   }
 * }
 */

import { createSdkMcpServer } from '@anthropic-ai/claude-agent-sdk';

// Import pilot management tools
import {
  getPilotsTool,
  getPilotDetailsTool,
  getSeniorityListTool,
  searchPilotsTool,
  getFleetStatsTool,
} from './tools/pilot-tools';

// Import certification tracking tools
import {
  getExpiringCertificationsTool,
  getCheckTypesTool,
  getPilotCertificationsTool,
  getComplianceMetricsTool,
  getCertificationCalendarTool,
} from './tools/certification-tools';

// Import leave management tools
import {
  getLeaveRequestsTool,
  getCurrentRosterPeriodTool,
  checkCrewAvailabilityTool,
  detectLeaveConflictsTool,
  getPendingFinalReviewTool,
} from './tools/leave-tools';

/**
 * Air Niugini MCP Server Configuration
 * SDK v0.1.9 - Simplified API (no description, no config, no start/stop)
 */
const server = createSdkMcpServer({
  name: 'Air Niugini Pilot Management System',
  version: '1.0.0',
  // Register all tools
  tools: [
    // Pilot Management Tools
    getPilotsTool,
    getPilotDetailsTool,
    getSeniorityListTool,
    searchPilotsTool,
    getFleetStatsTool,

    // Certification Tracking Tools
    getExpiringCertificationsTool,
    getCheckTypesTool,
    getPilotCertificationsTool,
    getComplianceMetricsTool,
    getCertificationCalendarTool,

    // Leave Management Tools
    getLeaveRequestsTool,
    getCurrentRosterPeriodTool,
    checkCrewAvailabilityTool,
    detectLeaveConflictsTool,
    getPendingFinalReviewTool,
  ],
});

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\nShutting down Air Niugini MCP server...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\nShutting down Air Niugini MCP server...');
  process.exit(0);
});

console.log('Air Niugini Pilot Management System MCP Server started');
console.log('Available tools:');
console.log('  Pilot Management: 5 tools');
console.log('  Certification Tracking: 5 tools');
console.log('  Leave Management: 5 tools');
console.log('Total: 15 tools available');
