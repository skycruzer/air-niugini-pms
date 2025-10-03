# MCP (Model Context Protocol) Setup Guide

## Project-Specific MCP Configuration

This project uses a **project-specific** `.mcp.json` file to isolate API keys and configuration from the global MCP settings.

### Setup Instructions

1. **Copy the example configuration:**
   ```bash
   cp .mcp.json.example .mcp.json
   ```

2. **Get your Supabase credentials:**

   **Project Reference:** `wgdmgvonqysflwdiiols`

   **Service Role Key:** Found in `.env.local` as `SUPABASE_SERVICE_ROLE_KEY`

   **Access Token:**
   - Visit: https://supabase.com/dashboard/account/tokens
   - Create a new access token
   - Copy the token (starts with `sbp_`)

3. **Update `.mcp.json` with your credentials:**
   ```json
   {
     "mcpServers": {
       "supabase": {
         "command": "npx",
         "args": ["-y", "@supabase/mcp-server-supabase", "--project-ref=wgdmgvonqysflwdiiols"],
         "env": {
           "SUPABASE_ACCESS_TOKEN": "sbp_your_access_token_here",
           "SUPABASE_SERVICE_ROLE_KEY": "your_service_role_key_here"
         }
       }
     }
   }
   ```

4. **Restart Claude Code** to load the new MCP configuration

### Security Notes

⚠️ **IMPORTANT:**
- `.mcp.json` is in `.gitignore` and will NOT be committed to git
- Never commit API keys or tokens to version control
- Each developer needs their own `.mcp.json` file
- Use `.mcp.json.example` as a template

### Available MCP Tools

With the Supabase MCP server configured, you'll have access to:

- `mcp__supabase__list_tables` - List all database tables
- `mcp__supabase__execute_sql` - Execute SQL queries (read-only)
- `mcp__supabase__apply_migration` - Apply database migrations
- `mcp__supabase__list_migrations` - List migration history
- `mcp__supabase__search_docs` - Search Supabase documentation
- `mcp__supabase__get_project_url` - Get API URL
- `mcp__supabase__get_anon_key` - Get anonymous key
- And more...

### Troubleshooting

**Issue: MCP tools not available**
- Ensure `.mcp.json` exists in the project root
- Verify credentials are correct
- Restart Claude Code after making changes

**Issue: "Read-only" errors on migrations**
- This is by design for safety
- Use Supabase Dashboard SQL Editor for DDL operations
- Or use `mcp__supabase__apply_migration` for tracked migrations

**Issue: Wrong project data**
- Verify `project-ref` is `wgdmgvonqysflwdiiols`
- Check that service role key matches `.env.local`

### Project Information

- **Project ID:** wgdmgvonqysflwdiiols
- **Project URL:** https://wgdmgvonqysflwdiiols.supabase.co
- **Dashboard:** https://supabase.com/dashboard/project/wgdmgvonqysflwdiiols

### Migration Workflow

1. Create migration file in `supabase/migrations/`
2. Use naming: `YYYYMMDD_description.sql`
3. Apply via Dashboard SQL Editor or MCP tools
4. Verify changes with `mcp__supabase__list_migrations`

---

**Air Niugini B767 Pilot Management System**
*MCP Configuration - Version 1.0*
