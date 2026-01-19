// State management
let selectedFolder = null;
let folders = [];
let currentPdfs = [];
let filteredPdfs = [];
let searchQuery = '';
let renameType = null; // 'folder' or 'pdf'
let renameTarget = null; // name of folder or pdf to rename
let movePdfTarget = null; // name of pdf to move
let currentViewingFolder = null; // currently viewing PDF folder
let currentViewingPdf = null; // currently viewing PDF name
let folderSortPreference = localStorage.getItem('folderSort') || 'name-asc';
let pdfSortPreference = localStorage.getItem('pdfSort') || 'name-asc';

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
const renameModal = document.getElementById('rename-modal');
const renameModalTitle = document.getElementById('rename-modal-title');
const renameInput = document.getElementById('rename-input');
const renameConfirmBtn = document.getElementById('rename-confirm-btn');
const renameCancelBtn = document.getElementById('rename-cancel-btn');
const trashBtn = document.getElementById('trash-btn');
const trashModal = document.getElementById('trash-modal');
const trashList = document.getElementById('trash-list');
const closeTrashBtn = document.getElementById('close-trash-btn');
const emptyTrashBtn = document.getElementById('empty-trash-btn');
const trashCountBadge = document.getElementById('trash-count');
const leftSidebar = document.getElementById('left-sidebar');
const rightSidebar = document.getElementById('right-sidebar');
const leftResizeHandle = document.getElementById('left-resize-handle');
const rightResizeHandle = document.getElementById('right-resize-handle');
const clearPdfBtn = document.getElementById('clear-pdf-btn');
const moveModal = document.getElementById('move-modal');
const movePdfName = document.getElementById('move-pdf-name');
const moveFolderSelect = document.getElementById('move-folder-select');
const moveConfirmBtn = document.getElementById('move-confirm-btn');
const moveCancelBtn = document.getElementById('move-cancel-btn');
const addBookmarkBtn = document.getElementById('add-bookmark-btn');
const viewBookmarksBtn = document.getElementById('view-bookmarks-btn');
const bookmarkModal = document.getElementById('bookmark-modal');
const bookmarkPdfInfo = document.getElementById('bookmark-pdf-info');
const bookmarkPageInput = document.getElementById('bookmark-page-input');
const bookmarkLabelInput = document.getElementById('bookmark-label-input');
const bookmarkSaveBtn = document.getElementById('bookmark-save-btn');
const bookmarkCancelBtn = document.getElementById('bookmark-cancel-btn');
const bookmarksViewModal = document.getElementById('bookmarks-view-modal');
const bookmarksList = document.getElementById('bookmarks-list');
const closeBookmarksBtn = document.getElementById('close-bookmarks-btn');
const folderSortSelect = document.getElementById('folder-sort-select');
const pdfSortSelect = document.getElementById('pdf-sort-select');

