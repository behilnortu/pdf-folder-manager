# Setup Instructions for New Mac

## Quick Start

After copying the "Claude Code" folder to your external drive and connecting it to a new Mac:

### 1. First Time Setup

Open Terminal and navigate to the folder:

```bash
cd /Volumes/YourDriveName/Claude\ Code
```

Run the setup script:

```bash
./setup.sh
```

This will:
- Check if Node.js is installed
- Install/reinstall dependencies
- Verify everything is ready

### 2. Start the Application

```bash
./start.sh
```

Then open your browser to: **http://localhost:3000**

---

## Manual Setup (if scripts don't work)

If you prefer to set up manually or the scripts have issues:

### Install Node.js (if not installed)

```bash
# Install nvm (Node Version Manager)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# Restart terminal or run:
source ~/.zshrc  # or ~/.bashrc

# Install Node.js version 22
nvm install 22
nvm use 22
```

### Install Dependencies

```bash
cd /path/to/Claude\ Code
npm install
```

### Start the Server

```bash
npm start
```

---

## Troubleshooting

### "Permission denied" when running scripts

Make the scripts executable:

```bash
chmod +x setup.sh start.sh
```

### "command not found: npm"

Node.js is not installed. Follow the Node.js installation steps above.

### "Port 3000 already in use"

Kill the existing process:

```bash
lsof -ti:3000 | xargs kill -9
```

Then try starting again.

### Different Mac Architecture (Intel vs Apple Silicon)

Always run `npm install` when moving between different Mac types to rebuild native dependencies.

---

## What's Included

When you copy this folder, everything comes with it:

✅ All your PDFs (in `pdfs/` folder)
✅ All your bookmarks (`.bookmarks.json`)
✅ Trash contents (`.trash/`)
✅ Application code
✅ Configuration files

You just need to install Node.js and run the setup!

---

## Support

If you encounter issues:
1. Make sure Node.js v18+ is installed: `node --version`
2. Delete `node_modules` and run `npm install` again
3. Check that you're in the correct directory
4. Try running `npm start` manually to see error messages
