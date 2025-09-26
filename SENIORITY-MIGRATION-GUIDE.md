# Seniority Number Migration Guide

## Overview

This guide explains how to add and use the `seniority_number` column in the Air Niugini B767 Pilot Management System.

## Migration Steps

### Step 1: Apply the Database Migration

You need to run the SQL migration manually in your Supabase SQL editor:

1. **Go to your Supabase Dashboard**
   - Navigate to: https://supabase.com/dashboard/project/wgdmgvonqysflwdiiols
   - Click on "SQL Editor" in the left sidebar

2. **Run the Migration SQL**
   Copy and paste the following SQL commands:

```sql
-- Add seniority_number column to an_pilots table
ALTER TABLE an_pilots 
ADD COLUMN seniority_number INTEGER;

-- Add index for performance when sorting by seniority
CREATE INDEX idx_an_pilots_seniority_number ON an_pilots(seniority_number);

-- Add comment to document the column purpose
COMMENT ON COLUMN an_pilots.seniority_number IS 'Pilot seniority number for ranking and benefits calculation. Lower numbers indicate higher seniority.';

-- Verify the column was added successfully
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'an_pilots' 
AND column_name = 'seniority_number';
```

3. **Click "Run" to execute the migration**

### Step 2: Verify Migration Success

After running the migration, you should see output similar to:
```
column_name        | data_type | is_nullable
seniority_number   | integer   | YES
```

## Using Seniority Numbers

### Seniority Number System

- **Lower numbers = Higher seniority** (e.g., 1 = most senior pilot)
- **NULL values allowed** for pilots without assigned seniority
- **Integer field** for easy sorting and comparison

### Example Seniority Assignment

```sql
-- Assign seniority numbers based on commencement date (earliest = most senior)
WITH seniority_ranking AS (
  SELECT 
    id,
    ROW_NUMBER() OVER (ORDER BY commencement_date ASC) as seniority_rank
  FROM an_pilots 
  WHERE is_active = true
)
UPDATE an_pilots 
SET seniority_number = seniority_ranking.seniority_rank
FROM seniority_ranking 
WHERE an_pilots.id = seniority_ranking.id;
```

### Common Queries with Seniority

```sql
-- Get all pilots ordered by seniority (most senior first)
SELECT employee_id, first_name, last_name, seniority_number, commencement_date
FROM an_pilots 
WHERE is_active = true
ORDER BY seniority_number ASC NULLS LAST;

-- Get top 10 most senior captains
SELECT employee_id, first_name, last_name, seniority_number
FROM an_pilots 
WHERE is_active = true 
AND role = 'Captain'
AND seniority_number IS NOT NULL
ORDER BY seniority_number ASC
LIMIT 10;

-- Find pilots without assigned seniority
SELECT employee_id, first_name, last_name, commencement_date
FROM an_pilots 
WHERE is_active = true 
AND seniority_number IS NULL
ORDER BY commencement_date ASC;
```

## Frontend Integration

### TypeScript Type Updates

After applying the migration, update your TypeScript types to include the new field:

```typescript
// types/database.ts
export interface Pilot {
  id: string;
  employee_id: string;
  first_name: string;
  middle_name?: string;
  last_name: string;
  role: 'Captain' | 'First Officer';
  contract_type?: string;
  nationality?: string;
  passport_number?: string;
  passport_expiry?: Date;
  date_of_birth?: Date;
  commencement_date?: Date;
  seniority_number?: number;  // NEW FIELD
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}
```

### UI Components

```tsx
// components/PilotList.tsx
function PilotList() {
  // Sort pilots by seniority
  const sortedPilots = pilots?.sort((a, b) => {
    if (a.seniority_number === null) return 1;
    if (b.seniority_number === null) return -1;
    return a.seniority_number - b.seniority_number;
  });

  return (
    <div>
      {sortedPilots?.map((pilot) => (
        <div key={pilot.id} className="pilot-card">
          <h3>{pilot.first_name} {pilot.last_name}</h3>
          <p>Employee ID: {pilot.employee_id}</p>
          <p>Seniority: {pilot.seniority_number || 'Not Assigned'}</p>
          <p>Role: {pilot.role}</p>
        </div>
      ))}
    </div>
  );
}
```