// Utility function to format file size
function formatFileSize(bytes) {
    if (bytes === 0) return '0 B';
    if (!bytes) return 'Unknown';

    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

// Sorting functions
function sortItems(items, sortBy) {
    const sorted = [...items];

    switch(sortBy) {
        case 'name-asc':
            return sorted.sort((a, b) => a.name.localeCompare(b.name));
        case 'name-desc':
            return sorted.sort((a, b) => b.name.localeCompare(a.name));
        case 'date-asc':
            return sorted.sort((a, b) => new Date(a.mtime) - new Date(b.mtime));
        case 'date-desc':
            return sorted.sort((a, b) => new Date(b.mtime) - new Date(a.mtime));
        case 'size-asc':
            return sorted.sort((a, b) => a.size - b.size);
        case 'size-desc':
            return sorted.sort((a, b) => b.size - a.size);
        default:
            return sorted;
    }
}

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

    const sortedFolders = sortItems(folders, folderSortPreference);

    sortedFolders.forEach(folder => {
        const folderItem = document.createElement('div');
        folderItem.className = 'list-item';

        const folderName = document.createElement('span');
        folderName.className = 'list-item-name';
        folderName.textContent = folder.name;

        const actions = document.createElement('div');
        actions.className = 'list-item-actions';

        const renameBtn = document.createElement('button');
        renameBtn.className = 'rename-btn';
        renameBtn.textContent = '✏️';
        renameBtn.title = 'Rename folder';
        renameBtn.onclick = (e) => {
            e.stopPropagation();
            showRenameModal('folder', folder.name);
        };

        const exportBtn = document.createElement('button');
        exportBtn.className = 'export-btn';
        exportBtn.textContent = '📦';
        exportBtn.title = 'Export folder as ZIP';
        exportBtn.onclick = (e) => {
            e.stopPropagation();
            exportFolder(folder.name);
        };

        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'delete-btn';
        deleteBtn.textContent = '🗑️';
        deleteBtn.title = 'Delete folder';
        deleteBtn.onclick = (e) => {
            e.stopPropagation();
            deleteFolder(folder.name);
        };

        actions.appendChild(renameBtn);
        actions.appendChild(exportBtn);
        actions.appendChild(deleteBtn);

        if (folder.name === selectedFolder) {
            folderItem.classList.add('active');
        }

        folderItem.addEventListener('click', () => selectFolder(folder.name));
        folderItem.appendChild(folderName);
        folderItem.appendChild(actions);
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
            pdf.name.toLowerCase().includes(query)
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

    const sortedPdfs = sortItems(filteredPdfs, pdfSortPreference);

    sortedPdfs.forEach(pdf => {
        const pdfItem = document.createElement('div');
        pdfItem.className = 'list-item';

        const pdfName = document.createElement('span');
        pdfName.className = 'list-item-name';
        pdfName.textContent = pdf.name;

        // Add metadata display
        const metadata = document.createElement('div');
        metadata.className = 'list-item-metadata';

        const metadataParts = [];
        if (pdf.size) {
            metadataParts.push(formatFileSize(pdf.size));
        }
        if (pdf.pages) {
            metadataParts.push(`${pdf.pages} page${pdf.pages !== 1 ? 's' : ''}`);
        }

        metadata.textContent = metadataParts.join(' • ');

        const actions = document.createElement('div');
        actions.className = 'list-item-actions';

        const renameBtn = document.createElement('button');
        renameBtn.className = 'rename-btn';
        renameBtn.textContent = '✏️';
        renameBtn.title = 'Rename PDF';
        renameBtn.onclick = (e) => {
            e.stopPropagation();
            showRenameModal('pdf', pdf.name);
        };

        const moveBtn = document.createElement('button');
        moveBtn.className = 'move-btn';
        moveBtn.textContent = '📁';
        moveBtn.title = 'Move PDF to another folder';
        moveBtn.onclick = (e) => {
            e.stopPropagation();
            showMoveModal(pdf.name);
        };

        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'delete-btn';
        deleteBtn.textContent = '🗑️';
        deleteBtn.title = 'Delete PDF';
        deleteBtn.onclick = (e) => {
            e.stopPropagation();
            deletePdf(pdf.name);
        };

        actions.appendChild(renameBtn);
        actions.appendChild(moveBtn);
        actions.appendChild(deleteBtn);

        pdfItem.addEventListener('click', () => viewPdf(selectedFolder, pdf.name));
        pdfItem.appendChild(pdfName);
        pdfItem.appendChild(metadata);
        pdfItem.appendChild(actions);
        pdfListElement.appendChild(pdfItem);
    });
}

// View a PDF in the main section
function viewPdf(folderName, pdfName) {
    const pdfUrl = `/api/pdf/${encodeURIComponent(folderName)}/${encodeURIComponent(pdfName)}`;

    pdfViewerElement.innerHTML = `
        <iframe id="pdf-iframe" src="${pdfUrl}" type="application/pdf"></iframe>
    `;

    // Track current viewing PDF
    currentViewingFolder = folderName;
    currentViewingPdf = pdfName;

    // Show toolbar buttons when PDF is loaded
    clearPdfBtn.style.display = 'block';
    addBookmarkBtn.style.display = 'block';
    viewBookmarksBtn.style.display = 'block';
}

// Clear the PDF viewer
function clearPdf() {
    pdfViewerElement.innerHTML = `
        <div class="welcome-message">
            <h1>PDF Folder Manager</h1>
            <p>Select a folder from the left sidebar to view PDFs</p>
            <p>Click on a PDF from the right sidebar to view it here</p>
        </div>
    `;

    // Clear current viewing state
    currentViewingFolder = null;
    currentViewingPdf = null;

    // Hide toolbar buttons
    clearPdfBtn.style.display = 'none';
    addBookmarkBtn.style.display = 'none';
    viewBookmarksBtn.style.display = 'none';
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

// Show rename modal
function showRenameModal(type, name) {
    renameType = type;
    renameTarget = name;

    if (type === 'folder') {
        renameModalTitle.textContent = 'Rename Folder';
        renameInput.placeholder = 'Enter new folder name';
    } else {
        renameModalTitle.textContent = 'Rename PDF';
        renameInput.placeholder = 'Enter new PDF name';
    }

    // Pre-fill with current name (without .pdf extension for PDFs)
    if (type === 'pdf' && name.toLowerCase().endsWith('.pdf')) {
        renameInput.value = name.substring(0, name.length - 4);
    } else {
        renameInput.value = name;
    }

    renameModal.classList.add('show');
    renameInput.focus();
    renameInput.select();
}

// Hide rename modal
function hideRenameModal() {
    renameModal.classList.remove('show');
    renameInput.value = '';
    renameType = null;
    renameTarget = null;
}

// Perform rename
async function performRename() {
    const newName = renameInput.value.trim();

    if (!newName) {
        alert('Please enter a name');
        return;
    }

    if (renameType === 'folder') {
        await renameFolder(renameTarget, newName);
    } else if (renameType === 'pdf') {
        await renamePdf(renameTarget, newName);
    }
}

// Rename folder
async function renameFolder(oldName, newName) {
    try {
        const response = await fetch(`/api/folders/${encodeURIComponent(oldName)}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ newFolderName: newName })
        });

        const data = await response.json();

        if (response.ok) {
            hideRenameModal();
            await loadFolders();

            // If the renamed folder was selected, update selection
            if (selectedFolder === oldName) {
                selectedFolder = data.newFolderName;
                await selectFolder(data.newFolderName);
            }
        } else {
            alert(data.error || 'Failed to rename folder');
        }
    } catch (error) {
        console.error('Error renaming folder:', error);
        alert('Failed to rename folder');
    }
}

// Rename PDF
async function renamePdf(oldName, newName) {
    if (!selectedFolder) {
        alert('No folder selected');
        return;
    }

    try {
        const response = await fetch(`/api/folders/${encodeURIComponent(selectedFolder)}/pdf/${encodeURIComponent(oldName)}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ newPdfName: newName })
        });

        const data = await response.json();

        if (response.ok) {
            hideRenameModal();
            await selectFolder(selectedFolder);
        } else {
            alert(data.error || 'Failed to rename PDF');
        }
    } catch (error) {
        console.error('Error renaming PDF:', error);
        alert('Failed to rename PDF');
    }
}

