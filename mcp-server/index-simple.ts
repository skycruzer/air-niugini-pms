#!/usr/bin/env node

/**
 * Air Niugini Pilot Management System - MCP Server (Simplified)
 *
 * Claude Agent SDK MCP Server with working tools
 * This is a simplified version for testing the SDK integration
 */

import { createSdkMcpServer } from '@anthropic-ai/claude-agent-sdk';
import { greetingTool, getPilotCountTool, getFleetStatsSimpleTool } from './tools-simple.js';

/**
 * Create MCP server with simplified tools
 */
const serverConfig = createSdkMcpServer({
  name: 'Air Niugini PMS',
  version: '1.0.0',
  tools: [greetingTool, getPilotCountTool, getFleetStatsSimpleTool],
});

console.log('✈️  Air Niugini Pilot Management System MCP Server');
console.log('📋 Server configured and ready');
console.log('');
console.log('Available tools:');
console.log('  1. greeting - Test greeting message');
console.log('  2. get_pilot_count - Get pilot counts');
console.log('  3. get_fleet_stats_simple - Get fleet statistics');
console.log('');
console.log('✅ Server configuration ready for Claude Code');
console.log('');
console.log('To use: Add this server to .mcp.json in your workspace root');
console.log('');

// Export the server config for Claude Code
export default serverConfig;
