#!/bin/bash

# Wrapper script for git push
# Usage: ./git-push-refresh.sh [git push arguments]

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Change to the script directory
cd "$SCRIPT_DIR"

# Execute git push with all passed arguments
git push "$@"

