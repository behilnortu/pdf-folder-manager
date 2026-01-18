// State management
let selectedFolder = null;
let folders = [];
let currentPdfs = [];
let filteredPdfs = [];
let searchQuery = '';

// DOM elements
const folderListElement = document.getElementById('folder-list');
const pdfListElement = document.getElementById('pdf-list');
const pdfViewerElement = document.getElementById('pdf-viewer');
const searchInput = document.getElementById('search-input');
const newFolderBtn = document.getElementById('new-folder-btn');
const uploadPdfBtn = document.getElementById('upload-pdf-btn');
const pdfFileInput = document.getElementById('pdf-file-input');
const folderModal = document.getElementById('folder-modal');
const folderNameInput = document.getElementById('folder-name-input');
const createFolderBtn = document.getElementById('create-folder-btn');
const cancelFolderBtn = document.getElementById('cancel-folder-btn');

// Load folders from API
async function loadFolders() {
    try {
        const response = await fetch('/api/folders');
        const data = await response.json();
        folders = data.folders;
        renderFolders();
    } catch (error) {
        console.error('Error loading folders:', error);
        folderListElement.innerHTML = '<p class="empty-message">Error loading folders</p>';
    }
}

// Render folder list
function renderFolders() {
    if (folders.length === 0) {
        folderListElement.innerHTML = '<p class="empty-message">No folders found</p>';
        return;
    }

    folderListElement.innerHTML = '';

    folders.forEach(folder => {
        const folderItem = document.createElement('div');
        folderItem.className = 'list-item';
        folderItem.textContent = folder;

        if (folder === selectedFolder) {
            folderItem.classList.add('active');
        }

        folderItem.addEventListener('click', () => selectFolder(folder));
        folderListElement.appendChild(folderItem);
    });
}

// Select a folder and load its PDFs
async function selectFolder(folderName) {
    selectedFolder = folderName;
    renderFolders(); // Update active state

    try {
        const response = await fetch(`/api/folders/${encodeURIComponent(folderName)}/pdfs`);
        const data = await response.json();
        currentPdfs = data.pdfs;
        searchQuery = '';
        searchInput.value = '';
        filterPdfs();
    } catch (error) {
        console.error('Error loading PDFs:', error);
        pdfListElement.innerHTML = '<p class="empty-message">Error loading PDFs</p>';
    }
}

// Filter PDFs based on search query
function filterPdfs() {
    if (!searchQuery) {
        filteredPdfs = [...currentPdfs];
    } else {
        const query = searchQuery.toLowerCase();
        filteredPdfs = currentPdfs.filter(pdf =>
            pdf.toLowerCase().includes(query)
        );
    }
    renderPdfs();
}

// Render PDF list for selected folder
function renderPdfs() {
    if (!selectedFolder) {
        pdfListElement.innerHTML = '<p class="empty-message">Select a folder to view PDFs</p>';
        return;
    }

    if (currentPdfs.length === 0) {
        pdfListElement.innerHTML = '<p class="empty-message">No PDFs in this folder</p>';
        return;
    }

    if (filteredPdfs.length === 0) {
        pdfListElement.innerHTML = '<p class="empty-message">No PDFs match your search</p>';
        return;
    }

    pdfListElement.innerHTML = '';

    filteredPdfs.forEach(pdf => {
        const pdfItem = document.createElement('div');
        pdfItem.className = 'list-item';
        pdfItem.textContent = pdf;
        pdfItem.addEventListener('click', () => viewPdf(selectedFolder, pdf));
        pdfListElement.appendChild(pdfItem);
    });
}

// View a PDF in the main section
function viewPdf(folderName, pdfName) {
    const pdfUrl = `/api/pdf/${encodeURIComponent(folderName)}/${encodeURIComponent(pdfName)}`;

    pdfViewerElement.innerHTML = `
        <iframe src="${pdfUrl}" type="application/pdf"></iframe>
    `;
}

// Poll for updates every 2 seconds
function startPolling() {
    setInterval(async () => {
        const response = await fetch('/api/folders');
        const data = await response.json();

        // Check if folders have changed
        if (JSON.stringify(data.folders.sort()) !== JSON.stringify(folders.sort())) {
            await loadFolders();

            // Reload PDFs if a folder is selected
            if (selectedFolder) {
                await selectFolder(selectedFolder);
            }
        }
    }, 2000);
}

// Show modal
function showModal() {
    folderModal.classList.add('show');
    folderNameInput.value = '';
    folderNameInput.focus();
}

// Hide modal
function hideModal() {
    folderModal.classList.remove('show');
}

// Create new folder
async function createFolder() {
    const folderName = folderNameInput.value.trim();

    if (!folderName) {
        alert('Please enter a folder name');
        return;
    }

    try {
        const response = await fetch('/api/folders', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ folderName })
        });

        const data = await response.json();

        if (response.ok) {
            hideModal();
            await loadFolders();
            selectFolder(data.folderName);
        } else {
            alert(data.error || 'Failed to create folder');
        }
    } catch (error) {
        console.error('Error creating folder:', error);
        alert('Failed to create folder');
    }
}

// Upload PDFs
async function uploadPdfs() {
    if (!selectedFolder) {
        alert('Please select a folder first');
        return;
    }

    const files = pdfFileInput.files;

    if (files.length === 0) {
        return;
    }

    const formData = new FormData();

    for (let i = 0; i < files.length; i++) {
        formData.append('pdfs', files[i]);
    }

    try {
        const response = await fetch(`/api/folders/${encodeURIComponent(selectedFolder)}/upload`, {
            method: 'POST',
            body: formData
        });

        const data = await response.json();

        if (response.ok) {
            pdfFileInput.value = '';
            await selectFolder(selectedFolder);
        } else {
            alert(data.error || 'Failed to upload PDFs');
        }
    } catch (error) {
        console.error('Error uploading PDFs:', error);
        alert('Failed to upload PDFs');
    }
}

// Event listeners
searchInput.addEventListener('input', (e) => {
    searchQuery = e.target.value;
    filterPdfs();
});

newFolderBtn.addEventListener('click', showModal);
cancelFolderBtn.addEventListener('click', hideModal);
createFolderBtn.addEventListener('click', createFolder);

folderNameInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        createFolder();
    }
});

uploadPdfBtn.addEventListener('click', () => {
    if (!selectedFolder) {
        alert('Please select a folder first');
        return;
    }
    pdfFileInput.click();
});

pdfFileInput.addEventListener('change', uploadPdfs);

folderModal.addEventListener('click', (e) => {
    if (e.target === folderModal) {
        hideModal();
    }
});

// Initialize the application
async function init() {
    await loadFolders();
    startPolling();
}

// Start the app when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
