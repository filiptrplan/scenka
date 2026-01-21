#!/bin/bash
set -e

echo "=== Consolidating API Usage Tables ==="

# Step 1: Create new table
echo "Step 1: Creating api_usage table..."
npx supabase db push

# Step 2: Migrate data (if running migrations manually)
# npx supabase db push --include-tags api-usage-migration

# Step 3: Deploy Edge Functions
echo "Step 2: Deploying Edge Functions..."
npx supabase functions deploy openrouter-tag-extract
npx supabase functions deploy openrouter-coach
npx supabase functions deploy openrouter-chat

# Step 4: Regenerate TypeScript types
echo "Step 3: Regenerating TypeScript types..."
npx supabase gen types typescript --linked > src/types/index.ts

echo "=== Deployment Complete ==="
echo "Verify that Edge Functions are writing to api_usage table before dropping old tables"
echo "Then run: npx supabase db push"