### Form Updates

```tsx
// components/PilotForm.tsx
function PilotForm() {
  const form = useForm({
    defaultValues: {
      // ... other fields
      seniority_number: undefined,
    }
  });

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      {/* ... other fields */}
      
      <div>
        <label htmlFor="seniority_number">Seniority Number</label>
        <input
          id="seniority_number"
          type="number"
          min="1"
          placeholder="Enter seniority number (optional)"
          {...form.register('seniority_number', {
            valueAsNumber: true,
            min: { value: 1, message: 'Seniority number must be positive' }
          })}
        />
        <p className="text-sm text-gray-600">
          Lower numbers indicate higher seniority (1 = most senior)
        </p>
      </div>
    </form>
  );
}
```

## Administrative Tasks

### Bulk Seniority Assignment

For initial setup, you can assign seniority numbers based on various criteria:

```sql
-- Option 1: By commencement date (earliest = most senior)
WITH seniority_ranking AS (
  SELECT 
    id,
    ROW_NUMBER() OVER (ORDER BY commencement_date ASC) as seniority_rank
  FROM an_pilots 
  WHERE is_active = true
)
UPDATE an_pilots 
SET seniority_number = seniority_ranking.seniority_rank
FROM seniority_ranking 
WHERE an_pilots.id = seniority_ranking.id;

-- Option 2: Separate ranking for Captains and First Officers
WITH captain_ranking AS (
  SELECT 
    id,
    ROW_NUMBER() OVER (ORDER BY commencement_date ASC) as seniority_rank
  FROM an_pilots 
  WHERE is_active = true AND role = 'Captain'
),
fo_ranking AS (
  SELECT 
    id,
    1000 + ROW_NUMBER() OVER (ORDER BY commencement_date ASC) as seniority_rank
  FROM an_pilots 
  WHERE is_active = true AND role = 'First Officer'
)
UPDATE an_pilots 
SET seniority_number = COALESCE(captain_ranking.seniority_rank, fo_ranking.seniority_rank)
FROM captain_ranking 
FULL OUTER JOIN fo_ranking ON captain_ranking.id = fo_ranking.id
WHERE an_pilots.id = COALESCE(captain_ranking.id, fo_ranking.id);
```

### Seniority Reports

```sql
-- Seniority list report
SELECT 
  seniority_number,
  employee_id,
  first_name || ' ' || last_name as full_name,
  role,
  contract_type,
  commencement_date,
  EXTRACT(YEAR FROM AGE(CURRENT_DATE, commencement_date)) as years_of_service
FROM an_pilots 
WHERE is_active = true
ORDER BY seniority_number ASC NULLS LAST;
```

## Files Modified

The following files have been updated to include the seniority_number column:

1. **`supabase-schema.sql`** - Updated pilots table definition and indexes
2. **`migration-add-seniority-number.sql`** - Standalone migration script
3. **`run-seniority-migration.js`** - Node.js migration helper script

## Next Steps

1. Apply the migration in Supabase SQL editor
2. Update TypeScript types if using the project's type definitions
3. Assign initial seniority numbers to existing pilots
4. Update UI components to display and edit seniority numbers
5. Implement seniority-based features (scheduling priority, leave allocation, etc.)

## Support

If you encounter any issues with the migration, check:

1. **Database Connection**: Ensure your Supabase connection is active
2. **Permissions**: Verify you have admin access to modify the database schema
3. **Existing Data**: The migration is safe and won't affect existing pilot data
4. **Index Creation**: The index improves performance for seniority-based queries

The seniority_number field is nullable, so existing functionality will continue to work without any disruption.