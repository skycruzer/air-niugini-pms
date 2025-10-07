# Air Niugini MCP Server - Claude Agent SDK

Model Context Protocol (MCP) server for Air Niugini B767 Pilot Management System, built with the Claude Agent SDK.

## Overview

This MCP server provides **15 specialized tools** for managing pilot operations, certification tracking, and leave management for Air Niugini's B767 fleet operations.

### Tool Categories

1. **Pilot Management** (5 tools) - Pilot data, seniority, and fleet statistics
2. **Certification Tracking** (5 tools) - Certification compliance and expiry monitoring
3. **Leave Management** (5 tools) - Leave requests, crew availability, and roster periods

## Installation & Setup

### 1. Build the MCP Server

```bash
npm run mcp:build
```

This compiles the TypeScript code in `mcp-server/` to JavaScript in `mcp-server/dist/`.

### 2. Run the Server

```bash
npm run mcp:server
```

Or for development with auto-rebuild:

```bash
npm run mcp:dev
```

### 3. Configure in Claude Code

Add to `.mcp.json` in your workspace root:

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

**IMPORTANT**: Use absolute paths in `.mcp.json` for reliable execution.

## Available Tools

### Pilot Management Tools

#### 1. `get_pilots`

Get all pilots with optional filtering.

**Parameters:**

- `role` (optional): `"Captain"`, `"First Officer"`, or `"all"`
- `status` (optional): `"Active"`, `"Inactive"`, or `"all"`
- `include_certifications` (optional): Include certification counts

**Example:**

```typescript
{
  "role": "Captain",
  "status": "Active",
  "include_certifications": true
}
```

**Returns:**

```json
{
  "success": true,
  "count": 15,
  "pilots": [...]
}
```

#### 2. `get_pilot_details`

Get comprehensive details for a specific pilot.

**Parameters:**

- `pilot_id` (optional): Database UUID
- `employee_id` (optional): Air Niugini employee ID

**Note:** Provide either `pilot_id` OR `employee_id`.

**Returns:**

```json
{
  "success": true,
  "pilot": {
    "id": "...",
    "employee_id": "PN001",
    "first_name": "John",
    "last_name": "Doe",
    "role": "Captain",
    "seniority_number": 5,
    "pilot_checks": [...]
  }
}
```

#### 3. `get_seniority_list`

Get the complete seniority list.

**Parameters:**

- `role` (optional): Filter by `"Captain"`, `"First Officer"`, or `"all"`

**Returns:**

```json
{
  "success": true,
  "count": 27,
  "seniority_list": [
    {
      "rank": 1,
      "seniority_number": 1,
      "employee_id": "PN001",
      "first_name": "...",
      "commencement_date": "2010-03-15"
    }
  ]
}
```

#### 4. `search_pilots`

Search pilots by name or employee ID.

**Parameters:**

- `search_term`: Search string for name or employee ID
- `limit` (optional): Maximum results (default: 10)

**Example:**

```typescript
{
  "search_term": "John",
  "limit": 5
}
```

#### 5. `get_fleet_stats`

Get comprehensive fleet statistics.

**Parameters:** None

**Returns:**

```json
{
  "success": true,
  "fleet_overview": {
    "total_pilots": 27,
    "active_pilots": 25,
    "captains": {
      "total": 15,
      "active": 14
    },
    "first_officers": {
      "total": 12,
      "active": 11
    }
  },
  "certification_compliance": {...}
}
```

---

### Certification Tracking Tools

#### 6. `get_expiring_certifications`

Get certifications expiring within a timeframe.

**Parameters:**

- `days_ahead` (optional): Days to look ahead (default: 60)
- `category` (optional): Filter by certification category
- `status` (optional): `"expired"`, `"expiring_soon"`, `"current"`, or `"all"`

**Example:**

```typescript
{
  "days_ahead": 90,
  "status": "expiring_soon"
}
```

**Returns:**

```json
{
  "success": true,
  "count": 15,
  "certifications": [...],
  "summary": {
    "expired": 2,
    "expiring_soon": 8,
    "current": 5
  }
}
```

**Status Definitions:**

- **Expired**: Expiry date has passed
- **Expiring Soon**: 0-30 days until expiry
- **Current**: More than 30 days until expiry

#### 7. `get_check_types`

Get all certification check types.

**Parameters:**

- `category` (optional): Filter by specific category

**Returns:**

```json
{
  "success": true,
  "total_check_types": 34,
  "categories": ["Flight Training", "Medical", "Security", ...],
  "check_types": {
    "Flight Training": [...],
    "Medical": [...]
  }
}
```

#### 8. `get_pilot_certifications`

Get all certifications for a specific pilot.

**Parameters:**

- `pilot_id` (optional): Database UUID
- `employee_id` (optional): Employee ID
- `include_history` (optional): Include historical dates