// Show move PDF modal
function showMoveModal(pdfName) {
    movePdfTarget = pdfName;
    movePdfName.textContent = `Moving: ${pdfName}`;

    // Populate folder dropdown with all folders except the current one
    moveFolderSelect.innerHTML = '<option value="">Select destination folder...</option>';
    folders.forEach(folder => {
        if (folder.name !== selectedFolder) {
            const option = document.createElement('option');
            option.value = folder.name;
            option.textContent = folder.name;
            moveFolderSelect.appendChild(option);
        }
    });

    moveModal.classList.add('show');
    moveFolderSelect.focus();
}

// Hide move PDF modal
function hideMoveModal() {
    moveModal.classList.remove('show');
    moveFolderSelect.value = '';
    movePdfTarget = null;
}

// Perform PDF move
async function performMovePdf() {
    const destinationFolder = moveFolderSelect.value;

    if (!destinationFolder) {
        alert('Please select a destination folder');
        return;
    }

    if (!selectedFolder || !movePdfTarget) {
        alert('Invalid move operation');
        return;
    }

    try {
        const response = await fetch(`/api/folders/${encodeURIComponent(selectedFolder)}/pdf/${encodeURIComponent(movePdfTarget)}/move`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ destinationFolderName: destinationFolder })
        });

        const data = await response.json();

        if (response.ok) {
            hideMoveModal();
            await selectFolder(selectedFolder);
            alert(`PDF moved to "${destinationFolder}" successfully`);
        } else {
            alert(data.error || 'Failed to move PDF');
        }
    } catch (error) {
        console.error('Error moving PDF:', error);
        alert('Failed to move PDF');
    }
}

