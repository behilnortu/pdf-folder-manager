const express = require('express');
const path = require('path');
const fs = require('fs').promises;
const fsSync = require('fs');
const chokidar = require('chokidar');
const multer = require('multer');

const app = express();
const PORT = 3000;
const PDF_DIR = path.join(__dirname, '../pdfs');
const TRASH_DIR = path.join(__dirname, '../.trash');
const TRASH_METADATA = path.join(TRASH_DIR, 'metadata.json');

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

// Trash metadata helpers
async function loadTrashMetadata() {
    try {
        if (fsSync.existsSync(TRASH_METADATA)) {
            const data = await fs.readFile(TRASH_METADATA, 'utf8');
            return JSON.parse(data);
        }
    } catch (err) {
        console.error('Error loading trash metadata:', err);
    }
    return [];
}

async function saveTrashMetadata(metadata) {
    try {
        await fs.mkdir(TRASH_DIR, { recursive: true });
        await fs.writeFile(TRASH_METADATA, JSON.stringify(metadata, null, 2));
    } catch (err) {
        console.error('Error saving trash metadata:', err);
    }
}

function generateTrashId() {
    return Date.now() + '-' + Math.random().toString(36).substr(2, 9);
}

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

// API endpoint to rename a folder
app.put('/api/folders/:oldFolderName', async (req, res) => {
    const oldFolderName = req.params.oldFolderName;
    const { newFolderName } = req.body;

    if (!newFolderName || newFolderName.trim() === '') {
        return res.status(400).json({ error: 'New folder name is required' });
    }

    // Sanitize folder name (remove special characters)
    const sanitizedName = newFolderName.replace(/[^a-zA-Z0-9-_\s]/g, '');

    if (sanitizedName !== newFolderName) {
        return res.status(400).json({ error: 'Folder name contains invalid characters' });
    }

    const oldFolderPath = path.join(PDF_DIR, oldFolderName);
    const newFolderPath = path.join(PDF_DIR, sanitizedName);

    try {
        // Check if old folder exists
        if (!fsSync.existsSync(oldFolderPath)) {
            return res.status(404).json({ error: 'Folder not found' });
        }

        // Check if new folder name already exists
        if (fsSync.existsSync(newFolderPath)) {
            return res.status(409).json({ error: 'A folder with this name already exists' });
        }

        await fs.rename(oldFolderPath, newFolderPath);
        await scanPdfDirectory();

        res.json({ success: true, newFolderName: sanitizedName });
    } catch (err) {
        console.error('Error renaming folder:', err);
        res.status(500).json({ error: 'Failed to rename folder' });
    }
});

// API endpoint to rename a PDF file
app.put('/api/folders/:folderName/pdf/:oldPdfName', async (req, res) => {
    const folderName = req.params.folderName;
    const oldPdfName = req.params.oldPdfName;
    const { newPdfName } = req.body;

    if (!newPdfName || newPdfName.trim() === '') {
        return res.status(400).json({ error: 'New PDF name is required' });
    }

    // Ensure new name ends with .pdf
    let sanitizedName = newPdfName.trim();
    if (!sanitizedName.toLowerCase().endsWith('.pdf')) {
        sanitizedName += '.pdf';
    }

    // Sanitize filename (remove special characters except . and -)
    sanitizedName = sanitizedName.replace(/[^a-zA-Z0-9-_\s.]/g, '');

    const oldPdfPath = path.join(PDF_DIR, folderName, oldPdfName);
    const newPdfPath = path.join(PDF_DIR, folderName, sanitizedName);

    try {
        // Check if old PDF exists
        if (!fsSync.existsSync(oldPdfPath)) {
            return res.status(404).json({ error: 'PDF not found' });
        }

        // Check if new PDF name already exists
        if (fsSync.existsSync(newPdfPath)) {
            return res.status(409).json({ error: 'A PDF with this name already exists' });
        }

        await fs.rename(oldPdfPath, newPdfPath);
        await scanPdfDirectory();

        res.json({ success: true, newPdfName: sanitizedName });
    } catch (err) {
        console.error('Error renaming PDF:', err);
        res.status(500).json({ error: 'Failed to rename PDF' });
    }
});

// API endpoint to move folder to trash
app.delete('/api/folders/:folderName', async (req, res) => {
    const folderName = req.params.folderName;
    const folderPath = path.join(PDF_DIR, folderName);

    try {
        // Check if folder exists
        if (!fsSync.existsSync(folderPath)) {
            return res.status(404).json({ error: 'Folder not found' });
        }

        // Generate trash ID and move folder to trash
        const trashId = generateTrashId();
        const trashPath = path.join(TRASH_DIR, trashId);

        await fs.mkdir(TRASH_DIR, { recursive: true });
        await fs.rename(folderPath, trashPath);

        // Update metadata
        const metadata = await loadTrashMetadata();
        metadata.push({
            id: trashId,
            type: 'folder',
            name: folderName,
            originalPath: folderPath,
            deletedAt: new Date().toISOString()
        });
        await saveTrashMetadata(metadata);
        await scanPdfDirectory();

        res.json({ success: true, message: 'Folder moved to trash' });
    } catch (err) {
        console.error('Error moving folder to trash:', err);
        res.status(500).json({ error: 'Failed to move folder to trash' });
    }
});