**Returns:**

```json
{
  "success": true,
  "pilot": {...},
  "certification_count": 21,
  "certifications": [...],
  "summary": {
    "expired": 0,
    "expiring_soon": 2,
    "current": 18,
    "no_date": 1
  }
}
```

#### 9. `get_compliance_metrics`

Get fleet-wide compliance metrics.

**Parameters:** None

**Returns:**

```json
{
  "success": true,
  "compliance_metrics": {
    "total_certifications": 571,
    "current_certifications": 520,
    "expiring_certifications": 35,
    "expired_certifications": 16
  },
  "compliance_percentage": 91
}
```

#### 10. `get_certification_calendar`

Get certification expiries for a date range.

**Parameters:**

- `start_date`: Start date (YYYY-MM-DD)
- `end_date`: End date (YYYY-MM-DD)
- `group_by` (optional): `"day"`, `"week"`, or `"month"`

**Example:**

```typescript
{
  "start_date": "2025-10-01",
  "end_date": "2025-12-31",
  "group_by": "month"
}
```

---

### Leave Management Tools

#### 11. `get_leave_requests`

Get leave requests with filtering.

**Parameters:**

- `status` (optional): `"Pending"`, `"Approved"`, `"Rejected"`, or `"all"`
- `roster_period` (optional): Roster period code (e.g., `"RP11/2025"`)
- `pilot_id` (optional): Filter by pilot
- `include_pilot_details` (optional): Include full pilot info (default: true)

**Example:**

```typescript
{
  "status": "Pending",
  "roster_period": "RP12/2025"
}
```

**Returns:**

```json
{
  "success": true,
  "count": 8,
  "leave_requests": [...],
  "summary": {
    "pending": 3,
    "approved": 4,
    "rejected": 1
  }
}
```

#### 12. `get_current_roster_period`

Get current 28-day roster period information.

**Parameters:** None

**Returns:**

```json
{
  "success": true,
  "current_roster": {
    "code": "RP11/2025",
    "number": 11,
    "year": 2025,
    "startDate": "2025-09-13",
    "endDate": "2025-10-10",
    "days_remaining": 5,
    "is_final_review_period": true
  }
}
```

**Note:** `is_final_review_period` is `true` when 22 or fewer days remain.

#### 13. `check_crew_availability`

Check crew availability for a date range.

**Parameters:**

- `start_date`: Start date (YYYY-MM-DD)
- `end_date`: End date (YYYY-MM-DD)
- `exclude_request_id` (optional): Exclude a specific request

**Example:**

```typescript
{
  "start_date": "2025-10-15",
  "end_date": "2025-10-20"
}
```

**Returns:**

```json
{
  "success": true,
  "date_range": {...},
  "crew_availability": {
    "captains": {
      "total": 15,
      "on_leave": 3,
      "available": 12,
      "meets_minimum": true,
      "minimum_required": 10
    },
    "first_officers": {
      "total": 12,
      "on_leave": 2,
      "available": 10,
      "meets_minimum": true,
      "minimum_required": 10
    }
  },
  "overall_status": "sufficient"
}
```

**Business Rule:** Minimum 10 Captains AND 10 First Officers must be available at all times.

#### 14. `detect_leave_conflicts`

Detect conflicting leave requests.

**Parameters:**

- `pilot_id`: Pilot to check conflicts for
- `start_date`: Start date (YYYY-MM-DD)
- `end_date`: End date (YYYY-MM-DD)
- `exclude_request_id` (optional): Exclude a specific request

**Returns:**

```json
{
  "success": true,
  "pilot": {...},
  "has_conflicts": true,
  "conflict_count": 2,
  "conflicts": [...],
  "seniority_comparison": [
    {
      "pilot_name": "Senior Pilot",
      "seniority_number": 3,
      "has_priority": true,
      "request_status": "Approved"
    }
  ]
}
```

**Important:** Conflicts are ONLY detected for pilots of the **same rank** (Captain vs Captain, First Officer vs First Officer).

#### 15. `get_pending_final_review`

Get pending requests requiring final review.

**Parameters:**

- `roster_period_code` (optional): Specific roster period (defaults to next period)

**Returns:**

```json
{
  "success": true,
  "roster_period": {
    "code": "RP12/2025",
    "startDate": "2025-10-11",
    "endDate": "2025-11-07"
  },
  "days_until_period_start": 6,
  "is_urgent": true,
  "pending_count": 5,
  "pending_requests": [...],
  "by_role": {
    "captains": 3,
    "first_officers": 2
  }
}
```

**Note:** `is_urgent` is `true` when 7 or fewer days remain before the roster period starts.

---

## Architecture

### Directory Structure