// Export folder as ZIP
function exportFolder(folderName) {
    // Create download link and trigger download
    const downloadUrl = `/api/folders/${encodeURIComponent(folderName)}/export`;

    // Create a temporary anchor element to trigger download
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = `${folderName}.zip`;
    link.style.display = 'none';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    console.log(`Exporting folder: ${folderName}`);
}

// Delete folder with confirmation
async function deleteFolder(folderName) {
    try {
        // Get PDF count for the folder
        const response = await fetch(`/api/folders/${encodeURIComponent(folderName)}/pdfs`);
        const data = await response.json();
        const pdfCount = data.pdfs ? data.pdfs.length : 0;

        let confirmMessage = `Are you sure you want to delete the folder "${folderName}"?`;
        if (pdfCount > 0) {
            confirmMessage = `⚠️ Warning: Deleting the folder "${folderName}" will permanently delete all ${pdfCount} PDF(s) inside it.\n\nThis action cannot be undone. Are you sure you want to continue?`;
        }

        if (!confirm(confirmMessage)) {
            return;
        }
    } catch (error) {
        console.error('Error checking folder contents:', error);
        if (!confirm(`Are you sure you want to delete the folder "${folderName}"?\n\n⚠️ Warning: This will delete all PDFs inside the folder.\n\nThis action cannot be undone.`)) {
            return;
        }
    }

    try {
        const response = await fetch(`/api/folders/${encodeURIComponent(folderName)}`, {
            method: 'DELETE'
        });

        const data = await response.json();

        if (response.ok) {
            // If deleted folder was selected, clear selection
            if (selectedFolder === folderName) {
                selectedFolder = null;
                pdfListElement.innerHTML = '<p class="empty-message">Select a folder to view PDFs</p>';
                clearPdf();
            }
            await loadFolders();
            await loadTrash(); // Update trash count
        } else {
            alert(data.error || 'Failed to delete folder');
        }
    } catch (error) {
        console.error('Error deleting folder:', error);
        alert('Failed to delete folder');
    }
}

// Delete PDF with confirmation
async function deletePdf(pdfName) {
    if (!selectedFolder) {
        alert('No folder selected');
        return;
    }

    if (!confirm(`Are you sure you want to delete "${pdfName}"?\n\nThis action cannot be undone.`)) {
        return;
    }

    try {
        const response = await fetch(`/api/folders/${encodeURIComponent(selectedFolder)}/pdf/${encodeURIComponent(pdfName)}`, {
            method: 'DELETE'
        });

        const data = await response.json();

        if (response.ok) {
            await selectFolder(selectedFolder);
            await loadTrash(); // Update trash count

            // Clear PDF viewer if the deleted PDF was being viewed
            clearPdf();
        } else {
            alert(data.error || 'Failed to delete PDF');
        }
    } catch (error) {
        console.error('Error deleting PDF:', error);
        alert('Failed to delete PDF');
    }
}

// Load trash items
async function loadTrash() {
    try {
        const response = await fetch('/api/trash');
        const data = await response.json();
        updateTrashCount(data.items.length);
        return data.items;
    } catch (error) {
        console.error('Error loading trash:', error);
        return [];
    }
}

// Update trash count badge
function updateTrashCount(count) {
    if (count > 0) {
        trashCountBadge.textContent = count;
    } else {
        trashCountBadge.textContent = '';
    }
}

// Show trash modal
async function showTrashModal() {
    const items = await loadTrash();
    renderTrash(items);
    trashModal.classList.add('show');
}

// Hide trash modal
function hideTrashModal() {
    trashModal.classList.remove('show');
}

