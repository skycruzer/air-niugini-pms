# Advanced Analytics Quick Start Guide

**Air Niugini B767 Pilot Management System**
**Phase 6.3 - Advanced Analytics & Custom Report Builder**

---

## Quick Access

### Dashboard URLs
```
Main Dashboard:     /dashboard
Advanced Analytics: /dashboard/analytics/advanced
Report Builder:     (Available from Analytics page)
```

### Login Credentials (Development)
```
Email: skycruzer@icloud.com
Password: mron2393
```

---

## 5-Minute Quick Start

### 1. Access Advanced Analytics (1 minute)

1. Log in to the system
2. Navigate to **Dashboard** → **Analytics** → **Advanced**
3. You'll see 5 tabs:
   - **Trends**: Historical and forecast data
   - **Compliance**: Fleet compliance metrics
   - **Pilots**: Pilot performance analytics
   - **Certifications**: Certification tracking
   - **Leave**: Leave utilization patterns

### 2. View Trends (1 minute)

1. Click the **Trends** tab
2. Select time range (top right): `12m` for last 12 months
3. View compliance trend chart
4. See forecast predictions (yellow dashed line)
5. Check key insights panel at bottom

**What you'll see:**
- Compliance rate over time
- Trend direction (up/down)
- Forecast confidence (87%)
- Key insights and patterns

### 3. Check Compliance (1 minute)

1. Click the **Compliance** tab
2. See overall compliance gauge (target: >90%)
3. View category breakdown:
   - Medical: 100% ✅
   - Security: 100% ✅
   - License: 98% ✅
   - All others: >89%
4. Check risk indicators at bottom

**Actionable Items:**
- Green alerts: Low risk areas
- Amber alerts: Attention needed
- Red alerts: Immediate action required

### 4. Generate Custom Report (2 minutes)

1. Scroll down or navigate to Report Builder section
2. **Select Fields** from left panel:
   - Click "Pilot" tab
   - Click "Pilot Name" to add
   - Click "Employee ID" to add
   - Click "Certification" tab
   - Click "Status" to add
3. **Add Filter** (optional):
   - Click "Add Filter"
   - Select field: "Status"
   - Select operator: "Equals"
   - Enter value: "Current"
4. **Run Report**:
   - Enter report name: "Current Pilots"
   - Click "Run Report"
5. **Export**:
   - Click "Export" dropdown
   - Choose format: PDF, Excel, CSV, or JSON

---

## Common Tasks

### Task 1: Find Expiring Certifications

**Steps:**
1. Go to **Certifications** tab
2. View "Expiry Forecast" chart
3. See predicted expirations for next 6 months
4. Click "Export" to download list

**Expected Result:**
- Chart showing expiration timeline
- Numbers for each month
- Historical comparison

### Task 2: Check Pilot Performance

**Steps:**
1. Go to **Pilots** tab
2. View "Performance Matrix" scatter plot
3. Green dots = high performers (>95% compliance)
4. Yellow dots = moderate (90-95%)
5. Red dots = attention needed (<90%)

**Action Items:**
- Identify pilots needing support
- Review top performers
- Plan training activities

### Task 3: Analyze Leave Patterns

**Steps:**
1. Go to **Leave** tab
2. View "Leave Type Distribution" pie chart
3. Check "Approval Rate Trend" line chart
4. Review "Utilization by Pilot" bar chart

**Insights:**
- RDO most common (60%)
- Approval rate ~93%
- Average utilization 68%

### Task 4: Schedule Automated Report

**Steps:**
1. Navigate to **Scheduled Reports** (from main menu)
2. Click "New Schedule"
3. Fill form:
   ```
   Report Name: Daily Compliance Update
   Report Type: Compliance
   Frequency: Daily
   Time: 08:00
   Recipients: your.email@airniugini.com.pg
   ```
4. Click "Create Schedule"
5. Toggle "Active" if needed

**Result:**
- Report automatically generated daily at 8 AM
- Sent to specified email addresses
- Can run immediately with "Run Now" button

---

## Keyboard Shortcuts

```
Ctrl/Cmd + R    Refresh analytics data
Ctrl/Cmd + E    Export current view
Ctrl/Cmd + S    Save report template
Tab             Navigate between fields
Enter           Run report / Submit form
Esc             Close modal / Cancel action
```

---

## Tips & Tricks

### Performance Tips

1. **Use Time Ranges Wisely**
   - Use shorter ranges (1m, 3m) for faster loading
   - Use longer ranges (12m, all) for trend analysis

2. **Export Large Reports**
   - Use CSV for large datasets (faster)
   - Use Excel for formatted reports
   - Use PDF for presentation-ready documents

3. **Schedule Heavy Reports**
   - Run complex reports during off-peak hours
   - Schedule nightly for next-day delivery

### Data Accuracy

1. **Refresh Data Regularly**
   - Click refresh button (top right)
   - Data updates every 5 minutes automatically

2. **Verify Filters**
   - Check filter expressions before running
   - Use "AND" for restrictive queries
   - Use "OR" for inclusive queries

3. **Check Date Ranges**
   - Ensure date ranges are logical
   - Use "Between" for specific periods

### Best Practices

1. **Save Report Templates**
   - Create reusable templates for common reports
   - Name templates descriptively
   - Share templates with team

2. **Use Appropriate Charts**
   - Trends: Use line/area charts
   - Comparisons: Use bar charts
   - Distributions: Use pie charts
   - Correlations: Use scatter plots

