#!/bin/bash
# AGP+ v3.8 - Quick Start Script
# Usage: ./start.sh

echo "🚀 Starting AGP+ v3.8..."
echo ""

# Kill any existing processes on port 3001
echo "📌 Cleaning up port 3001..."
lsof -ti:3001 | xargs kill -9 2>/dev/null || true

# Set up Homebrew PATH (required for npm)
export PATH="/opt/homebrew/bin:$PATH"

# Navigate to project directory
cd "$(dirname "$0")"

# Start Vite dev server
echo "🔥 Starting Vite dev server on port 3001..."
echo ""
npx vite --port 3001