// API endpoint to move PDF to trash
app.delete('/api/folders/:folderName/pdf/:pdfName', async (req, res) => {
    const folderName = req.params.folderName;
    const pdfName = req.params.pdfName;
    const pdfPath = path.join(PDF_DIR, folderName, pdfName);

    try {
        // Check if PDF exists
        if (!fsSync.existsSync(pdfPath)) {
            return res.status(404).json({ error: 'PDF not found' });
        }

        // Generate trash ID and move PDF to trash
        const trashId = generateTrashId();
        const trashPath = path.join(TRASH_DIR, trashId + '.pdf');

        await fs.mkdir(TRASH_DIR, { recursive: true });
        await fs.rename(pdfPath, trashPath);

        // Update metadata
        const metadata = await loadTrashMetadata();
        metadata.push({
            id: trashId,
            type: 'pdf',
            name: pdfName,
            folderName: folderName,
            originalPath: pdfPath,
            deletedAt: new Date().toISOString()
        });
        await saveTrashMetadata(metadata);
        await scanPdfDirectory();

        res.json({ success: true, message: 'PDF moved to trash' });
    } catch (err) {
        console.error('Error moving PDF to trash:', err);
        res.status(500).json({ error: 'Failed to move PDF to trash' });
    }
});

// API endpoint to get trash items
app.get('/api/trash', async (req, res) => {
    try {
        const metadata = await loadTrashMetadata();
        res.json({ items: metadata });
    } catch (err) {
        console.error('Error getting trash items:', err);
        res.status(500).json({ error: 'Failed to get trash items' });
    }
});

// API endpoint to restore from trash
app.post('/api/trash/:id/restore', async (req, res) => {
    const trashId = req.params.id;

    try {
        const metadata = await loadTrashMetadata();
        const itemIndex = metadata.findIndex(item => item.id === trashId);

        if (itemIndex === -1) {
            return res.status(404).json({ error: 'Item not found in trash' });
        }

        const item = metadata[itemIndex];

        if (item.type === 'folder') {
            const trashPath = path.join(TRASH_DIR, trashId);
            const restorePath = path.join(PDF_DIR, item.name);

            // Check if folder with same name exists
            if (fsSync.existsSync(restorePath)) {
                return res.status(409).json({ error: 'A folder with this name already exists' });
            }

            await fs.rename(trashPath, restorePath);
        } else if (item.type === 'pdf') {
            const trashPath = path.join(TRASH_DIR, trashId + '.pdf');
            const folderPath = path.join(PDF_DIR, item.folderName);
            const restorePath = path.join(folderPath, item.name);

            // Ensure folder exists
            await fs.mkdir(folderPath, { recursive: true });

            // Check if PDF with same name exists
            if (fsSync.existsSync(restorePath)) {
                return res.status(409).json({ error: 'A PDF with this name already exists in the folder' });
            }

            await fs.rename(trashPath, restorePath);
        }

        // Remove from metadata
        metadata.splice(itemIndex, 1);
        await saveTrashMetadata(metadata);
        await scanPdfDirectory();

        res.json({ success: true, message: 'Item restored successfully' });
    } catch (err) {
        console.error('Error restoring from trash:', err);
        res.status(500).json({ error: 'Failed to restore item' });
    }
});

// API endpoint to permanently delete from trash
app.delete('/api/trash/:id', async (req, res) => {
    const trashId = req.params.id;

    try {
        const metadata = await loadTrashMetadata();
        const itemIndex = metadata.findIndex(item => item.id === trashId);

        if (itemIndex === -1) {
            return res.status(404).json({ error: 'Item not found in trash' });
        }

        const item = metadata[itemIndex];

        if (item.type === 'folder') {
            const trashPath = path.join(TRASH_DIR, trashId);
            await fs.rm(trashPath, { recursive: true, force: true });
        } else if (item.type === 'pdf') {
            const trashPath = path.join(TRASH_DIR, trashId + '.pdf');
            await fs.unlink(trashPath);
        }

        // Remove from metadata
        metadata.splice(itemIndex, 1);
        await saveTrashMetadata(metadata);

        res.json({ success: true, message: 'Item permanently deleted' });
    } catch (err) {
        console.error('Error permanently deleting item:', err);
        res.status(500).json({ error: 'Failed to permanently delete item' });
    }
});

// API endpoint to empty trash
app.delete('/api/trash/empty/all', async (req, res) => {
    try {
        // Delete all items in trash directory
        if (fsSync.existsSync(TRASH_DIR)) {
            await fs.rm(TRASH_DIR, { recursive: true, force: true });
        }

        // Recreate trash directory and empty metadata
        await fs.mkdir(TRASH_DIR, { recursive: true });
        await saveTrashMetadata([]);

        res.json({ success: true, message: 'Trash emptied successfully' });
    } catch (err) {
        console.error('Error emptying trash:', err);
        res.status(500).json({ error: 'Failed to empty trash' });
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
