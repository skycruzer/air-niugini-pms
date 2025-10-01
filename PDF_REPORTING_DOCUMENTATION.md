# Air Niugini B767 PDF Reporting System

## Overview

The Air Niugini B767 Pilot Management System now includes a comprehensive PDF reporting system that generates professional, branded reports for fleet operations, compliance tracking, and regulatory documentation.

## Features

### 🎨 Professional Branding

- **Air Niugini Brand Colors**: Primary red (#E4002B) and gold (#FFC72C)
- **Consistent Typography**: Professional Helvetica font family
- **Corporate Headers**: Air Niugini branding with B767 fleet designation
- **Professional Layout**: Clean, structured design suitable for regulatory compliance

### 📊 Report Types

#### 1. Fleet Compliance Report

- **Purpose**: Overall certification status and compliance rates
- **Content**:
  - Fleet overview statistics
  - Certification expiration timeline
  - Compliance by category
  - Individual pilot compliance status
  - Critical alerts and recommendations
- **Pages**: 3 pages with comprehensive analysis

#### 2. Risk Assessment Report

- **Purpose**: Critical and high-risk pilot certification analysis
- **Content**:
  - Risk overview metrics
  - Critical/high-risk pilots identification
  - Expired certifications by severity
  - Immediate action items
- **Pages**: 1 page focused on urgent issues

#### 3. Pilot Summary Report

- **Purpose**: Complete pilot roster with certification overview
- **Content**:
  - Fleet pilot statistics
  - Complete pilot roster table
  - Compliance distribution
  - Non-compliant pilot alerts
- **Pages**: 1 page with comprehensive roster data

#### 4. Individual Pilot Report

- **Purpose**: Detailed individual pilot certification record
- **Content**:
  - Personal and service information
  - Certification overview and history
  - Captain qualifications (if applicable)
  - Leave history and performance metrics
  - Detailed certification breakdown by category
- **Pages**: 2-3 pages per pilot

#### 5. Fleet Management Report

- **Purpose**: Comprehensive fleet analysis and strategic planning
- **Content**:
  - Fleet roster analysis
  - Captain qualifications matrix
  - Leave analysis and operational readiness
  - Succession planning and upcoming retirements
  - Strategic recommendations
- **Pages**: 4 pages with detailed analysis

#### 6. Operational Readiness Report

- **Purpose**: Current operational capacity assessment
- **Content**:
  - Current operational status
  - Crew requirements vs. availability
  - Critical alerts and mitigation actions
- **Pages**: 1 page operational snapshot

## Technical Implementation

### Architecture

```
/src/lib/
├── pdf-components.tsx          # Reusable PDF components with Air Niugini branding
├── pdf-compliance-report.tsx   # Compliance and risk assessment reports
├── pdf-pilot-report.tsx        # Individual and summary pilot reports
├── pdf-fleet-management.tsx    # Fleet management and operational reports
├── pdf-data-service.ts         # Data fetching and structuring service
└── pdf-validation.ts           # Zod validation schemas

/src/types/
└── pdf-reports.ts              # TypeScript type definitions

/src/app/api/reports/pdf/
└── route.ts                    # PDF generation API endpoint
```

### Key Technologies

- **@react-pdf/renderer**: PDF generation library
- **Supabase**: Live data integration
- **Zod**: Input validation and type safety
- **TypeScript**: Full type safety
- **Date-fns**: Date calculations and formatting

### API Endpoint

**POST** `/api/reports/pdf`

**Request Body:**

```json
{
  "reportType": "fleet-compliance" | "risk-assessment" | "pilot-summary" | "pilot-individual" | "fleet-management" | "operational-readiness",
  "pilotId": "uuid-string", // Required for pilot-individual reports
  "generatedBy": "string",  // Required: User or system name
  "options": {              // Optional
    "includeCharts": boolean,
    "includeDetails": boolean,
    "filterByRole": "Captain" | "First Officer" | "all",
    "dateRange": {
      "from": "ISO-date-string",
      "to": "ISO-date-string"
    }
  }
}
```

**Response:**

- **Success**: PDF file download with proper headers
- **Error**: JSON error response with details

### Data Flow

1. **Request Validation**: Zod schemas validate all input parameters
2. **Data Service**: Fetches live data from Supabase with proper joins
3. **Data Processing**: Calculates metrics, compliance rates, and risk levels
4. **PDF Generation**: React PDF components render branded documents
5. **Response**: Streams PDF with appropriate headers for download

## Usage

### Frontend Integration

The reports page includes both traditional report generation and direct PDF export:

```typescript
// Generate PDF for specific report type
const downloadPDF = async (reportType: string, pilotId?: string) => {
  const response = await fetch('/api/reports/pdf', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      reportType,
      pilotId,
      generatedBy: 'Air Niugini User',
    }),
  });

  if (response.ok) {
    // Handle PDF download
    const blob = await response.blob();
    // Create download link...
  }
};
```

### Report Selection

The system provides two ways to generate reports:

1. **Quick PDF Export**: Direct PDF generation without web preview
2. **Traditional Flow**: Generate web report first, then export to PDF

### Professional PDF Features

- **Automatic Pagination**: Multi-page reports with page numbers
- **Dynamic Headers**: Report-specific titles and metadata
- **Status Color Coding**:
  - 🟢 Current/Compliant (Green)
  - 🟡 Expiring/At Risk (Yellow/Orange)
  - 🔴 Expired/Critical (Red)
- **Data Tables**: Professional formatting with alternating rows
- **Alert Boxes**: Critical, warning, and info alerts
- **Bullet Lists**: Structured recommendations and action items
- **Summary Statistics**: Key metrics in card layouts

## Data Sources

### Live Database Integration

- **Pilots Table**: Complete pilot roster with service information
- **Pilot Checks**: All certification records with expiry dates
- **Check Types**: Certification categories and descriptions
- **Leave Requests**: Leave history and roster impact
- **Settings**: System configuration and requirements

### Calculated Metrics

- **Compliance Rates**: Real-time calculation from live data
- **Risk Levels**: Based on expired/expiring certification counts
- **Seniority Rankings**: Calculated from commencement dates
- **Age/Retirement**: Calculated from birth dates
- **Service Years**: Calculated from commencement dates

## Security & Validation

### Input Validation

- **Zod Schemas**: Comprehensive validation for all inputs
- **UUID Validation**: Pilot IDs must be valid UUIDs
- **Report Type Validation**: Only supported report types allowed
- **XSS Prevention**: All user inputs sanitized

### Data Security

- **Supabase RLS**: Row Level Security enforced
- **Admin Access**: Service role for PDF generation
- **Error Handling**: Sensitive information not exposed in errors
- **Confidential Headers**: PDF marked as confidential Air Niugini data

## Error Handling

### Validation Errors (400)

- Invalid report type
- Invalid pilot ID format
- Missing required fields
- Invalid date ranges

### Not Found Errors (404)

- Pilot not found for individual reports
- No data available for report generation

### Server Errors (500)

- Database connection issues
- PDF generation failures
- Supabase service errors

### Error Response Format

```json
{
  "success": false,
  "error": "Human-readable error message"
}
```

## Performance Considerations

### Optimization Strategies

- **Selective Data Fetching**: Only required fields retrieved
- **Parallel Queries**: Multiple data sources fetched simultaneously
- **Streaming Response**: PDF streamed directly to client
- **Memory Management**: Efficient PDF buffer handling

### Typical Performance

- **Small Reports** (1-2 pages): 1-3 seconds
- **Large Reports** (3-4 pages): 3-5 seconds
- **Individual Pilots**: 2-4 seconds
- **Fleet-wide Reports**: 4-8 seconds

## Testing

### Test Script

Run the included test script to verify functionality:

```bash
cd /path/to/project
export SUPABASE_SERVICE_ROLE_KEY="your-service-key"
node test-pdf-generation.js
```

### Test Coverage

- ✅ Database connectivity
- ✅ Data availability
- ✅ PDF generation for all report types
- ✅ Individual pilot reports
- ✅ Input validation
- ✅ Error handling
- ✅ File download functionality

## Maintenance

### Regular Tasks

1. **Monitor PDF Generation Logs**: Check for errors or performance issues
2. **Update Brand Assets**: Ensure Air Niugini branding stays current
3. **Review Report Content**: Ensure reports meet regulatory requirements
4. **Performance Monitoring**: Track generation times and optimize as needed

### Future Enhancements

- **Report Scheduling**: Automated report generation and distribution
- **Email Integration**: Direct email delivery of reports
- **Custom Filters**: Advanced filtering options for reports
- **Chart Integration**: Visual charts within PDF reports
- **Signature Fields**: Digital signature capabilities for official documents

## Troubleshooting

### Common Issues

**PDF Generation Fails**

- Check Supabase connection and service key
- Verify pilot ID exists for individual reports
- Check server logs for specific errors

**Missing Data in Reports**

- Verify database has required data (pilots, certifications, check types)
- Check Row Level Security policies
- Ensure service role has proper permissions

**Validation Errors**

- Check request format matches API specification
- Ensure UUIDs are properly formatted
- Verify required fields are provided

**Performance Issues**

- Monitor database query performance
- Check server resources during generation
- Consider caching for frequently requested reports

## Support

For technical support or questions about the PDF reporting system:

1. **Check Logs**: Review console and server logs for error details
2. **Run Tests**: Use the test script to verify system functionality
3. **Documentation**: Refer to this documentation and code comments
4. **Database**: Verify data integrity and RLS policies

---

**Air Niugini B767 Pilot Management System**
_Professional Fleet Operations Management_
