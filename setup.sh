#!/bin/bash

echo "========================================="
echo "PDF Folder Manager - Setup Script"
echo "========================================="
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed!"
    echo ""
    echo "Please install Node.js first:"
    echo "  Option 1 (Recommended): Install nvm and Node.js"
    echo "    curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash"
    echo "    source ~/.bashrc  # or ~/.zshrc"
    echo "    nvm install 22"
    echo ""
    echo "  Option 2: Download from https://nodejs.org"
    echo ""
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
echo "✓ Node.js detected: $(node -v)"

if [ "$NODE_VERSION" -lt 18 ]; then
    echo "⚠️  Warning: Node.js version is older than recommended (v18+)"
    echo "   The app may not work correctly. Consider upgrading."
    echo ""
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed!"
    exit 1
fi

echo "✓ npm detected: $(npm -v)"
echo ""

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
    if [ $? -ne 0 ]; then
        echo "❌ Failed to install dependencies"
        exit 1
    fi
    echo "✓ Dependencies installed successfully"
else
    echo "✓ node_modules found"
    echo ""
    read -p "Reinstall dependencies? (recommended on new Mac) [y/N]: " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "📦 Reinstalling dependencies..."
        rm -rf node_modules
        npm install
        if [ $? -ne 0 ]; then
            echo "❌ Failed to install dependencies"
            exit 1
        fi
        echo "✓ Dependencies reinstalled successfully"
    fi
fi

echo ""
echo "========================================="
echo "✓ Setup complete!"
echo "========================================="
echo ""
echo "To start the server, run:"
echo "  npm start"
echo ""
echo "Or use the quick start script:"
echo "  ./start.sh"
echo ""
echo "The app will be available at: http://localhost:3000"
echo ""
