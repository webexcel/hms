#!/bin/bash
# Build all apps for production (run from project root)
set -e

echo "Building website..."
cd website
npx vite build
cd ..

echo "Building PMS admin..."
cd client
npx vite build
cd ..

echo ""
echo "Build complete!"
echo "  website/dist/ — Public website"
echo "  client/dist/  — PMS admin panel"
echo "  server/       — API (no build needed, runs with Node)"
