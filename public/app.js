// State management
let selectedFolder = null;
let folders = [];
let currentPdfs = [];
let filteredPdfs = [];
let searchQuery = '';
let renameType = null; // 'folder' or 'pdf'
let renameTarget = null; // name of folder or pdf to rename
let movePdfTarget = null; // name of pdf to move

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

        const folderName = document.createElement('span');
        folderName.className = 'list-item-name';
        folderName.textContent = folder;

        const actions = document.createElement('div');
        actions.className = 'list-item-actions';

        const renameBtn = document.createElement('button');
        renameBtn.className = 'rename-btn';
        renameBtn.textContent = '✏️';
        renameBtn.title = 'Rename folder';
        renameBtn.onclick = (e) => {
            e.stopPropagation();
            showRenameModal('folder', folder);
        };

        const exportBtn = document.createElement('button');
        exportBtn.className = 'export-btn';
        exportBtn.textContent = '📦';
        exportBtn.title = 'Export folder as ZIP';
        exportBtn.onclick = (e) => {
            e.stopPropagation();
            exportFolder(folder);
        };

        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'delete-btn';
        deleteBtn.textContent = '🗑️';
        deleteBtn.title = 'Delete folder';
        deleteBtn.onclick = (e) => {
            e.stopPropagation();
            deleteFolder(folder);
        };

        actions.appendChild(renameBtn);
        actions.appendChild(exportBtn);
        actions.appendChild(deleteBtn);

        if (folder === selectedFolder) {
            folderItem.classList.add('active');
        }

        folderItem.addEventListener('click', () => selectFolder(folder));
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

        const pdfName = document.createElement('span');
        pdfName.className = 'list-item-name';
        pdfName.textContent = pdf;

        const actions = document.createElement('div');
        actions.className = 'list-item-actions';

        const renameBtn = document.createElement('button');
        renameBtn.className = 'rename-btn';
        renameBtn.textContent = '✏️';
        renameBtn.title = 'Rename PDF';
        renameBtn.onclick = (e) => {
            e.stopPropagation();
            showRenameModal('pdf', pdf);
        };

        const moveBtn = document.createElement('button');
        moveBtn.className = 'move-btn';
        moveBtn.textContent = '📁';
        moveBtn.title = 'Move PDF to another folder';
        moveBtn.onclick = (e) => {
            e.stopPropagation();
            showMoveModal(pdf);
        };

        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'delete-btn';
        deleteBtn.textContent = '🗑️';
        deleteBtn.title = 'Delete PDF';
        deleteBtn.onclick = (e) => {
            e.stopPropagation();
            deletePdf(pdf);
        };

        actions.appendChild(renameBtn);
        actions.appendChild(moveBtn);
        actions.appendChild(deleteBtn);

        pdfItem.addEventListener('click', () => viewPdf(selectedFolder, pdf));
        pdfItem.appendChild(pdfName);
        pdfItem.appendChild(actions);
        pdfListElement.appendChild(pdfItem);
    });
}

// View a PDF in the main section
function viewPdf(folderName, pdfName) {
    const pdfUrl = `/api/pdf/${encodeURIComponent(folderName)}/${encodeURIComponent(pdfName)}`;

    pdfViewerElement.innerHTML = `
        <iframe src="${pdfUrl}" type="application/pdf"></iframe>
    `;

    // Show clear button when PDF is loaded
    clearPdfBtn.style.display = 'block';
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

    // Hide clear button
    clearPdfBtn.style.display = 'none';
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
        if (folder !== selectedFolder) {
            const option = document.createElement('option');
            option.value = folder;
            option.textContent = folder;
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

// Trash modal event listeners
trashBtn.addEventListener('click', showTrashModal);
closeTrashBtn.addEventListener('click', hideTrashModal);
emptyTrashBtn.addEventListener('click', emptyTrash);

trashModal.addEventListener('click', (e) => {
    if (e.target === trashModal) {
        hideTrashModal();
    }
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
