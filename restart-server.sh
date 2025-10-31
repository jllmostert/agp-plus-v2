#!/bin/bash
# Quick server restart for AGP+

echo "Killing port 3001..."
lsof -ti:3001 | xargs kill -9 2>/dev/null

echo "Starting Vite server..."
cd /Users/jomostert/Documents/Projects/agp-plus
export PATH="/opt/homebrew/bin:\$PATH"
npx vite --port 3001