```
mcp-server/
├── index.ts                    # Server entry point
├── tsconfig.json              # TypeScript configuration
├── README.md                  # This file
└── tools/
    ├── pilot-tools.ts         # Pilot management tools (5)
    ├── certification-tools.ts # Certification tracking tools (5)
    └── leave-tools.ts         # Leave management tools (5)
```

### Tool Implementation Pattern

All tools follow this pattern:

```typescript
import { tool } from '@anthropic-ai/claude-agent-sdk';
import { z } from 'zod';

export const myTool = tool({
  name: 'tool_name',
  description: 'Clear description of what the tool does',
  parameters: z.object({
    param1: z.string().describe('Parameter description'),
    param2: z.number().optional().describe('Optional parameter'),
  }),
  execute: async ({ param1, param2 }) => {
    // Tool implementation
    return {
      success: true,
      data: result,
    };
  },
});
```

### Data Access

All tools use the **service role client** for unrestricted database access:

```typescript
import { getSupabaseAdmin } from '../../src/lib/supabase-admin';

const supabase = getSupabaseAdmin();
```

This bypasses Row Level Security (RLS) policies, appropriate for MCP server operations.

---

## Business Logic Reference

### Seniority System

- **Seniority Number**: Lower number = Higher seniority (1 is most senior)
- **Calculation**: Based on `commencement_date` (earliest date = lowest number)
- **Leave Priority**: Lower seniority number gets priority for leave requests

### Roster Periods

- **Duration**: 28 days per roster period
- **Naming**: `RP{number}/{year}` (e.g., `RP11/2025`)
- **Known Anchor**: RP11/2025 ends on 2025-10-10
- **Calculation**: All periods calculated from this anchor point

### Certification Status

- **Expired**: `expiry_date < today`
- **Expiring Soon**: `0 <= days_until_expiry <= 30`
- **Current**: `days_until_expiry > 30`
- **No Date**: `expiry_date is null`

### Crew Availability Rules

1. **Minimum Requirements**:
   - 10 Captains available at all times
   - 10 First Officers available at all times
   - Requirements are **independent** (both must be met)

2. **Leave Conflicts**:
   - Only detected between pilots of the **same rank**
   - Captains are NOT compared with First Officers
   - Seniority determines priority within same rank

3. **Final Review Period**:
   - Alerts shown 22 days before roster period starts
   - Urgent when ≤7 days remain
   - Only applies to **next** roster period (not current or following)

---

## Development

### Building

```bash
npm run mcp:build
```

Compiles TypeScript to `mcp-server/dist/`.

### Development Mode

```bash
npm run mcp:dev
```

Watches for file changes and rebuilds automatically.

### Testing Tools

You can test individual tools using the MCP server directly via Claude Code once configured.

**Example prompt:**

> "Use the get_fleet_stats tool to show me the current fleet overview"

---

## Environment Variables

The MCP server requires these environment variables (set in `.mcp.json`):

```
NEXT_PUBLIC_SUPABASE_URL          # Supabase project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY     # Supabase anonymous key
SUPABASE_SERVICE_ROLE_KEY         # Supabase service role key (admin)
SUPABASE_PROJECT_ID               # Supabase project ID
```

**Security Note:** The service role key has full database access. Never expose it in client-side code or public repositories.

---

## Troubleshooting

### Server Won't Start

1. **Check build**: `npm run mcp:build`
2. **Verify paths**: Use absolute paths in `.mcp.json`
3. **Check environment**: Ensure all env vars are set in `.mcp.json`

### Tools Not Working

1. **Check database connection**: Verify Supabase credentials
2. **Review logs**: Server outputs errors to console
3. **Test database**: Use `node test-connection.js` in project root

### TypeScript Errors

1. **Clean build**: Delete `mcp-server/dist/` and rebuild
2. **Check tsconfig**: Ensure `mcp-server/tsconfig.json` extends root config
3. **Update types**: `npm run mcp:build` after schema changes

---

## Integration with Claude Code

### Example Usage

Once configured, you can interact with the MCP server through Claude Code:

**Get fleet statistics:**

> "Show me the current fleet statistics"

**Check expiring certifications:**

> "What certifications are expiring in the next 30 days?"

**Check crew availability:**

> "Can we approve leave for Captain Smith from October 15-20?"

**Get seniority list:**

> "Show me the seniority list for all Captains"

**Detect conflicts:**

> "Check if there are any leave conflicts for pilot PN015 from October 10-17"

---

## Version History

- **v1.0.0** (2025-10-07) - Initial release with 15 tools
  - Pilot management tools (5)
  - Certification tracking tools (5)
  - Leave management tools (5)

---

## Support

For issues or questions about the MCP server:

1. Check this documentation
2. Review tool descriptions in source code
3. Test database connection: `node test-connection.js`
4. Check MCP server logs for error messages

---

**Air Niugini B767 Pilot Management System**
_MCP Server powered by Claude Agent SDK_
_Version 1.0.0_
