#!/bin/bash

# Script to refresh GitHub's cache for the main branch URL
# This fetches the commit-specific URL first, then the main branch URL to trigger cache update

# Get the latest commit hash from remote (after push) or local HEAD
# Try to get from origin/main first (most accurate after push)
LATEST_COMMIT=$(git rev-parse origin/main 2>/dev/null)
if [ -z "$LATEST_COMMIT" ]; then
    # Fall back to local HEAD if remote not available
    LATEST_COMMIT=$(git rev-parse HEAD 2>/dev/null)
fi

if [ -z "$LATEST_COMMIT" ]; then
    echo "Error: Could not get latest commit hash. Make sure you're in a git repository."
    exit 1
fi

# Get short commit hash for display
SHORT_COMMIT=$(git rev-parse --short "$LATEST_COMMIT" 2>/dev/null || echo "$LATEST_COMMIT")

COMMIT_URL="https://raw.githubusercontent.com/moranfru/rtl-ltr/$LATEST_COMMIT/rtl-ltr.js"
MAIN_URL="https://raw.githubusercontent.com/moranfru/rtl-ltr/main/rtl-ltr.js"
JS_DELIVR_URL="https://cdn.jsdelivr.net/gh/moranfru/rtl-ltr/rtl-ltr.js"

echo "Refreshing cache for main branch URL..."
echo "Latest commit (full): $LATEST_COMMIT"
echo "Latest commit (short): $SHORT_COMMIT"
echo ""

# Step 1: Fetch the commit-specific URL first
echo "Step 1: Fetching commit-specific URL..."
echo "URL: $COMMIT_URL"
TIMESTAMP=$(date +%s)
if command -v curl &> /dev/null; then
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$COMMIT_URL?t=$TIMESTAMP" 2>/dev/null)
    echo "Commit URL Status: $HTTP_CODE"
elif command -v wget &> /dev/null; then
    wget -q -O /dev/null "$COMMIT_URL?t=$TIMESTAMP" 2>/dev/null && echo "Commit URL: Fetched successfully" || echo "Commit URL: Request completed"
else
    echo "Warning: Neither curl nor wget found. Please install one to enable cache refresh."
    exit 1
fi

echo ""
echo "Step 2: Fetching main branch URL (should now serve latest commit)..."
echo "URL: $MAIN_URL"

# Step 2: Fetch the main branch URL (should now serve latest commit)
if command -v curl &> /dev/null; then
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$MAIN_URL?t=$TIMESTAMP" 2>/dev/null)
    echo "Main URL Status: $HTTP_CODE"
elif command -v wget &> /dev/null; then
    wget -q -O /dev/null "$MAIN_URL?t=$TIMESTAMP" 2>/dev/null && echo "Main URL: Fetched successfully" || echo "Main URL: Request completed"
fi

echo ""
echo "Step 3: Fetching jsDelivr URL..."
echo "URL: $JS_DELIVR_URL"
if command -v curl &> /dev/null; then
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$JS_DELIVR_URL?t=$TIMESTAMP" 2>/dev/null)
    echo "jsDelivr Status: $HTTP_CODE"
elif command -v wget &> /dev/null; then
    wget -q -O /dev/null "$JS_DELIVR_URL?t=$TIMESTAMP" 2>/dev/null && echo "jsDelivr: Fetched successfully" || echo "jsDelivr: Request completed"
fi

echo ""
echo "Cache refresh complete. The main branch URL should now serve the latest commit."

