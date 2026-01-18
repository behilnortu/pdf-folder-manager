const express = require('express');
const path = require('path');
const fs = require('fs').promises;
const fsSync = require('fs');
const chokidar = require('chokidar');
const multer = require('multer');

const app = express();
const PORT = 3000;
const PDF_DIR = path.join(__dirname, '../pdfs');

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const folderName = req.params.folderName;
        const folderPath = path.join(PDF_DIR, folderName);

        // Ensure folder exists
        if (!fsSync.existsSync(folderPath)) {
            fsSync.mkdirSync(folderPath, { recursive: true });
        }

        cb(null, folderPath);
    },
    filename: (req, file, cb) => {
        cb(null, file.originalname);
    }
});

const upload = multer({
    storage: storage,
    fileFilter: (req, file, cb) => {
        if (file.mimetype === 'application/pdf') {
            cb(null, true);
        } else {
            cb(new Error('Only PDF files are allowed'));
        }
    }
});

// Parse JSON bodies
app.use(express.json());

// Store folder and PDF structure
let fileStructure = {};

// Function to scan PDF directory and build structure
async function scanPdfDirectory() {
    const newStructure = {};

    try {
        const folders = await fs.readdir(PDF_DIR);

        for (const folder of folders) {
            const folderPath = path.join(PDF_DIR, folder);
            const stats = await fs.stat(folderPath);

            if (stats.isDirectory()) {
                newStructure[folder] = [];

                try {
                    const files = await fs.readdir(folderPath);

                    for (const file of files) {
                        if (file.toLowerCase().endsWith('.pdf')) {
                            newStructure[folder].push(file);
                        }
                    }
                } catch (err) {
                    console.error(`Error reading folder ${folder}:`, err);
                }
            }
        }

        fileStructure = newStructure;
        console.log('File structure updated:', fileStructure);
    } catch (err) {
        console.error('Error scanning PDF directory:', err);
        fileStructure = {};
    }
}

// Initialize file watcher
function initializeWatcher() {
    const watcher = chokidar.watch(PDF_DIR, {
        ignored: /(^|[\/\\])\../, // ignore dotfiles
        persistent: true,
        ignoreInitial: true,
        depth: 2
    });

    watcher
        .on('add', async (filePath) => {
            console.log(`File added: ${filePath}`);
            await scanPdfDirectory();
        })
        .on('unlink', async (filePath) => {
            console.log(`File removed: ${filePath}`);
            await scanPdfDirectory();
        })
        .on('addDir', async (dirPath) => {
            console.log(`Directory added: ${dirPath}`);
            await scanPdfDirectory();
        })
        .on('unlinkDir', async (dirPath) => {
            console.log(`Directory removed: ${dirPath}`);
            await scanPdfDirectory();
        });

    console.log(`Watching for changes in: ${PDF_DIR}`);
}

// Serve static files from public directory
app.use(express.static(path.join(__dirname, '../public')));

// API endpoint to get folder structure
app.get('/api/folders', (req, res) => {
    const folders = Object.keys(fileStructure);
    res.json({ folders });
});

// API endpoint to get PDFs in a specific folder
app.get('/api/folders/:folderName/pdfs', (req, res) => {
    const folderName = req.params.folderName;
    const pdfs = fileStructure[folderName] || [];
    res.json({ pdfs });
});

// API endpoint to serve PDF files
app.get('/api/pdf/:folderName/:pdfName', (req, res) => {
    const folderName = req.params.folderName;
    const pdfName = req.params.pdfName;
    const pdfPath = path.join(PDF_DIR, folderName, pdfName);

    res.sendFile(pdfPath, (err) => {
        if (err) {
            console.error('Error sending PDF:', err);
            res.status(404).json({ error: 'PDF not found' });
        }
    });
});

// API endpoint to create a new folder
app.post('/api/folders', async (req, res) => {
    const { folderName } = req.body;

    if (!folderName || folderName.trim() === '') {
        return res.status(400).json({ error: 'Folder name is required' });
    }

    // Sanitize folder name (remove special characters)
    const sanitizedName = folderName.replace(/[^a-zA-Z0-9-_\s]/g, '');

    if (sanitizedName !== folderName) {
        return res.status(400).json({ error: 'Folder name contains invalid characters' });
    }

    const folderPath = path.join(PDF_DIR, sanitizedName);

    try {
        // Check if folder already exists
        if (fsSync.existsSync(folderPath)) {
            return res.status(409).json({ error: 'Folder already exists' });
        }

        await fs.mkdir(folderPath, { recursive: true });
        await scanPdfDirectory();

        res.json({ success: true, folderName: sanitizedName });
    } catch (err) {
        console.error('Error creating folder:', err);
        res.status(500).json({ error: 'Failed to create folder' });
    }
});

// API endpoint to upload PDF files
app.post('/api/folders/:folderName/upload', upload.array('pdfs', 10), async (req, res) => {
    try {
        await scanPdfDirectory();

        res.json({
            success: true,
            filesUploaded: req.files.length,
            files: req.files.map(f => f.originalname)
        });
    } catch (err) {
        console.error('Error uploading PDFs:', err);
        res.status(500).json({ error: 'Failed to upload PDFs' });
    }
});

// Initialize and start server
async function startServer() {
    // Ensure PDF directory exists
    try {
        await fs.mkdir(PDF_DIR, { recursive: true });
    } catch (err) {
        console.error('Error creating PDF directory:', err);
    }

    // Initial scan
    await scanPdfDirectory();

    // Start watching for changes
    initializeWatcher();

    // Start server
    app.listen(PORT, () => {
        console.log(`Server running at http://localhost:${PORT}`);
        console.log(`PDF directory: ${PDF_DIR}`);
        console.log('Add PDFs to subdirectories in the pdfs/ folder');
    });
}

startServer();