// Render trash items
function renderTrash(items) {
    if (items.length === 0) {
        trashList.innerHTML = '<p class="empty-message">Trash is empty</p>';
        return;
    }

    trashList.innerHTML = '';

    items.forEach(item => {
        const trashItem = document.createElement('div');
        trashItem.className = 'trash-item';

        const itemInfo = document.createElement('div');
        itemInfo.className = 'trash-item-info';

        const itemName = document.createElement('span');
        itemName.className = 'trash-item-name';
        itemName.textContent = item.type === 'folder' ? `📁 ${item.name}` : `📄 ${item.name}`;

        const itemMeta = document.createElement('div');
        itemMeta.className = 'trash-item-meta';
        const deletedDate = new Date(item.deletedAt);
        itemMeta.textContent = `${item.type} • Deleted ${deletedDate.toLocaleString()}`;
        if (item.folderName) {
            itemMeta.textContent += ` • From: ${item.folderName}`;
        }

        itemInfo.appendChild(itemName);
        itemInfo.appendChild(itemMeta);

        const actions = document.createElement('div');
        actions.className = 'trash-item-actions';

        const restoreBtn = document.createElement('button');
        restoreBtn.className = 'btn btn-success';
        restoreBtn.textContent = 'Restore';
        restoreBtn.onclick = () => restoreItem(item.id);

        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'btn btn-danger';
        deleteBtn.textContent = 'Delete';
        deleteBtn.onclick = () => permanentlyDeleteItem(item.id, item.name);

        actions.appendChild(restoreBtn);
        actions.appendChild(deleteBtn);

        trashItem.appendChild(itemInfo);
        trashItem.appendChild(actions);
        trashList.appendChild(trashItem);
    });
}

// Restore item from trash
async function restoreItem(id) {
    try {
        const response = await fetch(`/api/trash/${id}/restore`, {
            method: 'POST'
        });

        const data = await response.json();

        if (response.ok) {
            const items = await loadTrash();
            renderTrash(items);
            await loadFolders();
            if (selectedFolder) {
                await selectFolder(selectedFolder);
            }
        } else {
            alert(data.error || 'Failed to restore item');
        }
    } catch (error) {
        console.error('Error restoring item:', error);
        alert('Failed to restore item');
    }
}

// Permanently delete item from trash
async function permanentlyDeleteItem(id, name) {
    if (!confirm(`Permanently delete "${name}"?\n\nThis action cannot be undone and the item will be removed forever.`)) {
        return;
    }

    try {
        const response = await fetch(`/api/trash/${id}`, {
            method: 'DELETE'
        });

        const data = await response.json();

        if (response.ok) {
            const items = await loadTrash();
            renderTrash(items);
        } else {
            alert(data.error || 'Failed to delete item');
        }
    } catch (error) {
        console.error('Error deleting item:', error);
        alert('Failed to delete item');
    }
}

// Empty trash
async function emptyTrash() {
    const count = trashCountBadge.textContent || '0';
    if (!confirm(`Empty trash and permanently delete ${count} item(s)?\n\nThis action cannot be undone and all items will be removed forever.`)) {
        return;
    }

    try {
        const response = await fetch('/api/trash/empty/all', {
            method: 'DELETE'
        });

        const data = await response.json();

        if (response.ok) {
            const items = await loadTrash();
            renderTrash(items);
        } else {
            alert(data.error || 'Failed to empty trash');
        }
    } catch (error) {
        console.error('Error emptying trash:', error);
        alert('Failed to empty trash');
    }
}

// Show add bookmark modal
function showAddBookmarkModal() {
    if (!currentViewingFolder || !currentViewingPdf) {
        alert('No PDF is currently being viewed');
        return;
    }

    bookmarkPdfInfo.textContent = `PDF: ${currentViewingPdf}`;
    bookmarkPageInput.value = '';
    bookmarkLabelInput.value = '';

    bookmarkModal.classList.add('show');
    bookmarkPageInput.focus();
}

// Hide add bookmark modal
function hideAddBookmarkModal() {
    bookmarkModal.classList.remove('show');
    bookmarkPageInput.value = '';
    bookmarkLabelInput.value = '';
}

// Save bookmark
async function saveBookmark() {
    const pageNumber = parseInt(bookmarkPageInput.value);
    const label = bookmarkLabelInput.value.trim();

    if (!pageNumber || pageNumber < 1) {
        alert('Please enter a valid page number');
        return;
    }

    if (!currentViewingFolder || !currentViewingPdf) {
        alert('No PDF is currently being viewed');
        return;
    }

    try {
        const response = await fetch('/api/bookmarks', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                folderName: currentViewingFolder,
                pdfName: currentViewingPdf,
                pageNumber: pageNumber,
                label: label || `Page ${pageNumber}`
            })
        });

        const data = await response.json();

        if (response.ok) {
            hideAddBookmarkModal();
            alert(`Bookmark added for page ${pageNumber}`);
        } else {
            alert(data.error || 'Failed to add bookmark');
        }
    } catch (error) {
        console.error('Error adding bookmark:', error);
        alert('Failed to add bookmark');
    }
}

