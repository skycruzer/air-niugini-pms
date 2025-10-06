# MCP Server Configuration

## Overview

This project uses the Model Context Protocol (MCP) to extend Claude Code's capabilities with specialized tools and integrations. The following MCP servers are configured and active.

---

## Configured MCP Servers

### 1. Supabase MCP Server ✅

**Purpose**: Direct database operations, migrations, and backend management

**Type**: Cloud-hosted MCP Server (URL-based)

**Configuration**:

```json
{
  "url": "https://mcp.supabase.com/mcp?project_ref=wgdmgvonqysflwdiiols&features=docs%2Caccount%2Cdatabase%2Cdevelopment%2Cdebugging%2Cfunctions%2Cbranching%2Cstorage"
}
```

**Enabled Features**:

- `docs` - Documentation search and access
- `account` - Account management and settings
- `database` - Database schema inspection and queries
- `development` - Development tools and migrations
- `debugging` - Debugging and logging tools
- `functions` - Edge Function deployment and management
- `branching` - Database branching for isolated development
- `storage` - Storage bucket management

**Capabilities**:

- Database schema inspection
- Table creation and modification
- Row-level security (RLS) policy management
- Migration generation and execution
- Edge Function deployment
- Storage bucket management
- Real-time subscription configuration
- TypeScript type generation

**Common Operations**:

```
"Create a new table called notifications"
"Add RLS policies to the pilots table"
"Generate TypeScript types from database"
"Deploy an Edge Function for email notifications"
"Create a storage bucket for pilot documents"
```

**Project Integration**:

- Database: PostgreSQL (Project: wgdmgvonqysflwdiiols)
- Tables: pilots, pilot_checks, check_types, leave_requests, etc.
- RLS: Configured for all tables
- Edge Functions: Email notifications, scheduled jobs

---

### 2. shadcn/ui MCP Server ✅

**Purpose**: UI component library management and installation

**Package**: `@modelcontextprotocol/server-shadcn`

**Configuration**:

```json
{
  "command": "npx",
  "args": ["-y", "@modelcontextprotocol/server-shadcn"]
}
```

**Capabilities**:

- Add new shadcn/ui components
- List available components
- Get component documentation
- Update component configuration
- Install dependencies automatically

**Common Operations**:

```
"Add the calendar component from shadcn"
"Install shadcn tooltip"
"List all available shadcn components"
"Add accordion and carousel components"
```

**Project Configuration**:

- Style: New York
- Base Color: Slate
- CSS Variables: Enabled
- TypeScript: TSX format
- Path: `src/components/ui/`

**Currently Installed**:
avatar, badge, button, card, checkbox, dialog, dropdown-menu, input, label, popover, progress, radio-group, scroll-area, select, separator, sheet, skeleton, switch, table, tabs, textarea, toast

**Documentation**: See `SHADCN_MCP_SETUP.md` and `SHADCN_QUICK_REFERENCE.md`

---

## MCP Configuration File

**Location**: `.mcp.json` (project root)

**Full Configuration**:

```json
{
  "mcpServers": {
    "supabase": {
      "url": "https://mcp.supabase.com/mcp?project_ref=wgdmgvonqysflwdiiols&features=docs%2Caccount%2Cdatabase%2Cdevelopment%2Cdebugging%2Cfunctions%2Cbranching%2Cstorage"
    },
    "shadcn": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-shadcn"]
    }
  }
}
```

**Configuration Types**:

- **URL-based** (Supabase): Cloud-hosted MCP server accessed via HTTPS
- **Command-based** (shadcn): Locally executed via npx

---

## How MCP Works

### Architecture

```
Claude Code
    ↓
MCP Protocol
    ↓
┌─────────────────┬──────────────────┐
│  Supabase MCP   │   shadcn MCP     │
└─────────────────┴──────────────────┘
        ↓                  ↓
  Supabase Cloud     shadcn/ui Registry
        ↓                  ↓
  Your Database      UI Components
```

### Communication Flow

1. **Request**: Claude Code sends natural language request
2. **Translation**: MCP server translates to API calls
3. **Execution**: Server performs the operation
4. **Response**: Results returned to Claude Code
5. **Context**: Claude Code uses results for next steps

---

## Using MCP Servers with Claude Code

### Natural Language Commands

MCP servers enable natural language operations:

**Database Operations**:

```
"Show me all tables in the database"
"Create a new column 'retirement_date' in the pilots table"
"Add an index on employee_id"
"Generate TypeScript types"
```

**UI Component Management**:

```
"Add the calendar component"
"Install tooltip and hover-card components"
"Show me what shadcn components are available"
```

### Automatic Context

MCP servers provide context to Claude Code:

- Current database schema
- Installed UI components
- Available operations
- Configuration details

---

## Benefits for This Project

### 1. Faster Development

**Before MCP**:

```bash
# Manual steps
supabase db diff -f migration_name
# Edit SQL file manually
supabase db push
# Update types manually
supabase gen types typescript > types.ts
# Install component manually
npx shadcn@latest add calendar
```

**With MCP**:

```
"Create a migration to add retirement_date column and generate types"
"Add calendar and tooltip components"
```

### 2. Reduced Errors

- MCP servers validate operations before execution
- Automatic dependency resolution
- Consistent configuration

### 3. Intelligent Assistance

Claude Code understands:

- Current database schema
- Installed components
- Project configuration
- Best practices for each tool

---

## MCP Server Tools Available

### Supabase MCP Tools

