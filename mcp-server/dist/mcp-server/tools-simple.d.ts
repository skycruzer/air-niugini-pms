/**
 * Simplified Air Niugini Tools for Claude Agent SDK
 * Using correct SDK API (4-parameter tool function)
 */
import { z } from 'zod';
/**
 * Simple greeting tool to test MCP server
 */
export declare const greetingTool: {
    name: string;
    description: string;
    inputSchema: {
        name: z.ZodString;
    };
    handler: (args: {
        name: string;
    }, extra: unknown) => Promise<import("@modelcontextprotocol/sdk/types.js").CallToolResult>;
};
/**
 * Get pilot count
 */
export declare const getPilotCountTool: {
    name: string;
    description: string;
    inputSchema: {};
    handler: (args: Record<string, never>, extra: unknown) => Promise<import("@modelcontextprotocol/sdk/types.js").CallToolResult>;
};
/**
 * Get fleet statistics
 */
export declare const getFleetStatsSimpleTool: {
    name: string;
    description: string;
    inputSchema: {};
    handler: (args: Record<string, never>, extra: unknown) => Promise<import("@modelcontextprotocol/sdk/types.js").CallToolResult>;
};
//# sourceMappingURL=tools-simple.d.ts.map