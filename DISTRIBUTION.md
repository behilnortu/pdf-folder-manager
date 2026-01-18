# Distribution Guide for PDF Folder Manager

This guide explains how to distribute the PDF Folder Manager to others.

## Option 1: Publish to npm (Recommended)

This allows users to install with `npm install -g pdf-folder-manager` or run with `npx pdf-folder-manager`.

### Steps:

1. **Update package.json** with proper metadata:
   ```json
   {
     "name": "pdf-folder-manager",
     "version": "1.0.0",
     "description": "A web-based PDF management system",
     "main": "server/server.js",
     "bin": {
       "pdf-manager": "./bin/cli.js"
     },
     "repository": {
       "type": "git",
       "url": "https://github.com/yourusername/pdf-folder-manager.git"
     },
     "author": "Your Name",
     "license": "MIT"
   }
   ```

2. **Create a CLI wrapper** at `bin/cli.js`:
   ```javascript
   #!/usr/bin/env node
   require('../server/server.js');
   ```

3. **Create .npmignore** to exclude unnecessary files:
   ```
   node_modules/
   pdfs/
   .DS_Store
   npm-debug.log
   ```

4. **Publish to npm**:
   ```bash
   npm login
   npm publish
   ```

5. **Users can then install with**:
   ```bash
   npm install -g pdf-folder-manager
   pdf-manager
   ```

   Or run without installing:
   ```bash
   npx pdf-folder-manager
   ```

---

## Option 2: GitHub Repository (Free & Simple)

Perfect for open-source distribution.

### Steps:

1. **Initialize git** (if not already):
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   ```

2. **Create a GitHub repository** and push:
   ```bash
   git remote add origin https://github.com/yourusername/pdf-folder-manager.git
   git push -u origin main
   ```

3. **Users can install with**:
   ```bash
   git clone https://github.com/yourusername/pdf-folder-manager.git
   cd pdf-folder-manager
   npm install
   npm start
   ```

4. **Add badges to README.md** for professionalism:
   ```markdown
   ![npm version](https://badge.fury.io/js/pdf-folder-manager.svg)
   ![License](https://img.shields.io/badge/license-MIT-blue.svg)
   ```

---

## Option 3: Standalone Executable (Best for Non-Technical Users)

Create executable files for Windows, Mac, and Linux using `pkg`.

### Steps:

1. **Install pkg**:
   ```bash
   npm install -g pkg
   ```

2. **Update package.json**:
   ```json
   {
     "bin": "server/server.js",
     "pkg": {
       "assets": ["public/**/*"],
       "targets": ["node18-macos-x64", "node18-linux-x64", "node18-win-x64"]
     }
   }
   ```

3. **Build executables**:
   ```bash
   pkg . --out-path dist
   ```

4. **Distribute** the executables in the `dist/` folder:
   - `pdf-folder-manager-macos` (Mac)
   - `pdf-folder-manager-linux` (Linux)
   - `pdf-folder-manager-win.exe` (Windows)

5. **Users just run the executable** - no Node.js required!

---

## Option 4: Docker Container (Best for Server Deployment)

Package as a Docker image for consistent deployment.

### Steps:

1. **Create Dockerfile**:
   ```dockerfile
   FROM node:22-alpine

   WORKDIR /app

   COPY package*.json ./
   RUN npm install --production

   COPY . .

   EXPOSE 3000

   CMD ["npm", "start"]
   ```

2. **Create .dockerignore**:
   ```
   node_modules
   npm-debug.log
   .git
   .DS_Store
   ```

3. **Build and test**:
   ```bash
   docker build -t pdf-folder-manager .
   docker run -p 3000:3000 -v $(pwd)/pdfs:/app/pdfs pdf-folder-manager
   ```

4. **Publish to Docker Hub**:
   ```bash
   docker tag pdf-folder-manager yourusername/pdf-folder-manager
   docker push yourusername/pdf-folder-manager
   ```

5. **Users can run with**:
   ```bash
   docker pull yourusername/pdf-folder-manager
   docker run -p 3000:3000 -v ./pdfs:/app/pdfs yourusername/pdf-folder-manager
   ```

---

## Option 5: Electron Desktop App (Cross-Platform GUI)

Turn it into a native desktop application.

### Steps:

1. **Install Electron dependencies**:
   ```bash
   npm install --save-dev electron electron-builder
   ```

2. **Create electron.js**:
   ```javascript
   const { app, BrowserWindow } = require('electron');
   const path = require('path');
   const { spawn } = require('child_process');

   let serverProcess;

   function createWindow() {
     const win = new BrowserWindow({
       width: 1200,
       height: 800,
       webPreferences: {
         nodeIntegration: false
       }
     });

     // Start the server
     serverProcess = spawn('node', [path.join(__dirname, 'server/server.js')]);

     // Wait for server to start
     setTimeout(() => {
       win.loadURL('http://localhost:3000');
     }, 2000);
   }

   app.whenReady().then(createWindow);

   app.on('quit', () => {
     if (serverProcess) serverProcess.kill();
   });
   ```

3. **Update package.json**:
   ```json
   {
     "main": "electron.js",
     "scripts": {
       "electron": "electron .",
       "build": "electron-builder"
     },
     "build": {
       "appId": "com.yourname.pdf-folder-manager",
       "mac": {
         "category": "public.app-category.productivity"
       },
       "win": {
         "target": "nsis"
       },
       "linux": {
         "target": "AppImage"
       }
     }
   }
   ```

4. **Build installers**:
   ```bash
   npm run build
   ```

---

## Recommended Approach

**For developers**: Use **Option 1** (npm) + **Option 2** (GitHub)
- Easy to install and update
- Open source community can contribute
- Free hosting

**For end users**: Use **Option 3** (Executables) or **Option 5** (Electron)
- No technical knowledge required
- Double-click to run
- Works without Node.js installed

**For enterprise**: Use **Option 4** (Docker)
- Consistent deployment
- Easy scaling
- Isolated environment

---

## Pre-Distribution Checklist

Before distributing, make sure to:

- [ ] Add a proper LICENSE file (MIT is already specified)
- [ ] Update README.md with clear installation instructions
- [ ] Test on different operating systems
- [ ] Remove sensitive data from code
- [ ] Set up CI/CD (GitHub Actions) for automated testing
- [ ] Add contribution guidelines (CONTRIBUTING.md)
- [ ] Create a changelog (CHANGELOG.md)
- [ ] Add security policy (SECURITY.md)
- [ ] Test installation process from scratch
- [ ] Add version number and semantic versioning plan