| Tool                        | Purpose                              |
| --------------------------- | ------------------------------------ |
| `list_tables`               | List all database tables             |
| `list_extensions`           | Show installed PostgreSQL extensions |
| `list_migrations`           | List migration history               |
| `apply_migration`           | Execute DDL operations               |
| `execute_sql`               | Run SQL queries                      |
| `get_logs`                  | Fetch service logs                   |
| `get_advisors`              | Security/performance advisories      |
| `generate_typescript_types` | Generate TypeScript types            |
| `list_edge_functions`       | List deployed functions              |
| `deploy_edge_function`      | Deploy new function                  |
| `create_branch`             | Create development branch            |
| `list_branches`             | List database branches               |
| `list_storage_buckets`      | List storage buckets                 |

### shadcn MCP Tools

| Tool                 | Purpose                   |
| -------------------- | ------------------------- |
| `add_component`      | Install a new component   |
| `list_components`    | Show available components |
| `get_component_info` | Component documentation   |
| `update_config`      | Modify components.json    |

---

## Advanced MCP Features

### Database Branching

Create isolated development databases:

```
"Create a new database branch called 'feature-notifications'"
```

Benefits:

- Test migrations safely
- Parallel development
- Easy rollback
- Production data isolation

### Edge Function Deployment

Deploy serverless functions:

```
"Deploy an Edge Function to send certification expiry emails"
```

Features:

- TypeScript support
- Environment variables
- Scheduled execution
- Direct database access

### Storage Management

Manage file storage:

```
"Create a storage bucket for pilot documents with public access disabled"
```

Capabilities:

- Bucket creation
- RLS policies
- File size limits
- Image transformation

---

## Troubleshooting

### MCP Server Not Responding

1. **Restart Claude Code**: Reload MCP configuration
2. **Check .mcp.json**: Verify syntax is valid JSON
3. **Verify npx**: Ensure Node.js and npx are installed
4. **Check logs**: Look for error messages in Claude Code output

### Supabase MCP Issues

**Connection Failed**:

- Verify `SUPABASE_ACCESS_TOKEN` is valid
- Check `SUPABASE_SERVICE_ROLE_KEY` is correct
- Ensure project ref `wgdmgvonqysflwdiiols` is correct

**Permission Denied**:

- Verify service role key has admin permissions
- Check RLS policies aren't blocking operations

### shadcn MCP Issues

**Component Installation Failed**:

- Verify `components.json` exists
- Check path aliases in `tsconfig.json`
- Ensure TailwindCSS is properly configured

**Component Not Found**:

- Verify component name is correct
- Check shadcn/ui version compatibility

---

## Best Practices

### 1. Use MCP for Repetitive Tasks

✅ **Good**:

```
"Add RLS policies to the new notifications table"
"Generate TypeScript types after schema changes"
```

❌ **Bad**:

```bash
# Manual SQL editing
# Manual type generation
```

### 2. Combine MCP Operations

✅ **Good**:

```
"Create a new table for pilot documents, add RLS policies,
create a storage bucket, and generate TypeScript types"
```

### 3. Verify After Operations

✅ **Good**:

```
"Show me the RLS policies on the pilots table"
"List all database tables to verify the migration"
```

### 4. Use Branches for Experiments

✅ **Good**:

```
"Create a database branch to test the new schema"
```

---

## Security Considerations

### Service Role Key

⚠️ **Important**: The `SUPABASE_SERVICE_ROLE_KEY` has admin access:

- Never commit to git (excluded in `.gitignore`)
- Never expose in client code
- Rotate periodically
- Use environment variables in production

### MCP Configuration

✅ **Secure**:

- `.mcp.json` contains credentials (excluded from git)
- Environment variables used where possible
- Access tokens with limited scope

❌ **Insecure**:

- Committing `.mcp.json` to public repos
- Sharing access tokens
- Using production credentials in development

---

## Additional MCP Servers (Optional)

### Recommended for Air Niugini PMS

1. **Vercel MCP** (Deployment)

   ```json
   {
     "command": "npx",
     "args": ["-y", "@modelcontextprotocol/server-vercel"]
   }
   ```

2. **GitHub MCP** (Version Control)

   ```json
   {
     "command": "npx",
     "args": ["-y", "@modelcontextprotocol/server-github"]
   }
   ```

3. **Playwright MCP** (Testing)
   ```json
   {
     "command": "npx",
     "args": ["-y", "@playwright/mcp"]
   }
   ```

---

## Resources

### MCP Protocol

- **Documentation**: https://modelcontextprotocol.io
- **Specification**: https://spec.modelcontextprotocol.io
- **GitHub**: https://github.com/modelcontextprotocol

### Supabase MCP

- **Package**: https://www.npmjs.com/package/@supabase/mcp-server-supabase
- **Supabase Docs**: https://supabase.com/docs

### shadcn MCP

- **Package**: https://www.npmjs.com/package/@modelcontextprotocol/server-shadcn
- **shadcn/ui Docs**: https://ui.shadcn.com

---

## Project-Specific Files

- `.mcp.json` - MCP server configuration
- `SHADCN_MCP_SETUP.md` - shadcn/ui MCP detailed guide
- `SHADCN_QUICK_REFERENCE.md` - Quick reference for shadcn
- `components.json` - shadcn/ui configuration
- `.env.local` - Supabase credentials (not committed)

---

## Summary

**Active MCP Servers**: 2 (Supabase, shadcn)
**Configuration**: `.mcp.json` (project root)
**Status**: ✅ Fully configured and operational

MCP servers significantly enhance Claude Code's ability to:

- Manage database operations efficiently
- Install and configure UI components
- Generate TypeScript types automatically
- Deploy serverless functions
- Maintain project consistency

---

**Air Niugini B767 Pilot Management System**
_MCP Server Configuration Guide_
_Version 1.0 - October 6, 2025_
