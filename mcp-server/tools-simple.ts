/**
 * Simplified Air Niugini Tools for Claude Agent SDK
 * Using correct SDK API (4-parameter tool function)
 */

import { tool } from '@anthropic-ai/claude-agent-sdk';
import { z } from 'zod';

/**
 * Simple greeting tool to test MCP server
 */
export const greetingTool = tool(
  'greeting',
  'Get a greeting message for Air Niugini',
  {
    name: z.string().describe('Name to greet'),
  },
  async (args) => {
    return {
      content: [
        {
          type: 'text' as const,
          text: `Welcome to Air Niugini Pilot Management System, ${args.name}! 🛫`,
        },
      ],
    };
  }
);

/**
 * Get pilot count
 */
export const getPilotCountTool = tool(
  'get_pilot_count',
  'Get the total number of pilots in the system',
  {},
  async () => {
    // Simulated data - in production, this would query Supabase
    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify(
            {
              success: true,
              total_pilots: 27,
              captains: 15,
              first_officers: 12,
              message: 'Pilot count retrieved successfully',
            },
            null,
            2
          ),
        },
      ],
    };
  }
);

/**
 * Get fleet statistics
 */
export const getFleetStatsSimpleTool = tool(
  'get_fleet_stats_simple',
  'Get basic fleet statistics',
  {},
  async () => {
    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify(
            {
              success: true,
              fleet_overview: {
                total_pilots: 27,
                active_pilots: 25,
                aircraft_type: 'B767',
                base: 'Port Moresby, Papua New Guinea',
              },
              certifications: {
                total: 571,
                current: 520,
                expiring_soon: 35,
                expired: 16,
              },
            },
            null,
            2
          ),
        },
      ],
    };
  }
);
