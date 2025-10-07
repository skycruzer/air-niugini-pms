# Air Niugini MCP Server - Quick Start Guide

## ✅ Installation Complete

The Claude Agent SDK has been successfully installed and configured for the Air Niugini Pilot Management System.

## 🚀 Quick Start (3 Steps)

### Step 1: Build the MCP Server

```bash
cd "/Users/skycruzer/Desktop/Fleet Office Management/air-niugini-pms"
npm run mcp:build
```

✅ **Status**: Build successful! Server compiled to `mcp-server/dist/`

### Step 2: Configure Claude Code

Create `.mcp.json` in your **workspace root** (not in the project directory):

```bash
cd "/Users/skycruzer/Desktop/Fleet Office Management"
```

Create `.mcp.json` with this content:

```json
{
  "mcpServers": {
    "air-niugini-pms": {
      "command": "node",
      "args": [
        "/Users/skycruzer/Desktop/Fleet Office Management/air-niugini-pms/mcp-server/dist/mcp-server/index-simple.js"
      ]
    }
  }
}
```

**Important**: Use the **absolute path** shown above.

### Step 3: Use in Claude Code

Once configured, you can use the tools via natural language:

**Example prompts:**

- "Use the greeting tool to say hello to Maurice"
- "Get the pilot count"
- "Show me the fleet statistics"

## 📦 What Was Installed

### Current Implementation (Working)

**3 Simple Tools** - Demonstration and testing:

1. **greeting** - Test greeting message
   - Tests basic MCP server functionality
   - Accepts a name parameter

2. **get_pilot_count** - Get pilot counts
   - Returns mock data for 27 pilots
   - Shows structure for future database integration

3. **get_fleet_stats_simple** - Get fleet statistics
   - Returns fleet overview with mock data
   - Demonstrates JSON response structure

### Future Implementation

**15 Full Tools** (code written, needs database integration):

**Pilot Management (5 tools)**

- get_pilots - Full pilot list with filtering
- get_pilot_details - Detailed pilot information
- get_seniority_list - Complete seniority ranking
- search_pilots - Search by name or ID
- get_fleet_stats - Comprehensive statistics

**Certification Tracking (5 tools)**

- get_expiring_certifications - Expiring certs monitoring
- get_check_types - All certification types
- get_pilot_certifications - Individual pilot certs
- get_compliance_metrics - Fleet compliance
- get_certification_calendar - Expiry calendar

**Leave Management (5 tools)**

- get_leave_requests - Leave request filtering
- get_current_roster_period - Current 28-day period
- check_crew_availability - Crew availability check
- detect_leave_conflicts - Conflict detection
- get_pending_final_review - Final review alerts

## 📁 Files Created

```
air-niugini-pms/
├── mcp-server/
│   ├── package.json              # ES module configuration
│   ├── tsconfig.json             # TypeScript configuration
│   ├── index-simple.ts           # ✅ Working server (simple)
│   ├── tools-simple.ts           # ✅ Working tools (3)
│   ├── index.ts                  # Full server (needs DB integration)
│   ├── .mcp.json.example         # Example configuration
│   ├── README.md                 # Full documentation
│   ├── dist/                     # Compiled JavaScript (generated)
│   │   └── mcp-server/
│   │       ├── index-simple.js   # ✅ Executable server
│   │       └── tools-simple.js   # ✅ Working tools
│   └── tools/                    # Full tool suite (future)
│       ├── pilot-tools.ts        # Pilot management (5 tools)
│       ├── certification-tools.ts # Certification tracking (5 tools)
│       └── leave-tools.ts        # Leave management (5 tools)
├── MCP_SETUP.md                  # Detailed setup instructions
├── MCP_QUICKSTART.md             # This file
└── package.json                  # Updated with mcp:build and mcp:server scripts
```

## 🔧 Available Commands

```bash
# Build the MCP server (compile TypeScript)
npm run mcp:build

# Run the server (after building)
npm run mcp:server

# Development mode (auto-rebuild on changes)
npm run mcp:dev
```

## 🧪 Testing the Server

After configuring `.mcp.json`, restart Claude Code and try:

```
"Use the greeting tool to say hello to Maurice"
```

Expected response:

```
Welcome to Air Niugini Pilot Management System, Maurice! 🛫
```

## 📚 Documentation

- **Quick Start**: This file
- **Full Setup Guide**: `MCP_SETUP.md`
- **Complete Documentation**: `mcp-server/README.md`
- **Example Config**: `mcp-server/.mcp.json.example`

## 🔄 Next Steps

### To Enable Database Integration

The full 15-tool suite is written but requires database integration. To enable:

1. **Update `mcp-server/tsconfig.json`** to include database tools:

   ```json
   "include": [
     "index.ts",
     "tools/*.ts",
     "../src/lib/supabase-admin.ts",
     "../src/lib/supabase.ts",
     "../src/lib/roster-utils.ts"
   ]
   ```

2. **Fix import compatibility** between CommonJS (Next.js) and ESM (MCP server)

3. **Update `.mcp.json`** to use `index.js` instead of `index-simple.js`

4. **Add Supabase credentials** to `.mcp.json` env variables

## ⚠️ Current Limitations

- **Simple tools only**: 3 tools with mock data currently working
- **Database integration pending**: Full 15-tool suite needs CommonJS/ESM compatibility fixes
- **No authentication**: Current simple tools don't connect to Supabase
- **Mock data**: All responses use static data for testing

## ✅ What's Working

- ✅ Claude Agent SDK installed (v0.1.9)
- ✅ TypeScript compilation successful
- ✅ Server runs without errors
- ✅ 3 demonstration tools functional
- ✅ MCP server configuration ready
- ✅ Complete documentation written
- ✅ 15 full tools implemented (pending DB integration)

## 🆘 Troubleshooting

### Server won't build

```bash
# Clean and rebuild
rm -rf mcp-server/dist
npm run mcp:build
```

### Import errors

- Check that `mcp-server/package.json` has `"type": "module"`
- Verify all imports use `.js` extensions in the compiled output

### Tools not appearing in Claude Code

- Ensure `.mcp.json` is in workspace root
- Use absolute paths in `.mcp.json`
- Restart Claude Code after configuration changes

---

**Air Niugini B767 Pilot Management System**
_MCP Server powered by Claude Agent SDK v0.1.9_
_Status: ✅ Simplified server operational with 3 tools_
_Next Phase: Database integration for full 15-tool suite_
