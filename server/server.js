const path = require('path');
// Load environment variables from .env file with override enabled
// This is necessary because some environments may set empty env vars
require('dotenv').config({ path: path.join(__dirname, '../.env'), override: true });

const express = require('express');
const fs = require('fs').promises;
const fsSync = require('fs');
const chokidar = require('chokidar');
const multer = require('multer');
const archiver = require('archiver');
const pdfParse = require('pdf-parse');
const Anthropic = require('@anthropic-ai/sdk');

const app = express();
const PORT = 3000;
const PDF_DIR = path.join(__dirname, '../pdfs');
const TRASH_DIR = path.join(__dirname, '../.trash');
const TRASH_METADATA = path.join(TRASH_DIR, 'metadata.json');
const BOOKMARKS_FILE = path.join(__dirname, '../.bookmarks.json');
const NOTES_FILE = path.join(__dirname, '../.notes.json');
const HEADINGS_FILE = path.join(__dirname, '../.headings.json');

// Initialize Anthropic client
const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY || '',
});

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

// Bookmark helpers
async function loadBookmarks() {
    try {
        if (fsSync.existsSync(BOOKMARKS_FILE)) {
            const data = await fs.readFile(BOOKMARKS_FILE, 'utf8');
            return JSON.parse(data);
        }
    } catch (err) {
        console.error('Error loading bookmarks:', err);
    }
    return [];
}

async function saveBookmarks(bookmarks) {
    try {
        await fs.writeFile(BOOKMARKS_FILE, JSON.stringify(bookmarks, null, 2));
    } catch (err) {
        console.error('Error saving bookmarks:', err);
    }
}

function generateBookmarkId() {
    return Date.now() + '-' + Math.random().toString(36).substr(2, 9);
}

// Notes helpers
async function loadNotes() {
    try {
        if (fsSync.existsSync(NOTES_FILE)) {
            const data = await fs.readFile(NOTES_FILE, 'utf8');
            return JSON.parse(data);
        }
    } catch (err) {
        console.error('Error loading notes:', err);
    }
    return {};
}

async function saveNotes(notes) {
    try {
        await fs.writeFile(NOTES_FILE, JSON.stringify(notes, null, 2));
    } catch (err) {
        console.error('Error saving notes:', err);
    }
}

// Headings helpers
async function loadHeadings() {
    try {
        if (fsSync.existsSync(HEADINGS_FILE)) {
            const data = await fs.readFile(HEADINGS_FILE, 'utf8');
            return JSON.parse(data);
        }
    } catch (err) {
        console.error('Error loading headings:', err);
    }
    return [];
}

async function saveHeadings(headings) {
    try {
        await fs.writeFile(HEADINGS_FILE, JSON.stringify(headings, null, 2));
    } catch (err) {
        console.error('Error saving headings:', err);
    }
}

