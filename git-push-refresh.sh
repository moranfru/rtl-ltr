#!/bin/bash

# Wrapper script for git push that automatically refreshes the main branch URL cache
# Usage: ./git-push-refresh.sh [git push arguments]

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Change to the script directory
cd "$SCRIPT_DIR"

# Execute git push with all passed arguments
echo "Pushing to remote..."
if git push "$@"; then
    echo ""
    echo "Push successful! Updating remote refs..."
    # Fetch remote refs to ensure origin/main is up to date
    git fetch origin 2>/dev/null || true
    echo ""
    echo "Refreshing cache..."
    # Run the refresh script (will use the latest commit from origin/main)
    "$SCRIPT_DIR/refresh-main-url.sh"
else
    echo "Push failed. Skipping cache refresh."
    exit 1
fi