// Show bookmarks view modal
async function showBookmarksViewModal() {
    await loadAndRenderBookmarks();
    bookmarksViewModal.classList.add('show');
}

// Hide bookmarks view modal
function hideBookmarksViewModal() {
    bookmarksViewModal.classList.remove('show');
}

// Load and render all bookmarks
async function loadAndRenderBookmarks() {
    try {
        const response = await fetch('/api/bookmarks');
        const data = await response.json();
        renderBookmarks(data.bookmarks);
    } catch (error) {
        console.error('Error loading bookmarks:', error);
        bookmarksList.innerHTML = '<p class="empty-message">Error loading bookmarks</p>';
    }
}

// Render bookmarks list
function renderBookmarks(bookmarks) {
    if (bookmarks.length === 0) {
        bookmarksList.innerHTML = '<p class="empty-message">No bookmarks yet</p>';
        return;
    }

    bookmarksList.innerHTML = '';

    // Group bookmarks by folder and PDF
    const grouped = {};
    bookmarks.forEach(bookmark => {
        const key = `${bookmark.folderName}/${bookmark.pdfName}`;
        if (!grouped[key]) {
            grouped[key] = {
                folderName: bookmark.folderName,
                pdfName: bookmark.pdfName,
                bookmarks: []
            };
        }
        grouped[key].bookmarks.push(bookmark);
    });

    // Render grouped bookmarks
    Object.values(grouped).forEach(group => {
        const groupDiv = document.createElement('div');
        groupDiv.className = 'bookmark-group';

        const groupHeader = document.createElement('div');
        groupHeader.className = 'bookmark-group-header';
        groupHeader.textContent = `📁 ${group.folderName} / 📄 ${group.pdfName}`;
        groupDiv.appendChild(groupHeader);

        group.bookmarks.forEach(bookmark => {
            const bookmarkItem = document.createElement('div');
            bookmarkItem.className = 'trash-item';

            const itemInfo = document.createElement('div');
            itemInfo.className = 'trash-item-info';

            const itemName = document.createElement('span');
            itemName.className = 'trash-item-name';
            itemName.textContent = `${bookmark.label}`;

            const itemMeta = document.createElement('div');
            itemMeta.className = 'trash-item-meta';
            itemMeta.textContent = `Page ${bookmark.pageNumber} • Created ${new Date(bookmark.createdAt).toLocaleString()}`;

            itemInfo.appendChild(itemName);
            itemInfo.appendChild(itemMeta);

            const actions = document.createElement('div');
            actions.className = 'trash-item-actions';

            const jumpBtn = document.createElement('button');
            jumpBtn.className = 'btn btn-primary';
            jumpBtn.textContent = 'Jump to Page';
            jumpBtn.onclick = () => jumpToBookmark(bookmark);

            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'btn btn-danger';
            deleteBtn.textContent = 'Delete';
            deleteBtn.onclick = () => deleteBookmark(bookmark.id);

            actions.appendChild(jumpBtn);
            actions.appendChild(deleteBtn);

            bookmarkItem.appendChild(itemInfo);
            bookmarkItem.appendChild(actions);
            groupDiv.appendChild(bookmarkItem);
        });

        bookmarksList.appendChild(groupDiv);
    });
}

// Jump to bookmark (open PDF at specific page)
function jumpToBookmark(bookmark) {
    // Select the folder if not already selected
    if (selectedFolder !== bookmark.folderName) {
        selectFolder(bookmark.folderName);
    }

    // View the PDF with page parameter
    const pdfUrl = `/api/pdf/${encodeURIComponent(bookmark.folderName)}/${encodeURIComponent(bookmark.pdfName)}#page=${bookmark.pageNumber}`;

    pdfViewerElement.innerHTML = `
        <iframe id="pdf-iframe" src="${pdfUrl}" type="application/pdf"></iframe>
    `;

    // Track current viewing PDF
    currentViewingFolder = bookmark.folderName;
    currentViewingPdf = bookmark.pdfName;

    // Show toolbar buttons
    clearPdfBtn.style.display = 'block';
    addBookmarkBtn.style.display = 'block';
    viewBookmarksBtn.style.display = 'block';

    // Close the bookmarks modal
    hideBookmarksViewModal();
}

