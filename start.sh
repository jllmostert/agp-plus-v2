#!/bin/bash
# AGP+ v3.6.0 - Quick Start Script
# Usage: ./start.sh

echo "🚀 Starting AGP+ v3.6.0..."
echo ""

# Kill any existing processes on port 3001
echo "📌 Cleaning up port 3001..."
lsof -ti:3001 | xargs kill -9 2>/dev/null || true
sleep 1

# Set up Homebrew PATH (required for npm)
export PATH="/opt/homebrew/bin:$PATH"

# Navigate to project directory
cd "$(dirname "$0")"

echo "✅ Port 3001 cleared"
echo ""

# Start Vite dev server in background
echo "🔥 Starting Vite dev server on port 3001..."
npx vite --port 3001 &

# Wait for server to be ready (max 10 seconds)
echo "⏳ Waiting for server to start..."
for i in {1..20}; do
    if curl -s http://localhost:3001 > /dev/null 2>&1; then
        echo "✅ Server is ready!"
        break
    fi
    sleep 0.5
done

# Open Chrome
echo "🌐 Opening Chrome..."
open -a "Google Chrome" http://localhost:3001

echo ""
echo "✅ AGP+ is running!"
echo "📍 URL: http://localhost:3001"
echo "🛑 Stop server: Press Ctrl+C"
echo ""

# Keep script running (shows Vite output)
wait
