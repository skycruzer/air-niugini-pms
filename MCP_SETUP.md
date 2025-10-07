# MCP Server Setup Guide

This document provides quick setup instructions for the Air Niugini MCP Server using Claude Agent SDK.

## Quick Start

### 1. Install Dependencies

The Claude Agent SDK is already installed as a project dependency.

### 2. Build the MCP Server

```bash
npm run mcp:build
```

This compiles the TypeScript code in `mcp-server/` to JavaScript.

### 3. Configure Claude Code

Create or update `.mcp.json` in the **workspace root** (parent of `air-niugini-pms/`):

```bash
cd "/Users/skycruzer/Desktop/Fleet Office Management"
```

Create `.mcp.json`:

```json
{
  "mcpServers": {
    "air-niugini-pms": {
      "command": "node",
      "args": [
        "/Users/skycruzer/Desktop/Fleet Office Management/air-niugini-pms/mcp-server/dist/index.js"
      ],
      "env": {
        "NEXT_PUBLIC_SUPABASE_URL": "https://wgdmgvonqysflwdiiols.supabase.co",
        "NEXT_PUBLIC_SUPABASE_ANON_KEY": "your-anon-key",
        "SUPABASE_SERVICE_ROLE_KEY": "your-service-role-key",
        "SUPABASE_PROJECT_ID": "wgdmgvonqysflwdiiols"
      }
    }
  }
}
```

**IMPORTANT:**

- Use **absolute paths** in `.mcp.json`
- Place `.mcp.json` in the workspace root, not the project directory
- Replace `your-anon-key` and `your-service-role-key` with actual keys from `.env.local`

### 4. Get Your Supabase Keys

Keys are in `air-niugini-pms/.env.local`:

```bash
cat air-niugini-pms/.env.local | grep SUPABASE
```

Copy:

- `NEXT_PUBLIC_SUPABASE_ANON_KEY` → Use for `NEXT_PUBLIC_SUPABASE_ANON_KEY` in `.mcp.json`
- `SUPABASE_SERVICE_ROLE_KEY` → Use for `SUPABASE_SERVICE_ROLE_KEY` in `.mcp.json`

### 5. Test the Server

```bash
npm run mcp:server
```

You should see:

```
Air Niugini Pilot Management System MCP Server started
Available tools:
  Pilot Management: 5 tools
  Certification Tracking: 5 tools
  Leave Management: 5 tools
Total: 15 tools available
```

### 6. Use in Claude Code

Once configured, use tools via natural language:

**Example prompts:**

- "Show me the fleet statistics"
- "What certifications are expiring in the next 30 days?"
- "Get the seniority list for all Captains"
- "Check crew availability for October 15-20"

## Available Tools (15 Total)

### Pilot Management (5 tools)

1. `get_pilots` - Get all pilots with filtering
2. `get_pilot_details` - Get detailed pilot information
3. `get_seniority_list` - Get complete seniority list
4. `search_pilots` - Search pilots by name or ID
5. `get_fleet_stats` - Get comprehensive fleet statistics

### Certification Tracking (5 tools)

6. `get_expiring_certifications` - Get expiring certifications
7. `get_check_types` - Get all certification types
8. `get_pilot_certifications` - Get certifications for a pilot
9. `get_compliance_metrics` - Get fleet compliance metrics
10. `get_certification_calendar` - Get certification calendar

### Leave Management (5 tools)

11. `get_leave_requests` - Get leave requests with filtering
12. `get_current_roster_period` - Get current roster period
13. `check_crew_availability` - Check crew availability
14. `detect_leave_conflicts` - Detect leave conflicts
15. `get_pending_final_review` - Get pending final review requests

## Development Commands

```bash
# Build MCP server
npm run mcp:build

# Run MCP server
npm run mcp:server

# Development mode (auto-rebuild)
npm run mcp:dev
```

## Troubleshooting

### "Cannot find module" error

- Run `npm run mcp:build` to compile TypeScript
- Check that `mcp-server/dist/index.js` exists

### "Connection failed" error

- Verify Supabase keys in `.mcp.json`
- Test database: `node test-connection.js`

### Tools not appearing in Claude Code

- Ensure `.mcp.json` is in workspace root (not project directory)
- Use absolute paths in `.mcp.json`
- Restart Claude Code after configuration changes

## File Locations

```
Fleet Office Management/                    # Workspace root
├── .mcp.json                              # MCP configuration (create this)
└── air-niugini-pms/                       # Project directory
    ├── .env.local                         # Supabase keys (source)
    ├── package.json                       # Scripts defined here
    ├── MCP_SETUP.md                       # This file
    └── mcp-server/
        ├── README.md                      # Full documentation
        ├── .mcp.json.example              # Example config
        ├── index.ts                       # Server entry point
        ├── tsconfig.json                  # TypeScript config
        ├── dist/                          # Compiled output
        │   └── index.js                   # Built server (created by npm run mcp:build)
        └── tools/
            ├── pilot-tools.ts             # Pilot management
            ├── certification-tools.ts     # Certification tracking
            └── leave-tools.ts             # Leave management
```

## Next Steps

1. ✅ Build the server: `npm run mcp:build`
2. ✅ Create `.mcp.json` in workspace root
3. ✅ Add your Supabase keys to `.mcp.json`
4. ✅ Test: `npm run mcp:server`
5. ✅ Use in Claude Code with natural language

For detailed documentation, see `mcp-server/README.md`.

---

**Air Niugini B767 Pilot Management System**
_MCP Server powered by Claude Agent SDK v0.1.9_
