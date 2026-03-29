#!/bin/bash
# Development server for defi-orderflow-analytics (Vite)

echo "🚀 Starting defi-orderflow-analytics development server..."
echo "🎨 Framework: Vite + TypeScript"
echo "📱 UI will be available at: http://localhost:5173"
echo ""

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Start development server
echo "🌟 Starting Vite dev server..."
npm run dev
