#!/bin/bash

echo "Starting PDF Folder Manager..."
echo ""

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "⚠️  Dependencies not installed. Running setup first..."
    ./setup.sh
    if [ $? -ne 0 ]; then
        exit 1
    fi
    echo ""
fi

# Check if Node.js is available
if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found. Please run ./setup.sh first"
    exit 1
fi

echo "🚀 Starting server..."
echo "📂 PDF directory: $(pwd)/pdfs"
echo "🌐 Server will be available at: http://localhost:3000"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

npm start
