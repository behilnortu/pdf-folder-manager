#!/usr/bin/env node

const path = require('path');
const { exec } = require('child_process');

console.log('🚀 Starting PDF Folder Manager...');
console.log('📁 PDFs will be stored in: ./pdfs');
console.log('🌐 Server will be available at: http://localhost:3000');
console.log('');

// Start the server
require(path.join(__dirname, '../server/server.js'));