3. **Export Regularly**
   - Keep historical snapshots
   - Archive monthly reports
   - Track changes over time

---

## Troubleshooting

### Issue: Charts Not Showing

**Solution:**
```
1. Refresh page (Ctrl/Cmd + R)
2. Clear browser cache
3. Check internet connection
4. Try different time range
```

### Issue: Export Taking Too Long

**Solution:**
```
1. Reduce dataset size with filters
2. Export smaller time ranges
3. Use CSV instead of PDF/Excel
4. Schedule export for off-peak hours
```

### Issue: Report Shows No Data

**Solution:**
```
1. Check filter criteria (too restrictive?)
2. Verify date range includes data
3. Confirm data exists in database
4. Try "All Time" time range
5. Remove all filters and retry
```

### Issue: Scheduled Report Not Delivered

**Solution:**
```
1. Check schedule is "Active" (toggle)
2. Verify recipient email addresses
3. Check last run time
4. Test with "Run Now" button
5. Check spam/junk folder
```

---

## API Usage (For Developers)

### Get Trend Data

```bash
curl http://localhost:3000/api/analytics/trends?timeRange=12m&metric=compliance
```

### Generate Forecast

```bash
curl http://localhost:3000/api/analytics/forecasts?metric=certifications&months=3
```

### Custom Analytics

```bash
curl -X POST http://localhost:3000/api/analytics/custom \
  -H "Content-Type: application/json" \
  -d '{
    "metrics": ["total_pilots", "compliance_rate"],
    "groupBy": "contract_type"
  }'
```

### Generate Report

```bash
curl -X POST http://localhost:3000/api/reports/generate \
  -H "Content-Type: application/json" \
  -d '{
    "reportType": "pilots",
    "fields": ["first_name", "last_name", "role"],
    "sortBy": "last_name"
  }'
```

---

## Support

### Documentation
- Full Guide: `ANALYTICS_GUIDE.md`
- Implementation: `PHASE_6.3_IMPLEMENTATION_SUMMARY.md`
- Main Docs: `CLAUDE.md`

### Common Questions

**Q: How often is data updated?**
A: Real-time for user actions, 5-minute cache for analytics

**Q: Can I schedule reports to multiple recipients?**
A: Yes, enter comma-separated email addresses

**Q: What export formats are supported?**
A: PDF, Excel (.xlsx), CSV, and JSON

**Q: Can I customize the analytics dashboard?**
A: Yes, use time ranges and tabs to customize view

**Q: How long are reports stored?**
A: Exported reports are downloaded immediately, not stored

**Q: Can I share report templates?**
A: Yes, save templates and they're available to all users

---

## Quick Reference Card

```
┌─────────────────────────────────────────────────────┐
│  ADVANCED ANALYTICS QUICK REFERENCE                 │
├─────────────────────────────────────────────────────┤
│                                                      │
│  ACCESS                                              │
│  /dashboard/analytics/advanced                       │
│                                                      │
│  TIME RANGES                                         │
│  1m | 3m | 6m | 12m | ytd | all                     │
│                                                      │
│  TABS                                                │
│  Trends | Compliance | Pilots | Certs | Leave       │
│                                                      │
│  EXPORT FORMATS                                      │
│  PDF | Excel | CSV | JSON                            │
│                                                      │
│  SCHEDULE FREQUENCIES                                │
│  Daily | Weekly | Monthly                            │
│                                                      │
│  FILTER OPERATORS                                    │
│  Text: equals, contains, starts/ends with            │
│  Number: =, ≠, >, <, between                         │
│  Date: equals, before, after, between                │
│                                                      │
│  LOGICAL OPERATORS                                   │
│  AND (all must be true)                              │
│  OR (any can be true)                                │
│                                                      │
│  KEY METRICS                                         │
│  Compliance Rate: 94.8%                              │
│  Total Pilots: 27                                    │
│  Total Certifications: 556                           │
│  Leave Utilization: 68%                              │
│                                                      │
└─────────────────────────────────────────────────────┘
```

---

## Next Steps

### For Administrators
1. Set up 3-5 scheduled reports for daily operations
2. Create report templates for common requests
3. Configure email distribution lists
4. Train team on report builder

### For Managers
1. Review daily compliance reports
2. Monitor pilot performance metrics
3. Track certification expiry forecasts
4. Analyze leave utilization patterns

### For Pilots
1. View personal certification status
2. Check upcoming renewals
3. Review leave balances
4. Access training schedules

---

## Updates & Changelog

### Version 1.0 (October 1, 2025)
- ✅ Initial release
- ✅ 5 analytics views
- ✅ Custom report builder
- ✅ Advanced filtering
- ✅ Multiple export formats
- ✅ Scheduled reports
- ✅ API routes
- ✅ Complete documentation

### Coming Soon (Phase 6.4)
- TreeMap and Sankey charts
- Machine learning forecasts
- Mobile app
- Real-time collaboration
- Advanced integrations

---

**Ready to Start?**

1. Navigate to `/dashboard/analytics/advanced`
2. Click around and explore
3. Try generating a simple report
4. Export your first chart
5. Schedule a daily report

**Need Help?**
- Read full guide: `ANALYTICS_GUIDE.md`
- Contact support: operations@airniugini.com.pg

---

**Air Niugini B767 Pilot Management System**
*Advanced Analytics & Custom Report Builder*
**Version 1.0 - Production Ready**
