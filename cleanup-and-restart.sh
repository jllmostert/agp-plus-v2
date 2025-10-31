#!/bin/bash
# Kill all Vite processes on ports 3001-3004

echo "Killing processes on ports 3001-3004..."

for port in 3001 3002 3003 3004; do
  pid=$(lsof -ti:$port 2>/dev/null)
  if [ -n "$pid" ]; then
    echo "Killing process $pid on port $port"
    kill -9 $pid 2>/dev/null
  fi
done

echo "Done! All ports cleared."
echo ""
echo "Starting Vite on port 3001..."
cd /Users/jomostert/Documents/Projects/agp-plus
export PATH="/opt/homebrew/bin:$PATH"
npx vite --port 3001
