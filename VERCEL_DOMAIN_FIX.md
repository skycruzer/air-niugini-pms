# Vercel Domain Fix - Remove vercel.com from Download Alerts

## Problem

Safari (and other browsers) show download permission dialogs that include both:

- `vercel.com` (Vercel deployment platform)
- `www.pxb767office.app` (your custom domain)

This creates a confusing user experience and raises security concerns.

## Solution

We've implemented a comprehensive fix with three key components:

### 1. ✅ Created `vercel.json` Configuration

**File**: `vercel.json`

This configuration ensures:

- **Automatic Redirects**: All Vercel default URLs (`*.vercel.app`) redirect to your custom domain
- **Permanent Redirect (308)**: Search engines and browsers remember the redirect
- **Custom Domain Only**: Only `www.pxb767office.app` will appear in browser dialogs
- **Proper CORS Headers**: API requests are scoped to your custom domain
- **Security Headers**: Enhanced security headers for all routes

**Key Configuration**:

```json
{
  "redirects": [
    {
      "source": "/:path*",
      "has": [
        {
          "type": "host",
          "value": "(?!www\\.pxb767office\\.app$).*\\.vercel\\.app"
        }
      ],
      "destination": "https://www.pxb767office.app/:path*",
      "permanent": true,
      "statusCode": 308
    }
  ]
}
```

### 2. ✅ Updated Environment Variables

**File**: `.env.vercel-production-clean`

Changed:

- **Before**: `NEXT_PUBLIC_APP_URL=https://air-niugini-pms.vercel.app`
- **After**: `NEXT_PUBLIC_APP_URL=https://www.pxb767office.app`

This ensures all download operations and API calls use your custom domain.

### 3. 🔄 Deployment Steps (Required)

To fully apply these changes, you must:

#### Step 1: Update Vercel Environment Variables

1. Go to your Vercel dashboard: https://vercel.com
2. Navigate to your project: `air-niugini-pms`
3. Go to **Settings** → **Environment Variables**
4. Update `NEXT_PUBLIC_APP_URL`:
   - **Remove**: `https://air-niugini-pms.vercel.app`
   - **Add**: `https://www.pxb767office.app`
5. Select **Production** environment
6. Click **Save**

#### Step 2: Redeploy the Application

**Option A: Deploy via Git (Recommended)**

```bash
# From your project directory
git add vercel.json .env.vercel-production-clean
git commit -m "Fix: Remove vercel.com from download alerts

- Add vercel.json with custom domain redirects
- Update NEXT_PUBLIC_APP_URL to use custom domain
- Configure permanent 308 redirects from *.vercel.app
- Add proper CORS headers for API routes"

git push origin main
```

Vercel will automatically deploy the changes.

**Option B: Deploy via Vercel CLI**

```bash
# From your project directory
cd "/Users/skycruzer/Desktop/Fleet Office Management/air-niugini-pms"
vercel --prod
```

**Option C: Manual Redeploy**

1. Go to Vercel dashboard
2. Navigate to **Deployments**
3. Click **Redeploy** on the latest deployment
4. Select **Use existing Build Cache: No**
5. Click **Redeploy**

#### Step 3: Verify the Fix

After deployment, test the fix:

1. **Clear Browser Cache** (Important!)
   - Safari: `⌘ + Option + E` (Clear Cache)
   - Or use Private Browsing mode

2. **Visit Your Site**
   - Go to: https://www.pxb767office.app
   - **Do NOT** use: https://air-niugini-pms.vercel.app

3. **Test Download**
   - Navigate to any page with downloads (Reports, Pilots Export, etc.)
   - Click download button
   - **Expected**: Safari dialog should ONLY show `www.pxb767office.app`
   - **No longer shows**: `vercel.com`

4. **Test Redirect**
   - Try visiting: https://air-niugini-pms.vercel.app
   - **Expected**: Automatically redirects to https://www.pxb767office.app
   - Browser address bar updates to custom domain

## How It Works

### Before Fix

```
User → https://air-niugini-pms.vercel.app/dashboard/reports
       ↓
       Download triggered from vercel.com domain
       ↓
       Safari: "Allow downloads from vercel.com and www.pxb767office.app?"
```

### After Fix

```
User → https://air-niugini-pms.vercel.app/dashboard/reports
       ↓ (Automatic 308 Redirect)
       https://www.pxb767office.app/dashboard/reports
       ↓
       All downloads come from custom domain
       ↓
       Safari: "Allow downloads from www.pxb767office.app?"
```

## Technical Details

### vercel.json Configuration

1. **Redirects Section**
   - Matches any `*.vercel.app` domain (except your custom domain)
   - Uses regex to exclude `www.pxb767office.app`
   - 308 Permanent Redirect (preserves HTTP method)
   - Applied to ALL routes (`/:path*`)

2. **Headers Section**
   - API routes: CORS headers scoped to custom domain
   - All routes: Security headers (X-Frame-Options, etc.)
   - Cache-Control for API routes

3. **Environment Variables**
   - `NEXT_PUBLIC_APP_URL`: Used by Next.js for canonical URL
   - Ensures all generated URLs use custom domain

### Environment Variable Update

The `NEXT_PUBLIC_APP_URL` variable is used throughout the application:

- File download blob URLs
- PDF generation endpoints
- API route absolute URLs
- Canonical links and metadata

By setting this to your custom domain, all operations reference `www.pxb767office.app` instead of Vercel's domain.

## Troubleshooting

### Issue: Still Seeing vercel.com in Dialog

**Solution**:

1. Clear browser cache completely
2. Use Private/Incognito mode for testing
3. Verify environment variable is updated in Vercel dashboard
4. Check deployment logs for successful redirect configuration

### Issue: Downloads Not Working

**Solution**:

1. Check browser console for CORS errors
2. Verify `vercel.json` was deployed (check deployment files)
3. Ensure all environment variables are set in Production environment

### Issue: Redirect Loop

**Solution**:

1. Verify regex in `vercel.json` excludes your custom domain
2. Check custom domain DNS settings in Vercel
3. Ensure domain is properly configured in Vercel project settings

## Files Changed

- ✅ `vercel.json` (created)
- ✅ `.env.vercel-production-clean` (updated)

## Next Steps

1. **Update Vercel Environment Variables** (Required)
2. **Redeploy Application** (Required)
3. **Test Downloads** (Verification)
4. **Monitor** for any issues

## Additional Resources

- [Vercel Redirects Documentation](https://vercel.com/docs/edge-network/redirects)
- [Next.js Environment Variables](https://nextjs.org/docs/app/building-your-application/configuring/environment-variables)
- [Custom Domain Setup](https://vercel.com/docs/projects/domains)

---

**Air Niugini B767 Pilot Management System**
_Production Deployment Configuration_
_Version 1.0 - Updated 2025-10-06_