// Delete bookmark
async function deleteBookmark(bookmarkId) {
    if (!confirm('Are you sure you want to delete this bookmark?')) {
        return;
    }

    try {
        const response = await fetch(`/api/bookmarks/${bookmarkId}`, {
            method: 'DELETE'
        });

        const data = await response.json();

        if (response.ok) {
            await loadAndRenderBookmarks();
        } else {
            alert(data.error || 'Failed to delete bookmark');
        }
    } catch (error) {
        console.error('Error deleting bookmark:', error);
        alert('Failed to delete bookmark');
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

clearPdfBtn.addEventListener('click', clearPdf);

folderModal.addEventListener('click', (e) => {
    if (e.target === folderModal) {
        hideModal();
    }
});

// Rename modal event listeners
renameCancelBtn.addEventListener('click', hideRenameModal);
renameConfirmBtn.addEventListener('click', performRename);

renameInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        performRename();
    }
});

renameModal.addEventListener('click', (e) => {
    if (e.target === renameModal) {
        hideRenameModal();
    }
});

// Move modal event listeners
moveCancelBtn.addEventListener('click', hideMoveModal);
moveConfirmBtn.addEventListener('click', performMovePdf);

moveModal.addEventListener('click', (e) => {
    if (e.target === moveModal) {
        hideMoveModal();
    }
});

// Bookmark modal event listeners
addBookmarkBtn.addEventListener('click', showAddBookmarkModal);
bookmarkCancelBtn.addEventListener('click', hideAddBookmarkModal);
bookmarkSaveBtn.addEventListener('click', saveBookmark);

bookmarkModal.addEventListener('click', (e) => {
    if (e.target === bookmarkModal) {
        hideAddBookmarkModal();
    }
});

// Bookmarks view modal event listeners
viewBookmarksBtn.addEventListener('click', showBookmarksViewModal);
closeBookmarksBtn.addEventListener('click', hideBookmarksViewModal);

bookmarksViewModal.addEventListener('click', (e) => {
    if (e.target === bookmarksViewModal) {
        hideBookmarksViewModal();
    }
});

// Trash modal event listeners
trashBtn.addEventListener('click', showTrashModal);
closeTrashBtn.addEventListener('click', hideTrashModal);
emptyTrashBtn.addEventListener('click', emptyTrash);

trashModal.addEventListener('click', (e) => {
    if (e.target === trashModal) {
        hideTrashModal();
    }
});

// Sort event listeners
folderSortSelect.value = folderSortPreference;
pdfSortSelect.value = pdfSortPreference;

folderSortSelect.addEventListener('change', (e) => {
    folderSortPreference = e.target.value;
    localStorage.setItem('folderSort', folderSortPreference);
    renderFolders();
});

pdfSortSelect.addEventListener('change', (e) => {
    pdfSortPreference = e.target.value;
    localStorage.setItem('pdfSort', pdfSortPreference);
    renderPdfs();
});

// Sidebar resize functionality
let isResizingLeft = false;
let isResizingRight = false;

leftResizeHandle.addEventListener('mousedown', (e) => {
    isResizingLeft = true;
    document.body.style.cursor = 'col-resize';
    e.preventDefault();
});

rightResizeHandle.addEventListener('mousedown', (e) => {
    isResizingRight = true;
    document.body.style.cursor = 'col-resize';
    e.preventDefault();
});

document.addEventListener('mousemove', (e) => {
    if (isResizingLeft) {
        const newWidth = e.clientX;
        if (newWidth >= 150 && newWidth <= 600) {
            leftSidebar.style.width = newWidth + 'px';
        }
    } else if (isResizingRight) {
        const newWidth = window.innerWidth - e.clientX;
        if (newWidth >= 150 && newWidth <= 600) {
            rightSidebar.style.width = newWidth + 'px';
        }
    }
});

document.addEventListener('mouseup', () => {
    if (isResizingLeft || isResizingRight) {
        isResizingLeft = false;
        isResizingRight = false;
        document.body.style.cursor = 'default';
    }
});

// Initialize the application
async function init() {
    await loadFolders();
    await loadTrash(); // Load trash count on startup
    startPolling();
}

// Start the app when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
