#!/bin/bash

# Set Vercel environment variables for production deployment
# This script sets the required environment variables in Vercel
# Run this script to fix the missing SUPABASE_SERVICE_ROLE_KEY issue

echo "🚀 Setting Vercel environment variables for Air Niugini PMS..."

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI not found. Install it with: npm install -g vercel"
    exit 1
fi

# Set environment variables for production
echo "📝 Setting SUPABASE_SERVICE_ROLE_KEY..."
vercel env add SUPABASE_SERVICE_ROLE_KEY production <<< "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndnZG1ndm9ucXlzZmx3ZGlpb2xzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTU4MjMyMCwiZXhwIjoyMDcxMTU4MzIwfQ.byfbMS__aOJzhhty54h7ap3XK19f9-3Wu7S-ZWWV2Cg"

echo "📝 Setting NEXT_PUBLIC_SUPABASE_URL..."
vercel env add NEXT_PUBLIC_SUPABASE_URL production <<< "https://wgdmgvonqysflwdiiols.supabase.co"

echo "📝 Setting NEXT_PUBLIC_SUPABASE_ANON_KEY..."
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production <<< "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndnZG1ndm9ucXlzZmx3ZGlpb2xzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU1ODIzMjAsImV4cCI6MjA3MTE1ODMyMH0.MJrbK8qtJLJXz_mSHF9Le_DebGCXfZ4eXFd7h5JCKyk"

echo "📝 Setting SUPABASE_PROJECT_ID..."
vercel env add SUPABASE_PROJECT_ID production <<< "wgdmgvonqysflwdiiols"

echo "📝 Setting NEXT_PUBLIC_APP_NAME..."
vercel env add NEXT_PUBLIC_APP_NAME production <<< "Air Niugini Pilot Management System"

echo "📝 Setting NEXT_PUBLIC_CURRENT_ROSTER..."
vercel env add NEXT_PUBLIC_CURRENT_ROSTER production <<< "RP11/2025"

echo "📝 Setting NEXT_PUBLIC_ROSTER_END_DATE..."
vercel env add NEXT_PUBLIC_ROSTER_END_DATE production <<< "2025-10-10"

echo "📝 Setting NEXT_PUBLIC_APP_URL..."
vercel env add NEXT_PUBLIC_APP_URL production <<< "https://air-niugini-pms.vercel.app"

echo "✅ Environment variables set successfully!"
echo "🔄 Triggering a new deployment to apply changes..."

# Trigger a new deployment
vercel --prod

echo "🎉 Deployment complete! PDF functionality should now work."
echo "📋 To verify, visit: https://air-niugini-pms.vercel.app/dashboard/certifications/expiry-planning"