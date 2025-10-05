# Advanced Analytics & Custom Report Builder Guide

**Air Niugini B767 Pilot Management System**
Version 1.0 - Phase 6.3 Implementation

---

## Table of Contents

1. [Overview](#overview)
2. [Advanced Analytics Dashboard](#advanced-analytics-dashboard)
3. [Analytics Components](#analytics-components)
4. [Custom Report Builder](#custom-report-builder)
5. [Advanced Filtering](#advanced-filtering)
6. [Export Functionality](#export-functionality)
7. [Scheduled Reports](#scheduled-reports)
8. [Analytics API Routes](#analytics-api-routes)
9. [Advanced Chart Components](#advanced-chart-components)
10. [Best Practices](#best-practices)

---

## Overview

The Advanced Analytics & Custom Report Builder system provides comprehensive data analysis, predictive forecasting, and flexible reporting capabilities for the Air Niugini B767 fleet management system.

### Key Features

- **Interactive Analytics**: Real-time data visualization with drill-down capabilities
- **Predictive Forecasting**: ML-powered predictions for certification renewals
- **Custom Report Builder**: Drag-and-drop interface for creating custom reports
- **Advanced Filtering**: Complex filter expressions with AND/OR logic
- **Multiple Export Formats**: PDF, Excel, CSV, and JSON exports
- **Scheduled Reports**: Automated report generation and email delivery
- **Performance Optimized**: Cached queries for large datasets

---

## Advanced Analytics Dashboard

### Location
`/dashboard/analytics/advanced`

### Features

#### 1. **Trend Analysis**
- Time series visualization with historical data
- Predictive forecasting with confidence intervals
- Comparative analytics (Year-over-Year, Month-over-Month)
- Interactive charts with drill-down capabilities

**Available Metrics:**
- Compliance Rate Trends
- Certification Volume Trends
- Pilot Statistics Over Time
- Leave Utilization Patterns

**Time Ranges:**
- Last Month (1m)
- Last 3 Months (3m)
- Last 6 Months (6m)
- Last 12 Months (12m)
- Year to Date (ytd)
- All Time (all)

#### 2. **Compliance Metrics**
- Overall compliance score (gauge visualization)
- Category-specific compliance breakdown
- Status distribution (Current/Expiring/Expired)
- Risk indicators with actionable insights

**Visualizations:**
- Circular gauge for overall compliance
- Bar charts for category comparison
- Radar charts for multi-dimensional view
- Pie charts for status distribution

#### 3. **Pilot Analytics**
- Pilot performance metrics
- Seniority distribution
- Certification count by pilot
- Performance matrix (scatter plot)

**Key Metrics:**
- Total Pilots (Captains vs First Officers)
- Average Certifications per Pilot
- Average Seniority
- Average Age

#### 4. **Certification Analytics**
- Renewal trends (historical and forecasted)
- Category-specific trends
- Expiry forecast (next 6 months)
- Renewal rate tracking

**Insights:**
- Monthly renewal vs expiration rates
- Category growth patterns
- Predictive expiry alerts
- Renewal efficiency metrics

#### 5. **Leave Analytics**
- Leave type distribution (RDO, WDO, Annual)
- Approval rate trends
- Utilization by pilot
- Monthly leave patterns

**Visualizations:**
- Pie charts for leave type distribution
- Line charts for approval trends
- Bar charts for monthly patterns
- Horizontal bar charts for pilot utilization

---

## Analytics Components

### TrendAnalysis Component

**Location:** `/components/analytics/TrendAnalysis.tsx`

**Props:**
```typescript
interface TrendAnalysisProps {
  timeRange: string; // '1m' | '3m' | '6m' | '12m' | 'ytd' | 'all'
}
```

**Features:**
- Line and area chart toggles
- Forecast visibility controls
- Trend indicators (up/down with percentages)
- Key insights panel

**Usage:**
```tsx
import TrendAnalysis from '@/components/analytics/TrendAnalysis';

<TrendAnalysis timeRange="12m" />
```

### ComplianceMetrics Component

**Location:** `/components/analytics/ComplianceMetrics.tsx`

**Features:**
- Overall compliance gauge
- Category breakdown with progress bars
- Radar chart for multi-dimensional view
- Status distribution pie chart
- Risk indicator alerts

**Usage:**
```tsx
import ComplianceMetrics from '@/components/analytics/ComplianceMetrics';

<ComplianceMetrics timeRange="6m" />
```

### PilotAnalytics Component

**Location:** `/components/analytics/PilotAnalytics.tsx`

**Features:**
- Quick stat cards
- Seniority distribution bar chart
- Top performers ranking
- Performance matrix scatter plot

### CertificationAnalytics Component

**Location:** `/components/analytics/CertificationAnalytics.tsx`

**Features:**
- Certification metrics cards
- Renewal trend composed chart
- Category trends stacked area chart
- Expiry forecast with historical comparison

### LeaveAnalytics Component

**Location:** `/components/analytics/LeaveAnalytics.tsx`

**Features:**
- Leave metrics summary
- Type distribution pie chart
- Approval rate trend
- Monthly patterns bar chart
- Utilization by pilot

---

## Custom Report Builder

### Location
`/components/reports/ReportBuilder.tsx`

### Features

#### 1. **Drag-and-Drop Interface**
- Available fields organized by category (Pilot, Certification, Leave)
- Visual field selection with icons
- Reorderable selected fields
- Real-time preview

#### 2. **Field Configuration**
- **Sorting**: Ascending or descending order
- **Aggregation**: None, Count, Sum, Average, Min, Max
- **Custom Labels**: Rename fields in output

#### 3. **Report Options**
- **Group By**: Group results by any selected field
- **Save Templates**: Store report configurations for reuse
- **Export Formats**: PDF, Excel, CSV, JSON

### Available Fields

**Pilot Fields:**
- Pilot Name, Employee ID, Role
- Seniority, Contract Type, Age
- Commencement Date

**Certification Fields:**
- Check Type, Check Category
- Issue Date, Expiry Date
- Days Until Expiry, Status

**Leave Fields:**
- Leave Type, Start Date, End Date
- Duration, Leave Status

### Usage Example

1. **Select Fields**: Click or drag fields from the left panel
2. **Configure Fields**: Set sort order and aggregation
3. **Add Filters**: Use the Advanced Filter Builder
4. **Set Grouping**: Choose a grouping field if needed
5. **Save Template**: Give your report a name and save
6. **Run Report**: Generate the report with current data
7. **Export**: Download in your preferred format

### Save and Reuse Templates

```typescript
// Template structure
interface ReportTemplate {
  name: string;
  fields: SelectedField[];
  filters: FilterRule[];
  groupBy?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}
```

---

## Advanced Filtering

### Location
`/components/reports/AdvancedFilterBuilder.tsx`

### Filter Operators

**Text Fields:**
- Equals, Not Equals
- Contains, Starts With, Ends With

**Number Fields:**
- Equals, Not Equals
- Greater Than, Less Than
- Between

**Date Fields:**
- Equals, Before, After
- Between (date range)

**Boolean Fields:**
- Is (true/false)

### Logical Operators

- **AND**: All conditions must be true
- **OR**: At least one condition must be true

### Filter Examples

**Example 1: Find Expiring Certifications**
```
Field: expiry_date
Operator: between
Value: 2025-10-01 to 2025-10-31
```

**Example 2: Captains with High Seniority**
```
Field: role
Operator: equals
Value: Captain
AND
Field: seniority
Operator: greater_than
Value: 10
```

**Example 3: Complex Leave Query**
```
Field: leave_type
Operator: equals
Value: RDO
OR
Field: leave_type
Operator: equals
Value: WDO
AND
Field: status
Operator: equals
Value: Approved
```

---

## Export Functionality

### Location
`/lib/export-advanced.ts`

### Supported Formats

#### 1. **Excel (.xlsx)**
- Formatted spreadsheets
- Multiple sheets support
- Formula support
- Metadata included

```typescript
import { exportReport, formatExportData } from '@/lib/export-advanced';

const data = formatExportData(rows, fields, metadata);
await exportReport(data, {
  format: 'excel',
  filename: 'pilot-report',
  includeCharts: true,
  includeMetadata: true,
});
```

#### 2. **PDF (.pdf)**
- Professional formatting
- Air Niugini branding
- Charts and graphs
- Headers and footers

```typescript
await exportReport(data, {
  format: 'pdf',
  filename: 'compliance-report',
  includeCharts: true,
});
```

#### 3. **CSV (.csv)**
- Simple tabular format
- Excel compatible
- Custom delimiters
- UTF-8 encoding

```typescript
await exportReport(data, {
  format: 'csv',
  filename: 'certification-data',
});
```

#### 4. **JSON (.json)**
- Structured data format
- API integration ready
- Metadata included
- Pretty formatted

```typescript
await exportReport(data, {
  format: 'json',
  filename: 'fleet-data',
  includeMetadata: true,
});
```

### Bulk Export

Export multiple reports at once:

```typescript
import { bulkExport } from '@/lib/export-advanced';

await bulkExport([
  { data: complianceData, options: { format: 'pdf', filename: 'compliance' } },
  { data: pilotData, options: { format: 'excel', filename: 'pilots' } },
  { data: leaveData, options: { format: 'csv', filename: 'leave' } },
]);
```

### Export Options

```typescript
interface ExportOptions {
  format: 'excel' | 'pdf' | 'csv' | 'json';
  filename?: string;
  includeCharts?: boolean;
  includeMetadata?: boolean;
  dateFormat?: string;
}
```

---

## Scheduled Reports

### Location
`/components/reports/ScheduledReports.tsx`

### Features

#### 1. **Schedule Creation**
- Report name and type
- Frequency: Daily, Weekly, Monthly
- Time of day (24-hour format)
- Recipient email list

#### 2. **Report Management**
- Enable/Disable schedules
- Edit schedules
- Delete schedules
- Run immediately (on-demand)

#### 3. **Email Delivery**
- Multiple recipients support
- Automatic attachment generation
- Email notifications
- Delivery confirmation

### Creating a Schedule

1. Click "New Schedule"
2. Enter report details:
   - **Name**: Descriptive name (e.g., "Daily Compliance Report")
   - **Report Type**: Choose from available templates
   - **Frequency**: Daily, Weekly, or Monthly
   - **Time**: When to generate (e.g., 08:00)
   - **Recipients**: Comma-separated email addresses
3. Click "Create Schedule"

### Schedule Example

```typescript
{
  name: 'Daily Compliance Report',
  reportType: 'compliance',
  frequency: 'daily',
  time: '08:00',
  recipients: [
    'fleet.manager@airniugini.com.pg',
    'operations@airniugini.com.pg'
  ],
  enabled: true
}
```

### Best Practices

- **Timing**: Schedule reports during off-peak hours (early morning)
- **Recipients**: Keep distribution lists focused and relevant
- **Frequency**: Match frequency to data change rate
- **Testing**: Use "Run Now" to test before enabling schedule
- **Monitoring**: Check last run times to ensure delivery

---

## Analytics API Routes

### Base URL
`/api/analytics/`

### Available Endpoints

#### 1. **GET /api/analytics/trends**

Retrieve trend data for various metrics.

**Query Parameters:**
- `timeRange`: '1m' | '3m' | '6m' | '12m' | 'ytd' | 'all'
- `metric`: 'compliance' | 'certifications' | 'leave' | 'pilots'

**Response:**
```json
{
  "success": true,
  "data": {
    "timeRange": "12m",
    "metric": "compliance",
    "startDate": "2024-10-01T00:00:00.000Z",
    "endDate": "2025-10-01T00:00:00.000Z",
    "trends": [
      { "month": "Jan 2025", "value": 94.5 },
      { "month": "Feb 2025", "value": 95.2 }
    ]
  }
}
```

#### 2. **GET /api/analytics/forecasts**

Generate predictive forecasts.

**Query Parameters:**
- `metric`: 'certifications' | 'leave' | 'compliance'
- `months`: Number of months to forecast (default: 3)

**Response:**
```json
{
  "success": true,
  "data": {
    "metric": "certifications",
    "forecastPeriod": "3 months",
    "forecast": [
      { "month": "Nov 2025", "predicted": 12, "confidence": 0.87 },
      { "month": "Dec 2025", "predicted": 15, "confidence": 0.85 }
    ],
    "confidence": 0.87
  }
}
```

#### 3. **POST /api/analytics/custom**

Execute custom analytics queries.

**Request Body:**
```json
{
  "metrics": ["total_pilots", "total_certifications", "compliance_rate"],
  "groupBy": "contract_type",
  "filters": [
    {
      "field": "role",
      "operator": "equals",
      "value": "Captain"
    }
  ],
  "dateRange": {
    "start": "2025-01-01",
    "end": "2025-10-01"
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "metrics": {
      "total_pilots": 27,
      "total_certifications": 556,
      "compliance_rate": 94.1
    },
    "groupedData": []
  },
  "generatedAt": "2025-10-01T12:00:00.000Z"
}
```

#### 4. **POST /api/reports/generate**

Generate custom reports.

**Request Body:**
```json
{
  "reportType": "pilots",
  "fields": ["first_name", "last_name", "employee_id", "role"],
  "filters": [
    {
      "field": "role",
      "operator": "equals",
      "value": "Captain",
      "logicalOperator": "AND"
    }
  ],
  "sortBy": "last_name",
  "sortOrder": "asc"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "reportType": "pilots",
    "totalRows": 15,
    "rows": [
      {
        "first_name": "John",
        "last_name": "Smith",
        "employee_id": "P001",
        "role": "Captain"
      }
    ],
    "generatedAt": "2025-10-01T12:00:00.000Z"
  }
}
```

### Error Responses

All endpoints return errors in this format:

```json
{
  "success": false,
  "error": "Error message description"
}
```

**Common HTTP Status Codes:**
- `400`: Bad Request (invalid parameters)
- `401`: Unauthorized (authentication required)
- `403`: Forbidden (insufficient permissions)
- `500`: Internal Server Error

---

## Advanced Chart Components

### HeatmapChart

**Location:** `/components/charts/advanced/HeatmapChart.tsx`

Perfect for visualizing:
- Pilot availability by day/week
- Certification expiry patterns
- Leave utilization patterns

**Usage:**
```tsx
import { HeatmapChart } from '@/components/charts/advanced';

const heatmapData = [
  { x: 'Mon', y: 'Week 1', value: 25 },
  { x: 'Tue', y: 'Week 1', value: 27 },
  // ... more data
];

<HeatmapChart
  data={heatmapData}
  title="Pilot Availability Heatmap"
  description="Weekly availability patterns"
  colorScale={['#FEF3C7', '#E4002B']}
/>
```

### Other Advanced Charts

**RadarChart** (via Recharts):
- Multi-metric comparison
- Performance profiling
- Compliance across categories

**TreemapChart** (requires d3.js):
- Hierarchical data visualization
- Certification distribution
- Resource allocation

**FunnelChart** (custom implementation):
- Conversion tracking
- Workflow visualization
- Process efficiency

---

## Best Practices

### Performance Optimization

#### 1. **Query Optimization**
```typescript
// ✅ Good - Single query with joins
const data = await supabase
  .from('pilots')
  .select(`
    *,
    pilot_checks (
      *,
      check_types (*)
    )
  `)
  .limit(100);

// ❌ Bad - Multiple round trips
const pilots = await supabase.from('pilots').select('*');
for (const pilot of pilots) {
  const checks = await getChecks(pilot.id);
}
```

#### 2. **Caching**
```typescript
// Use cache service for expensive queries
import { getCachedData, setCachedData } from '@/lib/cache-service';

const cacheKey = `analytics-trends-${timeRange}`;
let data = getCachedData(cacheKey);

if (!data) {
  data = await fetchTrendData(timeRange);
  setCachedData(cacheKey, data, 300); // 5 minutes TTL
}
```

#### 3. **Pagination for Large Datasets**
```typescript
// Implement pagination for reports with many rows
const PAGE_SIZE = 100;
const { data, count } = await supabase
  .from('pilot_checks')
  .select('*', { count: 'exact' })
  .range(offset, offset + PAGE_SIZE - 1);
```

### Data Accuracy

#### 1. **Date Handling**
```typescript
// ✅ Correct - Use date-fns for consistency
import { format, parseISO, differenceInDays } from 'date-fns';

const daysUntilExpiry = differenceInDays(
  parseISO(expiryDate),
  new Date()
);

// ❌ Wrong - String comparison
if (expiryDate < todayString) { }
```

#### 2. **Null Handling**
```typescript
// Always handle null/undefined values
const value = data?.fieldName ?? 'N/A';
const count = data?.length || 0;
```

### Security

#### 1. **Input Validation**
```typescript
// Validate all user inputs
if (!reportName || reportName.trim().length === 0) {
  throw new Error('Report name is required');
}

if (!['daily', 'weekly', 'monthly'].includes(frequency)) {
  throw new Error('Invalid frequency');
}
```

#### 2. **SQL Injection Prevention**
```typescript
// ✅ Safe - Parameterized queries
const { data } = await supabase
  .from('pilots')
  .select('*')
  .eq('role', userInput);

// ❌ Dangerous - Never do this
const query = `SELECT * FROM pilots WHERE role = '${userInput}'`;
```

### User Experience

#### 1. **Loading States**
```tsx
if (isLoading) {
  return <LoadingSpinner />;
}

if (error) {
  return <ErrorMessage error={error} />;
}
```

#### 2. **Empty States**
```tsx
if (data.length === 0) {
  return (
    <EmptyState
      title="No data available"
      description="Try adjusting your filters or date range"
      action={<Button onClick={reset}>Reset Filters</Button>}
    />
  );
}
```

#### 3. **Responsive Design**
```tsx
// Use responsive grid layouts
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
  {/* Cards */}
</div>
```

### Air Niugini Branding

Always use official brand colors:

```typescript
// Air Niugini Brand Colors
const COLORS = {
  red: '#E4002B',      // Primary - buttons, headers, alerts
  gold: '#FFC72C',     // Secondary - accents, highlights
  black: '#000000',    // Navigation, text
  white: '#FFFFFF',    // Background
};

// Status Colors (Aviation Standard)
const STATUS_COLORS = {
  current: '#10B981',   // Green - valid/compliant
  expiring: '#F59E0B',  // Amber - warning/attention
  expired: '#EF4444',   // Red - critical/action required
};
```

---

## Troubleshooting

### Common Issues

#### 1. **Charts Not Rendering**

**Problem:** Charts appear blank or show errors

**Solution:**
```typescript
// Ensure Recharts is properly imported
import { LineChart, Line, XAxis, YAxis, Tooltip } from 'recharts';

// Check data format
const data = [
  { name: 'Jan', value: 100 }, // ✅ Correct
  { name: 'Feb', value: '150' }, // ❌ Wrong - should be number
];
```

#### 2. **Export Failing**

**Problem:** Export downloads empty or corrupted files

**Solution:**
```typescript
// Verify data format before export
const exportData = formatExportData(rows, fields, metadata);
console.log('Export data:', exportData);

// Check blob creation
const blob = await exportToExcel(exportData, options);
console.log('Blob size:', blob.size);
```

#### 3. **Slow Performance**

**Problem:** Analytics dashboard loads slowly

**Solution:**
```typescript
// Use React Query for caching
const { data, isLoading } = useQuery(
  ['analytics', timeRange],
  () => fetchAnalytics(timeRange),
  {
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
  }
);

// Implement progressive loading
const [page, setPage] = useState(1);
const pageSize = 50;
```

---

## Support and Resources

### Documentation
- Main project documentation: `CLAUDE.md`
- Technical specification: `SPEC.md`
- Implementation plan: `PLAN.md`

### API Reference
- Supabase Documentation: https://supabase.com/docs
- Recharts Documentation: https://recharts.org/
- TanStack Query: https://tanstack.com/query/

### Contact
For technical support or questions:
- Email: operations@airniugini.com.pg
- Internal Wiki: [Company Intranet]

---

**Air Niugini B767 Pilot Management System**
*Papua New Guinea's National Airline Fleet Operations Management*
Version 1.0 - Advanced Analytics & Custom Report Builder

**Generated:** October 1, 2025
**Status:** Production Ready
