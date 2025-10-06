# MCP Server Setup Guide - Air Niugini PMS

## Current MCP Configuration

The project now has Supabase MCP configured correctly with proper authentication.

## Configuration Details

### Supabase MCP Server

- **Type**: Command-based (npx)
- **Package**: `@supabase/mcp-server-supabase`
- **Project**: wgdmgvonqysflwdiiols
- **Authentication**: Access token + Service role key

### Configuration Files

1. **Project Level**: `/Users/skycruzer/Desktop/Fleet Office Management/.mcp.json`
2. **App Level**: `/Users/skycruzer/Desktop/Fleet Office Management/air-niugini-pms/.mcp.json`

Both files are now synchronized with correct authentication.

## MCP Servers Status

✅ **Connected**:

- `exa` - Web search and research
- `playwright` - Browser automation
- `filesystem` - File system operations

🔧 **Fixed**:

- `supabase` - Changed from HTTP to command-based with proper auth

❌ **Failed** (not required):

- `database` - Generic database (not needed, using Supabase)
- `vercel` - Deployment (can be configured later)
- `context7` - Documentation (can be configured later)
- `figma` - Design (not needed for this project)

## How to Reconnect MCP Servers

After updating the configuration, you need to:

1. **Restart Claude Code** to reload MCP configuration
2. **Or reload the MCP servers** from the settings

## Testing Supabase MCP

Once reconnected, you can test with:

```bash
# In the air-niugini-pms directory
node test-connection.js
```

## Available MCP Tools

When Supabase MCP is connected, you'll have access to:

- Database table operations
- Schema migrations
- SQL execution
- Type generation
- Real-time subscriptions

## Next Steps

1. ✅ Updated MCP configuration with proper authentication
2. 🔄 Restart Claude Code or reload MCP servers
3. ✅ Verify Supabase MCP shows "connected" status
4. 🚀 Deploy database schema
5. 📊 Populate with sample data

---

**Project**: Air Niugini B767 Pilot Management System
**Database**: Supabase PostgreSQL (wgdmgvonqysflwdiiols)