function generateHeadingId() {
    return 'heading_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

// Page count cache: key is "folder/filename", value is {mtime, size, pages}
const pageCountCache = new Map();

// Helper function to get PDF page count with caching
async function getPdfPageCount(filePath, fileStats) {
    const cacheKey = filePath;
    const cached = pageCountCache.get(cacheKey);

    // Use cache if file hasn't changed (same size and mtime)
    if (cached &&
        cached.size === fileStats.size &&
        cached.mtime.getTime() === fileStats.mtime.getTime()) {
        return cached.pages;
    }

    // Calculate page count
    try {
        const dataBuffer = await fs.readFile(filePath);
        const data = await pdfParse(dataBuffer);
        const pageCount = data.numpages;

        // Cache the result
        pageCountCache.set(cacheKey, {
            mtime: fileStats.mtime,
            size: fileStats.size,
            pages: pageCount
        });

        return pageCount;
    } catch (err) {
        console.error(`Error getting page count for ${filePath}:`, err.message);
        return null; // Return null if we can't get page count
    }
}

// Function to scan PDF directory and build structure
async function scanPdfDirectory() {
    const newStructure = {};

    try {
        const folders = await fs.readdir(PDF_DIR);

        // Load all notes once to check for summaries
        const allNotes = await loadNotes();

        for (const folder of folders) {
            const folderPath = path.join(PDF_DIR, folder);
            const stats = await fs.stat(folderPath);

            if (stats.isDirectory()) {
                newStructure[folder] = {
                    name: folder,
                    mtime: stats.mtime,
                    pdfs: []
                };

                try {
                    const files = await fs.readdir(folderPath);

                    for (const file of files) {
                        if (file.toLowerCase().endsWith('.pdf')) {
                            const filePath = path.join(folderPath, file);
                            const fileStats = await fs.stat(filePath);
                            const pageCount = await getPdfPageCount(filePath, fileStats);

                            // Check if this PDF has a summary in its notes
                            const noteKey = `${folder}/${file}`;
                            const note = allNotes[noteKey];
                            const hasSummary = note && note.text && note.text.includes('## AI Summary');

                            newStructure[folder].pdfs.push({
                                name: file,
                                size: fileStats.size,
                                mtime: fileStats.mtime,
                                pages: pageCount,
                                hasSummary: hasSummary || false
                            });
                        }
                    }
                } catch (err) {
                    console.error(`Error reading folder ${folder}:`, err);
                }
            }
        }

        fileStructure = newStructure;
        console.log('File structure updated - cached:', pageCountCache.size, 'PDFs');
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
    const folders = Object.values(fileStructure);
    res.json({ folders });
});

// API endpoint to get PDFs in a specific folder
app.get('/api/folders/:folderName/pdfs', (req, res) => {
    const folderName = req.params.folderName;
    const folderData = fileStructure[folderName];
    const pdfs = folderData ? folderData.pdfs : [];
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

// API endpoint to move a PDF to another folder
app.post('/api/folders/:sourceFolderName/pdf/:pdfName/move', async (req, res) => {
    const sourceFolderName = req.params.sourceFolderName;
    const pdfName = req.params.pdfName;
    const { destinationFolderName } = req.body;

    if (!destinationFolderName || destinationFolderName.trim() === '') {
        return res.status(400).json({ error: 'Destination folder name is required' });
    }

    const sourcePdfPath = path.join(PDF_DIR, sourceFolderName, pdfName);
    const destinationFolderPath = path.join(PDF_DIR, destinationFolderName);
    const destinationPdfPath = path.join(destinationFolderPath, pdfName);

    try {
        // Check if source PDF exists
        if (!fsSync.existsSync(sourcePdfPath)) {
            return res.status(404).json({ error: 'PDF not found' });
        }

        // Check if destination folder exists
        if (!fsSync.existsSync(destinationFolderPath)) {
            return res.status(404).json({ error: 'Destination folder not found' });
        }

        // Check if PDF with same name already exists in destination
        if (fsSync.existsSync(destinationPdfPath)) {
            return res.status(409).json({ error: 'A PDF with this name already exists in the destination folder' });
        }

        // Check if source and destination are the same
        if (sourceFolderName === destinationFolderName) {
            return res.status(400).json({ error: 'Source and destination folders are the same' });
        }

        await fs.rename(sourcePdfPath, destinationPdfPath);
        await scanPdfDirectory();

        res.json({ success: true, message: 'PDF moved successfully' });
    } catch (err) {
        console.error('Error moving PDF:', err);
        res.status(500).json({ error: 'Failed to move PDF' });
    }
});

// API endpoint to export/download a folder as ZIP
app.get('/api/folders/:folderName/export', async (req, res) => {
    const folderName = req.params.folderName;
    const folderPath = path.join(PDF_DIR, folderName);

    try {
        // Check if folder exists
        if (!fsSync.existsSync(folderPath)) {
            return res.status(404).json({ error: 'Folder not found' });
        }

        // Set headers for ZIP download
        const zipFileName = `${folderName}.zip`;
        res.attachment(zipFileName);
        res.setHeader('Content-Type', 'application/zip');

        // Create archiver instance
        const archive = archiver('zip', {
            zlib: { level: 9 } // Maximum compression
        });

        // Handle errors
        archive.on('error', (err) => {
            console.error('Archive error:', err);
            res.status(500).json({ error: 'Failed to create ZIP archive' });
        });

        // Pipe archive to response
        archive.pipe(res);

        // Add all PDF files from the folder to the archive
        archive.directory(folderPath, false);

        // Finalize the archive
        await archive.finalize();

        console.log(`Exported folder "${folderName}" as ZIP`);
    } catch (err) {
        console.error('Error exporting folder:', err);
        if (!res.headersSent) {
            res.status(500).json({ error: 'Failed to export folder' });
        }
    }
});

// API endpoint to get all bookmarks
app.get('/api/bookmarks', async (req, res) => {
    try {
        const bookmarks = await loadBookmarks();
        res.json({ bookmarks });
    } catch (err) {
        console.error('Error getting bookmarks:', err);
        res.status(500).json({ error: 'Failed to get bookmarks' });
    }
});

// API endpoint to get bookmarks for a specific PDF
app.get('/api/bookmarks/:folderName/:pdfName', async (req, res) => {
    const folderName = req.params.folderName;
    const pdfName = req.params.pdfName;

    try {
        const allBookmarks = await loadBookmarks();
        const pdfBookmarks = allBookmarks.filter(
            b => b.folderName === folderName && b.pdfName === pdfName
        );
        res.json({ bookmarks: pdfBookmarks });
    } catch (err) {
        console.error('Error getting PDF bookmarks:', err);
        res.status(500).json({ error: 'Failed to get bookmarks' });
    }
});

// API endpoint to create a bookmark
app.post('/api/bookmarks', async (req, res) => {
    const { folderName, pdfName, pageNumber, label } = req.body;

    if (!folderName || !pdfName || pageNumber === undefined) {
        return res.status(400).json({ error: 'Folder name, PDF name, and page number are required' });
    }

    try {
        const bookmarks = await loadBookmarks();
        const newBookmark = {
            id: generateBookmarkId(),
            folderName,
            pdfName,
            pageNumber: parseInt(pageNumber),
            label: label || `Page ${pageNumber}`,
            createdAt: new Date().toISOString()
        };

        bookmarks.push(newBookmark);
        await saveBookmarks(bookmarks);

        res.json({ success: true, bookmark: newBookmark });
    } catch (err) {
        console.error('Error creating bookmark:', err);
        res.status(500).json({ error: 'Failed to create bookmark' });
    }
});

// API endpoint to delete a bookmark
app.delete('/api/bookmarks/:id', async (req, res) => {
    const bookmarkId = req.params.id;

    try {
        const bookmarks = await loadBookmarks();
        const bookmarkIndex = bookmarks.findIndex(b => b.id === bookmarkId);

        if (bookmarkIndex === -1) {
            return res.status(404).json({ error: 'Bookmark not found' });
        }

        bookmarks.splice(bookmarkIndex, 1);
        await saveBookmarks(bookmarks);

        res.json({ success: true, message: 'Bookmark deleted' });
    } catch (err) {
        console.error('Error deleting bookmark:', err);
        res.status(500).json({ error: 'Failed to delete bookmark' });
    }
});

// API endpoint to get note for a specific PDF
app.get('/api/notes/:folderName/:pdfName', async (req, res) => {
    const { folderName, pdfName } = req.params;
    const noteKey = `${folderName}/${pdfName}`;

    try {
        const notes = await loadNotes();
        const note = notes[noteKey] || { text: '', updatedAt: null };
        res.json({ note });
    } catch (err) {
        console.error('Error loading note:', err);
        res.status(500).json({ error: 'Failed to load note' });
    }
});

// API endpoint to save note for a specific PDF
app.post('/api/notes/:folderName/:pdfName', async (req, res) => {
    const { folderName, pdfName } = req.params;
    const { text } = req.body;
    const noteKey = `${folderName}/${pdfName}`;

    try {
        const notes = await loadNotes();

        if (text && text.trim()) {
            // Save or update note
            notes[noteKey] = {
                text: text.trim(),
                updatedAt: new Date().toISOString()
            };
        } else {
            // Delete note if text is empty
            delete notes[noteKey];
        }

        await saveNotes(notes);
        res.json({ success: true, note: notes[noteKey] });
    } catch (err) {
        console.error('Error saving note:', err);
        res.status(500).json({ error: 'Failed to save note' });
    }
});

// API endpoint to get all headings
app.get('/api/headings', async (req, res) => {
    try {
        const headings = await loadHeadings();
        res.json({ headings });
    } catch (err) {
        console.error('Error loading headings:', err);
        res.status(500).json({ error: 'Failed to load headings' });
    }
});

// API endpoint to create a new heading
app.post('/api/headings', async (req, res) => {
    const { name } = req.body;

    if (!name || !name.trim()) {
        return res.status(400).json({ error: 'Heading name is required' });
    }

    try {
        const headings = await loadHeadings();
        const newHeading = {
            id: generateHeadingId(),
            name: name.trim(),
            expanded: true,
            folders: []
        };

        headings.push(newHeading);
        await saveHeadings(headings);

        res.json({ success: true, heading: newHeading });
    } catch (err) {
        console.error('Error creating heading:', err);
        res.status(500).json({ error: 'Failed to create heading' });
    }
});

// API endpoint to rename a heading
app.put('/api/headings/:headingId', async (req, res) => {
    const { headingId } = req.params;
    const { name } = req.body;

    if (!name || !name.trim()) {
        return res.status(400).json({ error: 'Heading name is required' });
    }

    try {
        const headings = await loadHeadings();
        const heading = headings.find(h => h.id === headingId);

        if (!heading) {
            return res.status(404).json({ error: 'Heading not found' });
        }

        heading.name = name.trim();
        await saveHeadings(headings);

        res.json({ success: true, heading });
    } catch (err) {
        console.error('Error renaming heading:', err);
        res.status(500).json({ error: 'Failed to rename heading' });
    }
});

// API endpoint to delete a heading
app.delete('/api/headings/:headingId', async (req, res) => {
    const { headingId } = req.params;

    try {
        const headings = await loadHeadings();
        const headingIndex = headings.findIndex(h => h.id === headingId);

        if (headingIndex === -1) {
            return res.status(404).json({ error: 'Heading not found' });
        }

        headings.splice(headingIndex, 1);
        await saveHeadings(headings);

        res.json({ success: true });
    } catch (err) {
        console.error('Error deleting heading:', err);
        res.status(500).json({ error: 'Failed to delete heading' });
    }
});

// API endpoint to toggle heading expanded state
app.put('/api/headings/:headingId/toggle', async (req, res) => {
    const { headingId } = req.params;

    try {
        const headings = await loadHeadings();
        const heading = headings.find(h => h.id === headingId);

        if (!heading) {
            return res.status(404).json({ error: 'Heading not found' });
        }

        heading.expanded = !heading.expanded;
        await saveHeadings(headings);

        res.json({ success: true, heading });
    } catch (err) {
        console.error('Error toggling heading:', err);
        res.status(500).json({ error: 'Failed to toggle heading' });
    }
});

// API endpoint to assign folder to heading
app.post('/api/headings/:headingId/assign', async (req, res) => {
    const { headingId } = req.params;
    const { folderName } = req.body;

    if (!folderName) {
        return res.status(400).json({ error: 'Folder name is required' });
    }

    try {
        const headings = await loadHeadings();

        // Remove folder from all headings first
        headings.forEach(h => {
            h.folders = h.folders.filter(f => f !== folderName);
        });

        // Add folder to specified heading
        const heading = headings.find(h => h.id === headingId);
        if (!heading) {
            return res.status(404).json({ error: 'Heading not found' });
        }

        if (!heading.folders.includes(folderName)) {
            heading.folders.push(folderName);
        }

        await saveHeadings(headings);
        res.json({ success: true, heading });
    } catch (err) {
        console.error('Error assigning folder to heading:', err);
        res.status(500).json({ error: 'Failed to assign folder' });
    }
});

// API endpoint to unassign folder from heading
app.post('/api/headings/unassign', async (req, res) => {
    const { folderName } = req.body;

    if (!folderName) {
        return res.status(400).json({ error: 'Folder name is required' });
    }

    try {
        const headings = await loadHeadings();

        // Remove folder from all headings
        headings.forEach(h => {
            h.folders = h.folders.filter(f => f !== folderName);
        });

        await saveHeadings(headings);
        res.json({ success: true });
    } catch (err) {
        console.error('Error unassigning folder:', err);
        res.status(500).json({ error: 'Failed to unassign folder' });
    }
});

// API endpoint to duplicate a folder
app.post('/api/folders/:folderName/duplicate', async (req, res) => {
    const folderName = req.params.folderName;
    const sourcePath = path.join(PDF_DIR, folderName);

    try {
        // Check if source folder exists
        if (!fsSync.existsSync(sourcePath)) {
            return res.status(404).json({ error: 'Folder not found' });
        }

        // Generate new folder name with (copy) pattern
        let newFolderName = `${folderName} (copy)`;
        let counter = 2;

        // Check if name exists, increment until we find a unique name
        while (fsSync.existsSync(path.join(PDF_DIR, newFolderName))) {
            newFolderName = `${folderName} (copy ${counter})`;
            counter++;
        }

        const destPath = path.join(PDF_DIR, newFolderName);

        // Create new folder
        await fs.mkdir(destPath, { recursive: true });

        // Read all PDFs in source folder
        const files = await fs.readdir(sourcePath);
        const pdfFiles = files.filter(file => file.toLowerCase().endsWith('.pdf'));

        // Copy each PDF
        for (const pdfFile of pdfFiles) {
            const srcFile = path.join(sourcePath, pdfFile);
            const destFile = path.join(destPath, pdfFile);
            await fs.copyFile(srcFile, destFile);
        }

        // Duplicate bookmarks and notes for all PDFs
        const bookmarks = await loadBookmarks();
        const notes = await loadNotes();

        // Duplicate bookmarks
        const folderBookmarks = bookmarks.filter(b => b.folderName === folderName);
        for (const bookmark of folderBookmarks) {
            bookmarks.push({
                ...bookmark,
                id: generateBookmarkId(),
                folderName: newFolderName,
                createdAt: new Date().toISOString()
            });
        }
        await saveBookmarks(bookmarks);

        // Duplicate notes
        for (const pdfFile of pdfFiles) {
            const sourceKey = `${folderName}/${pdfFile}`;
            const destKey = `${newFolderName}/${pdfFile}`;

            if (notes[sourceKey]) {
                notes[destKey] = {
                    text: notes[sourceKey].text,
                    updatedAt: new Date().toISOString()
                };
            }
        }
        await saveNotes(notes);

        await scanPdfDirectory();

        res.json({ success: true, newFolderName: newFolderName });
    } catch (err) {
        console.error('Error duplicating folder:', err);
        res.status(500).json({ error: 'Failed to duplicate folder' });
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

// API endpoint to duplicate a PDF
app.post('/api/folders/:folderName/pdf/:pdfName/duplicate', async (req, res) => {
    const folderName = req.params.folderName;
    const pdfName = req.params.pdfName;
    const folderPath = path.join(PDF_DIR, folderName);
    const sourcePath = path.join(folderPath, pdfName);

    try {
        // Check if source PDF exists
        if (!fsSync.existsSync(sourcePath)) {
            return res.status(404).json({ error: 'PDF not found' });
        }

        // Generate new name with (copy) pattern
        const ext = path.extname(pdfName);
        const baseName = path.basename(pdfName, ext);
        let newName = `${baseName} (copy)${ext}`;
        let counter = 2;

        // Check if name exists, increment until we find a unique name
        while (fsSync.existsSync(path.join(folderPath, newName))) {
            newName = `${baseName} (copy ${counter})${ext}`;
            counter++;
        }

        const destPath = path.join(folderPath, newName);

        // Copy the PDF file
        await fs.copyFile(sourcePath, destPath);

        // Also duplicate bookmarks and notes if they exist
        const bookmarks = await loadBookmarks();
        const notes = await loadNotes();

        const sourceKey = `${folderName}/${pdfName}`;
        const destKey = `${folderName}/${newName}`;

        // Duplicate bookmarks
        const sourceBookmarks = bookmarks.filter(b =>
            b.folderName === folderName && b.pdfName === pdfName
        );
        for (const bookmark of sourceBookmarks) {
            bookmarks.push({
                ...bookmark,
                id: generateBookmarkId(),
                pdfName: newName,
                createdAt: new Date().toISOString()
            });
        }
        await saveBookmarks(bookmarks);

        // Duplicate notes
        if (notes[sourceKey]) {
            notes[destKey] = {
                text: notes[sourceKey].text,
                updatedAt: new Date().toISOString()
            };
            await saveNotes(notes);
        }

        await scanPdfDirectory();

        res.json({ success: true, newPdfName: newName });
    } catch (err) {
        console.error('Error duplicating PDF:', err);
        res.status(500).json({ error: 'Failed to duplicate PDF' });
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

// API endpoint to generate PDF summary using Claude
app.post('/api/folders/:folderName/pdf/:pdfName/summarize', async (req, res) => {
    try {
        const { folderName, pdfName } = req.params;

        // Check if API key is configured
        if (!process.env.ANTHROPIC_API_KEY) {
            return res.status(503).json({
                error: 'Anthropic API key not configured. Please set ANTHROPIC_API_KEY environment variable.'
            });
        }

        const pdfPath = path.join(PDF_DIR, folderName, pdfName);

        // Check if file exists
        if (!fsSync.existsSync(pdfPath)) {
            return res.status(404).json({ error: 'PDF not found' });
        }

        // Check file size (32MB = 33554432 bytes)
        const stats = await fs.stat(pdfPath);
        if (stats.size > 33554432) {
            return res.status(413).json({
                error: 'PDF exceeds 32MB limit. Please use a smaller file.'
            });
        }

        // Read PDF file as base64
        const pdfBuffer = await fs.readFile(pdfPath);
        const pdfBase64 = pdfBuffer.toString('base64');

        console.log(`Generating summary for ${pdfName}...`);

        // Call Claude API with PDF
        const message = await anthropic.messages.create({
            model: 'claude-sonnet-4-20250514',
            max_tokens: 1024,
            messages: [{
                role: 'user',
                content: [
                    {
                        type: 'document',
                        source: {
                            type: 'base64',
                            media_type: 'application/pdf',
                            data: pdfBase64,
                        },
                    },
                    {
                        type: 'text',
                        text: 'Please provide a standard summary of this PDF document in 150-300 words. Focus on the main topic, key points, methodology (if applicable), findings/conclusions, and any important implications. Write in a clear, professional tone suitable for quick reference.'
                    }
                ],
            }],
        });

        // Extract summary text from response
        const summary = message.content[0].text;

        console.log(`Summary generated successfully for ${pdfName}`);

        res.json({
            success: true,
            summary: summary
        });
    } catch (err) {
        console.error('Error generating summary:', err);

        // Handle specific Anthropic API errors
        if (err.status === 401) {
            return res.status(401).json({ error: 'Invalid Anthropic API key' });
        }
        if (err.status === 429) {
            return res.status(429).json({ error: 'Rate limit exceeded. Please try again later.' });
        }

        res.status(500).json({
            error: 'Failed to generate summary',
            details: err.message
        });
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
