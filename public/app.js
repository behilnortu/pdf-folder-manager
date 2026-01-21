// State management
let selectedFolder = null;
let folders = [];
let currentPdfs = [];
let filteredPdfs = [];
let searchQuery = '';
let isGlobalSearch = false;
let foldersWithResults = new Set(); // Folders that have matching PDFs in global search
let renameType = null; // 'folder' or 'pdf'
let renameTarget = null; // name of folder or pdf to rename
let movePdfTarget = null; // name of pdf to move
let currentViewingFolder = null; // currently viewing PDF folder
let currentViewingPdf = null; // currently viewing PDF name
let folderSortPreference = localStorage.getItem('folderSort') || 'name-asc';
let pdfSortPreference = localStorage.getItem('pdfSort') || 'name-asc';
let headings = []; // folder headings/groups
let headingToRename = null; // heading being renamed
let selectedPdfs = new Map(); // Map<"folder::pdf", {folderName, pdfName}> for bulk operations
let bulkMode = false; // Toggle for checkbox visibility in bulk selection mode

// DOM elements
const folderListElement = document.getElementById('folder-list');
const pdfListElement = document.getElementById('pdf-list');
const pdfViewerElement = document.getElementById('pdf-viewer');
/** @type {HTMLInputElement} */
const searchInput = /** @type {HTMLInputElement} */ (document.getElementById('search-input'));
const newFolderBtn = document.getElementById('new-folder-btn');
const uploadPdfBtn = document.getElementById('upload-pdf-btn');
/** @type {HTMLInputElement} */
const pdfFileInput = /** @type {HTMLInputElement} */ (document.getElementById('pdf-file-input'));
const folderModal = document.getElementById('folder-modal');
/** @type {HTMLInputElement} */
const folderNameInput = /** @type {HTMLInputElement} */ (document.getElementById('folder-name-input'));
const createFolderBtn = document.getElementById('create-folder-btn');
const cancelFolderBtn = document.getElementById('cancel-folder-btn');
const renameModal = document.getElementById('rename-modal');
const renameModalTitle = document.getElementById('rename-modal-title');
/** @type {HTMLInputElement} */
const renameInput = /** @type {HTMLInputElement} */ (document.getElementById('rename-input'));
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
const downloadPdfBtn = document.getElementById('download-pdf-btn');
const moveModal = document.getElementById('move-modal');
const movePdfName = document.getElementById('move-pdf-name');
/** @type {HTMLSelectElement} */
const moveFolderSelect = /** @type {HTMLSelectElement} */ (document.getElementById('move-folder-select'));
const moveConfirmBtn = document.getElementById('move-confirm-btn');
const moveCancelBtn = document.getElementById('move-cancel-btn');
const addBookmarkBtn = document.getElementById('add-bookmark-btn');
const viewBookmarksBtn = document.getElementById('view-bookmarks-btn');
const bookmarkModal = document.getElementById('bookmark-modal');
const bookmarkPdfInfo = document.getElementById('bookmark-pdf-info');
/** @type {HTMLInputElement} */
const bookmarkPageInput = /** @type {HTMLInputElement} */ (document.getElementById('bookmark-page-input'));
/** @type {HTMLInputElement} */
const bookmarkLabelInput = /** @type {HTMLInputElement} */ (document.getElementById('bookmark-label-input'));
const bookmarkSaveBtn = document.getElementById('bookmark-save-btn');
const bookmarkCancelBtn = document.getElementById('bookmark-cancel-btn');
const bookmarksViewModal = document.getElementById('bookmarks-view-modal');
const bookmarksList = document.getElementById('bookmarks-list');
const closeBookmarksBtn = document.getElementById('close-bookmarks-btn');
/** @type {HTMLSelectElement} */
const folderSortSelect = /** @type {HTMLSelectElement} */ (document.getElementById('folder-sort-select'));
/** @type {HTMLSelectElement} */
const pdfSortSelect = /** @type {HTMLSelectElement} */ (document.getElementById('pdf-sort-select'));
/** @type {HTMLInputElement} */
const globalSearchCheckbox = /** @type {HTMLInputElement} */ (document.getElementById('global-search-checkbox'));
const notesBtn = document.getElementById('notes-btn');
const notesModal = document.getElementById('notes-modal');
const notesPdfInfo = document.getElementById('notes-pdf-info');
/** @type {HTMLTextAreaElement} */
const notesTextarea = /** @type {HTMLTextAreaElement} */ (document.getElementById('notes-textarea'));
const notesSaveBtn = document.getElementById('notes-save-btn');
const notesCancelBtn = document.getElementById('notes-cancel-btn');
const themeToggleBtn = document.getElementById('theme-toggle-btn');
const themeIcon = document.querySelector('.theme-icon');
const newHeadingBtn = document.getElementById('new-heading-btn');
const headingModal = document.getElementById('heading-modal');
/** @type {HTMLInputElement} */
const headingNameInput = /** @type {HTMLInputElement} */ (document.getElementById('heading-name-input'));
const createHeadingBtn = document.getElementById('create-heading-btn');
const cancelHeadingBtn = document.getElementById('cancel-heading-btn');
const assignFolderModal = document.getElementById('assign-folder-modal');
const assignFolderName = document.getElementById('assign-folder-name');
/** @type {HTMLSelectElement} */
const assignHeadingSelect = /** @type {HTMLSelectElement} */ (document.getElementById('assign-heading-select'));
const assignConfirmBtn = document.getElementById('assign-confirm-btn');
const assignCancelBtn = document.getElementById('assign-cancel-btn');
let folderToAssign = null; // folder name to assign to heading
const bulkSelectBtn = document.getElementById('bulk-select-btn');
const bulkToolbar = document.getElementById('bulk-toolbar');
const bulkCount = document.getElementById('bulk-count');
const clearSelectionBtn = document.getElementById('clear-selection-btn');
const bulkRenameBtn = document.getElementById('bulk-rename-btn');
const bulkDuplicateBtn = document.getElementById('bulk-duplicate-btn');
const bulkMoveBtn = document.getElementById('bulk-move-btn');
const bulkDeleteBtn = document.getElementById('bulk-delete-btn');
const bulkRenameModal = document.getElementById('bulk-rename-modal');
const bulkRenameCount = document.getElementById('bulk-rename-count');
/** @type {HTMLInputElement} */
const bulkPrefixInput = /** @type {HTMLInputElement} */ (document.getElementById('bulk-prefix-input'));
/** @type {HTMLInputElement} */
const bulkSuffixInput = /** @type {HTMLInputElement} */ (document.getElementById('bulk-suffix-input'));
const bulkRenamePreview = document.getElementById('bulk-rename-preview');
const bulkRenameConfirmBtn = document.getElementById('bulk-rename-confirm-btn');
const bulkRenameCancelBtn = document.getElementById('bulk-rename-cancel-btn');
const bulkDeleteModal = document.getElementById('bulk-delete-modal');
const bulkDeleteCount = document.getElementById('bulk-delete-count');
const bulkDeleteList = document.getElementById('bulk-delete-list');
const bulkDeleteConfirmBtn = document.getElementById('bulk-delete-confirm-btn');
const bulkDeleteCancelBtn = document.getElementById('bulk-delete-cancel-btn');

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
            return sorted.sort((a, b) => new Date(a.mtime).getTime() - new Date(b.mtime).getTime());
        case 'date-desc':
            return sorted.sort((a, b) => new Date(b.mtime).getTime() - new Date(a.mtime).getTime());
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
        await loadHeadings(); // Load headings too
        renderFolders();
    } catch (error) {
        console.error('Error loading folders:', error);
        folderListElement.innerHTML = '<p class="empty-message">Error loading folders</p>';
    }
}

// Load headings from API
async function loadHeadings() {
    try {
        const response = await fetch('/api/headings');
        const data = await response.json();
        headings = data.headings;
    } catch (error) {
        console.error('Error loading headings:', error);
        headings = [];
    }
}

// Helper function to render a single folder item
function renderFolderItem(folder, isUnderHeading = false) {
    const folderItem = document.createElement('div');
    folderItem.className = 'list-item';
    if (isUnderHeading) {
        folderItem.classList.add('folder-item-indented');
    }

    const folderName = document.createElement('span');
    folderName.className = 'list-item-name';
    folderName.textContent = folder.name;

    const actions = document.createElement('div');
    actions.className = 'list-item-actions';

    // Unassign button (only show if folder is under a heading)
    if (isUnderHeading) {
        const unassignBtn = document.createElement('button');
        unassignBtn.className = 'unassign-btn';
        unassignBtn.textContent = '↑';
        unassignBtn.title = 'Remove from heading';
        unassignBtn.onclick = (e) => {
            e.stopPropagation();
            unassignFolder(folder.name);
        };
        actions.appendChild(unassignBtn);
    }

    // Assign button (only show if folder is NOT under a heading and there are headings)
    if (!isUnderHeading && headings.length > 0) {
        const assignBtn = document.createElement('button');
        assignBtn.className = 'assign-btn';
        assignBtn.textContent = '📁';
        assignBtn.title = 'Assign to heading';
        assignBtn.onclick = (e) => {
            e.stopPropagation();
            showAssignFolderModal(folder.name);
        };
        actions.appendChild(assignBtn);
    }

    const renameBtn = document.createElement('button');
    renameBtn.className = 'rename-btn';
    renameBtn.textContent = '✏️';
    renameBtn.title = 'Rename folder';
    renameBtn.onclick = (e) => {
        e.stopPropagation();
        showRenameModal('folder', folder.name);
    };

    const duplicateBtn = document.createElement('button');
    duplicateBtn.className = 'duplicate-btn';
    duplicateBtn.textContent = '📋';
    duplicateBtn.title = 'Duplicate folder';
    duplicateBtn.onclick = (e) => {
        e.stopPropagation();
        duplicateFolder(folder.name);
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
    actions.appendChild(duplicateBtn);
    actions.appendChild(exportBtn);
    actions.appendChild(deleteBtn);

    // In global search mode, highlight folders with matching results
    // In normal mode, highlight only the selected folder
    if (isGlobalSearch) {
        if (foldersWithResults.has(folder.name)) {
            folderItem.classList.add('active');
        }
    } else {
        if (folder.name === selectedFolder) {
            folderItem.classList.add('active');
        }
    }

    folderItem.addEventListener('click', () => selectFolder(folder.name));
    folderItem.appendChild(folderName);
    folderItem.appendChild(actions);

    return folderItem;
}

// Render folder list with headings
function renderFolders() {
    if (folders.length === 0) {
        folderListElement.innerHTML = '<p class="empty-message">No folders found</p>';
        return;
    }

    folderListElement.innerHTML = '';

    const sortedFolders = sortItems(folders, folderSortPreference);

    // Get all folder names that are assigned to headings
    const assignedFolders = new Set();
    headings.forEach(heading => {
        heading.folders.forEach(folderName => {
            assignedFolders.add(folderName);
        });
    });

    // Render headings with their folders
    headings.forEach(heading => {
        // Heading element
        const headingItem = document.createElement('div');
        headingItem.className = 'heading-item';

        const headingContent = document.createElement('div');
        headingContent.className = 'heading-content';

        const collapseIcon = document.createElement('span');
        collapseIcon.className = 'collapse-icon';
        collapseIcon.textContent = heading.expanded ? '▼' : '▶';

        const headingName = document.createElement('span');
        headingName.className = 'heading-name';
        headingName.textContent = heading.name;

        headingContent.appendChild(collapseIcon);
        headingContent.appendChild(headingName);

        const headingActions = document.createElement('div');
        headingActions.className = 'heading-actions';

        const renameBtn = document.createElement('button');
        renameBtn.className = 'rename-btn';
        renameBtn.textContent = '✏️';
        renameBtn.title = 'Rename heading';
        renameBtn.onclick = (e) => {
            e.stopPropagation();
            showRenameHeadingModal(heading.id, heading.name);
        };

        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'delete-btn';
        deleteBtn.textContent = '🗑️';
        deleteBtn.title = 'Delete heading';
        deleteBtn.onclick = (e) => {
            e.stopPropagation();
            deleteHeading(heading.id);
        };

        headingActions.appendChild(renameBtn);
        headingActions.appendChild(deleteBtn);

        headingContent.appendChild(headingActions);
        headingContent.onclick = (e) => {
            // Don't toggle if clicking on action buttons
            if (!e.target.closest('.heading-actions')) {
                toggleHeading(heading.id);
            }
        };

        headingItem.appendChild(headingContent);
        folderListElement.appendChild(headingItem);

        // Render folders under this heading (if expanded)
        if (heading.expanded) {
            heading.folders.forEach(folderName => {
                const folder = sortedFolders.find(f => f.name === folderName);
                if (folder) {
                    folderListElement.appendChild(renderFolderItem(folder, true));
                }
            });
        }
    });

    // Render uncategorized folders
    const uncategorizedFolders = sortedFolders.filter(folder => !assignedFolders.has(folder.name));
    if (uncategorizedFolders.length > 0) {
        // Add divider if there are headings above
        if (headings.length > 0) {
            const divider = document.createElement('div');
            divider.className = 'folder-divider';
            folderListElement.appendChild(divider);
        }

        uncategorizedFolders.forEach(folder => {
            folderListElement.appendChild(renderFolderItem(folder, false));
        });
    }
}

// Select a folder and load its PDFs
async function selectFolder(folderName) {
    selectedFolder = folderName;

    // Clear bulk selections when switching folders
    if (selectedPdfs.size > 0) {
        clearSelection();
    }

    // Turn off global search when selecting a folder
    if (isGlobalSearch) {
        isGlobalSearch = false;
        globalSearchCheckbox.checked = false;
        foldersWithResults.clear();
    }

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
    if (isGlobalSearch) {
        // Search across all folders
        foldersWithResults.clear();

        if (!searchQuery) {
            filteredPdfs = [];
        } else {
            const query = searchQuery.toLowerCase();
            filteredPdfs = [];

            folders.forEach(folder => {
                let folderHasResults = false;
                folder.pdfs.forEach(pdf => {
                    if (pdf.name.toLowerCase().includes(query)) {
                        filteredPdfs.push({
                            ...pdf,
                            folderName: folder.name
                        });
                        folderHasResults = true;
                    }
                });

                if (folderHasResults) {
                    foldersWithResults.add(folder.name);
                }
            });
        }

        // Re-render folders to show highlights
        renderFolders();
    } else {
        // Search within current folder only
        foldersWithResults.clear();

        if (!searchQuery) {
            filteredPdfs = [...currentPdfs];
        } else {
            const query = searchQuery.toLowerCase();
            filteredPdfs = currentPdfs.filter(pdf =>
                pdf.name.toLowerCase().includes(query)
            );
        }

        // Re-render folders to clear highlights
        renderFolders();
    }
    renderPdfs();
}

// Render PDF list for selected folder
function renderPdfs() {
    // In global search mode, show results even without a selected folder
    if (!isGlobalSearch && !selectedFolder) {
        pdfListElement.innerHTML = '<p class="empty-message">Select a folder to view PDFs</p>';
        return;
    }

    // In global search, show prompt if no search query
    if (isGlobalSearch && !searchQuery) {
        pdfListElement.innerHTML = '<p class="empty-message">Enter a search term to search all folders</p>';
        return;
    }

    if (!isGlobalSearch && currentPdfs.length === 0) {
        pdfListElement.innerHTML = '<p class="empty-message">No PDFs in this folder</p>';
        return;
    }

    if (filteredPdfs.length === 0) {
        const message = isGlobalSearch ? 'No PDFs found across all folders' : 'No PDFs match your search';
        pdfListElement.innerHTML = `<p class="empty-message">${message}</p>`;
        return;
    }

    pdfListElement.innerHTML = '';

    const sortedPdfs = sortItems(filteredPdfs, pdfSortPreference);

    sortedPdfs.forEach(pdf => {
        const pdfItem = document.createElement('div');
        pdfItem.className = 'list-item';

        // Use the correct folder for this PDF
        const pdfFolder = pdf.folderName || selectedFolder;
        const selectionKey = `${pdfFolder}::${pdf.name}`;

        // Add checkbox if in bulk mode
        if (bulkMode) {
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.className = 'pdf-checkbox';
            checkbox.checked = selectedPdfs.has(selectionKey);
            checkbox.onclick = (e) => {
                e.stopPropagation();
                togglePdfSelection(pdfFolder, pdf.name);
            };
            pdfItem.appendChild(checkbox);
        }

        // Add selected class if this PDF is selected
        if (selectedPdfs.has(selectionKey)) {
            pdfItem.classList.add('selected');
        }

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

        // Add folder name if in global search mode
        if (isGlobalSearch && pdf.folderName) {
            const folderLabel = document.createElement('div');
            folderLabel.className = 'list-item-folder';
            folderLabel.textContent = `📁 ${pdf.folderName}`;
            pdfItem.appendChild(pdfName);
            pdfItem.appendChild(folderLabel);
            pdfItem.appendChild(metadata);
        } else {
            pdfItem.appendChild(pdfName);
            pdfItem.appendChild(metadata);
        }

        const actions = document.createElement('div');
        actions.className = 'list-item-actions';

        const renameBtn = document.createElement('button');
        renameBtn.className = 'rename-btn';
        renameBtn.textContent = '✏️';
        renameBtn.title = 'Rename PDF';
        renameBtn.onclick = (e) => {
            e.stopPropagation();
            // For global search, temporarily select the folder
            if (isGlobalSearch && pdf.folderName) {
                selectFolder(pdf.folderName).then(() => {
                    showRenameModal('pdf', pdf.name);
                });
            } else {
                showRenameModal('pdf', pdf.name);
            }
        };

        const duplicateBtn = document.createElement('button');
        duplicateBtn.className = 'duplicate-btn';
        duplicateBtn.textContent = '📋';
        duplicateBtn.title = 'Duplicate PDF';
        duplicateBtn.onclick = (e) => {
            e.stopPropagation();
            if (isGlobalSearch && pdf.folderName) {
                selectFolder(pdf.folderName).then(() => {
                    duplicatePdf(pdf.name);
                });
            } else {
                duplicatePdf(pdf.name);
            }
        };

        const moveBtn = document.createElement('button');
        moveBtn.className = 'move-btn';
        moveBtn.textContent = '📁';
        moveBtn.title = 'Move PDF to another folder';
        moveBtn.onclick = (e) => {
            e.stopPropagation();
            if (isGlobalSearch && pdf.folderName) {
                selectFolder(pdf.folderName).then(() => {
                    showMoveModal(pdf.name);
                });
            } else {
                showMoveModal(pdf.name);
            }
        };

        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'delete-btn';
        deleteBtn.textContent = '🗑️';
        deleteBtn.title = 'Delete PDF';
        deleteBtn.onclick = (e) => {
            e.stopPropagation();
            if (isGlobalSearch && pdf.folderName) {
                selectFolder(pdf.folderName).then(() => {
                    deletePdf(pdf.name);
                });
            } else {
                deletePdf(pdf.name);
            }
        };

        actions.appendChild(renameBtn);
        actions.appendChild(duplicateBtn);
        actions.appendChild(moveBtn);
        actions.appendChild(deleteBtn);

        // Click handler: in bulk mode, toggle selection; otherwise view PDF
        pdfItem.addEventListener('click', () => {
            if (bulkMode) {
                togglePdfSelection(pdfFolder, pdf.name);
            } else {
                viewPdf(pdfFolder, pdf.name);
            }
        });

        pdfItem.appendChild(actions);
        pdfListElement.appendChild(pdfItem);
    });
}

// Toggle bulk selection mode
function toggleBulkMode() {
    bulkMode = !bulkMode;

    if (!bulkMode) {
        // Exiting bulk mode - clear selections
        clearSelection();
    }

    // Update button text
    bulkSelectBtn.textContent = bulkMode ? '✕ Exit Bulk' : '📋 Bulk Select';
    bulkSelectBtn.classList.toggle('btn-secondary', !bulkMode);
    bulkSelectBtn.classList.toggle('btn-danger', bulkMode);

    // Re-render PDFs to show/hide checkboxes
    renderPdfs();
}

// Toggle selection of a single PDF
function togglePdfSelection(folderName, pdfName) {
    const key = `${folderName}::${pdfName}`;

    if (selectedPdfs.has(key)) {
        selectedPdfs.delete(key);
    } else {
        selectedPdfs.set(key, { folderName, pdfName });
    }

    updateBulkToolbar();
    renderPdfs();
}

// Update bulk toolbar visibility and counter
function updateBulkToolbar() {
    const count = selectedPdfs.size;

    if (count > 0) {
        bulkToolbar.style.display = 'block';
        bulkCount.textContent = `${count} selected`;

        // Enable/disable bulk action buttons
        const hasSelection = count > 0;
        bulkRenameBtn.disabled = !hasSelection;
        bulkDuplicateBtn.disabled = !hasSelection;
        bulkMoveBtn.disabled = !hasSelection;
        bulkDeleteBtn.disabled = !hasSelection;
    } else {
        bulkToolbar.style.display = 'none';
    }
}

// Clear all selections
function clearSelection() {
    selectedPdfs.clear();
    updateBulkToolbar();
    renderPdfs();
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
    notesBtn.style.display = 'block';
    downloadPdfBtn.style.display = 'block';
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
    notesBtn.style.display = 'none';
    downloadPdfBtn.style.display = 'none';
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

// Show heading modal
function showHeadingModal() {
    headingModal.classList.add('show');
    headingNameInput.value = '';
    headingNameInput.focus();
}

// Hide heading modal
function hideHeadingModal() {
    headingModal.classList.remove('show');
}

// Create new heading from modal
async function createHeadingFromModal() {
    const headingName = headingNameInput.value.trim();
    if (!headingName) {
        alert('Please enter a heading name');
        return;
    }

    await createHeading(headingName);
    hideHeadingModal();
}

// Show assign folder modal
function showAssignFolderModal(folderName) {
    folderToAssign = folderName;
    assignFolderName.textContent = `Assign "${folderName}" to:`;

    // Populate heading select
    assignHeadingSelect.innerHTML = '<option value="">Select heading...</option>';
    headings.forEach(heading => {
        const option = document.createElement('option');
        option.value = heading.id;
        option.textContent = heading.name;
        assignHeadingSelect.appendChild(option);
    });

    assignFolderModal.classList.add('show');
}

// Hide assign folder modal
function hideAssignFolderModal() {
    assignFolderModal.classList.remove('show');
    folderToAssign = null;
}

// Perform folder assignment
async function performAssignFolder() {
    const headingId = assignHeadingSelect.value;
    if (!headingId) {
        alert('Please select a heading');
        return;
    }

    await assignFolderToHeading(folderToAssign, headingId);
    hideAssignFolderModal();
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
    } else if (renameType === 'heading') {
        await renameHeading(headingToRename, newName);
        hideRenameModal();
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

// Duplicate folder
async function duplicateFolder(folderName) {
    try {
        const response = await fetch(`/api/folders/${encodeURIComponent(folderName)}/duplicate`, {
            method: 'POST'
        });

        const data = await response.json();

        if (response.ok) {
            await loadFolders();
            await selectFolder(data.newFolderName);
        } else {
            alert(data.error || 'Failed to duplicate folder');
        }
    } catch (error) {
        console.error('Error duplicating folder:', error);
        alert('Failed to duplicate folder');
    }
}

// Duplicate PDF
async function duplicatePdf(pdfName) {
    if (!selectedFolder) {
        alert('No folder selected');
        return;
    }

    try {
        const response = await fetch(`/api/folders/${encodeURIComponent(selectedFolder)}/pdf/${encodeURIComponent(pdfName)}/duplicate`, {
            method: 'POST'
        });

        const data = await response.json();

        if (response.ok) {
            await selectFolder(selectedFolder);
        } else {
            alert(data.error || 'Failed to duplicate PDF');
        }
    } catch (error) {
        console.error('Error duplicating PDF:', error);
        alert('Failed to duplicate PDF');
    }
}

// Toggle heading expanded/collapsed
async function toggleHeading(headingId) {
    try {
        const response = await fetch(`/api/headings/${headingId}/toggle`, {
            method: 'PUT'
        });

        if (response.ok) {
            await loadHeadings();
            renderFolders();
        }
    } catch (error) {
        console.error('Error toggling heading:', error);
    }
}

// Create new heading
async function createHeading(name) {
    if (!name || !name.trim()) {
        alert('Please enter a heading name');
        return;
    }

    try {
        const response = await fetch('/api/headings', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ name: name.trim() })
        });

        const data = await response.json();

        if (response.ok) {
            await loadHeadings();
            renderFolders();
        } else {
            alert(data.error || 'Failed to create heading');
        }
    } catch (error) {
        console.error('Error creating heading:', error);
        alert('Failed to create heading');
    }
}

// Show rename heading modal
function showRenameHeadingModal(headingId, currentName) {
    headingToRename = headingId;
    renameModalTitle.textContent = 'Rename Heading';
    renameInput.placeholder = 'Enter new heading name';
    renameInput.value = currentName;

    renameModal.classList.add('show');
    renameInput.focus();
    renameInput.select();

    // Mark that we're renaming a heading, not a folder/pdf
    renameType = 'heading';
}

// Rename heading
async function renameHeading(headingId, newName) {
    if (!newName || !newName.trim()) {
        alert('Please enter a heading name');
        return;
    }

    try {
        const response = await fetch(`/api/headings/${headingId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ name: newName.trim() })
        });

        const data = await response.json();

        if (response.ok) {
            await loadHeadings();
            renderFolders();
        } else {
            alert(data.error || 'Failed to rename heading');
        }
    } catch (error) {
        console.error('Error renaming heading:', error);
        alert('Failed to rename heading');
    }
}

// Delete heading
async function deleteHeading(headingId) {
    if (!confirm('Are you sure you want to delete this heading?\n\nFolders will be moved to uncategorized.')) {
        return;
    }

    try {
        const response = await fetch(`/api/headings/${headingId}`, {
            method: 'DELETE'
        });

        const data = await response.json();

        if (response.ok) {
            await loadHeadings();
            renderFolders();
        } else {
            alert(data.error || 'Failed to delete heading');
        }
    } catch (error) {
        console.error('Error deleting heading:', error);
        alert('Failed to delete heading');
    }
}

// Assign folder to heading (via modal)
async function assignFolderToHeading(folderName, headingId) {
    try {
        const response = await fetch(`/api/headings/${headingId}/assign`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ folderName })
        });

        const data = await response.json();

        if (response.ok) {
            await loadHeadings();
            renderFolders();
        } else {
            alert(data.error || 'Failed to assign folder');
        }
    } catch (error) {
        console.error('Error assigning folder:', error);
        alert('Failed to assign folder');
    }
}

// Unassign folder from heading
async function unassignFolder(folderName) {
    try {
        const response = await fetch('/api/headings/unassign', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ folderName })
        });

        const data = await response.json();

        if (response.ok) {
            await loadHeadings();
            renderFolders();
        } else {
            alert(data.error || 'Failed to unassign folder');
        }
    } catch (error) {
        console.error('Error unassigning folder:', error);
        alert('Failed to unassign folder');
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

// Notes functions
async function showNotesModal() {
    if (!currentViewingFolder || !currentViewingPdf) {
        return;
    }

    notesPdfInfo.textContent = `PDF: ${currentViewingPdf}`;

    // Load existing note
    try {
        const response = await fetch(`/api/notes/${encodeURIComponent(currentViewingFolder)}/${encodeURIComponent(currentViewingPdf)}`);
        const data = await response.json();

        notesTextarea.value = data.note.text || '';
    } catch (error) {
        console.error('Error loading note:', error);
        notesTextarea.value = '';
    }

    notesModal.classList.add('show');
    notesTextarea.focus();
}

function hideNotesModal() {
    notesModal.classList.remove('show');
    notesTextarea.value = '';
}

async function saveNote() {
    if (!currentViewingFolder || !currentViewingPdf) {
        return;
    }

    const text = notesTextarea.value.trim();

    try {
        const response = await fetch(`/api/notes/${encodeURIComponent(currentViewingFolder)}/${encodeURIComponent(currentViewingPdf)}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ text })
        });

        const data = await response.json();

        if (response.ok) {
            hideNotesModal();
            // Show brief success message
            const originalText = notesBtn.querySelector('.toolbar-btn-text').textContent;
            notesBtn.querySelector('.toolbar-btn-text').textContent = 'Saved!';
            setTimeout(() => {
                notesBtn.querySelector('.toolbar-btn-text').textContent = originalText;
            }, 1500);
        } else {
            alert(data.error || 'Failed to save note');
        }
    } catch (error) {
        console.error('Error saving note:', error);
        alert('Failed to save note');
    }
}

// Bulk Delete Functions
function showBulkDeleteModal() {
    if (selectedPdfs.size === 0) {
        alert('No PDFs selected');
        return;
    }

    bulkDeleteCount.textContent = selectedPdfs.size;

    // Populate list of PDFs to delete
    bulkDeleteList.innerHTML = '';
    for (const [key, pdf] of selectedPdfs) {
        const item = document.createElement('div');
        item.className = 'preview-item';
        item.textContent = isGlobalSearch ? `${pdf.folderName}/${pdf.pdfName}` : pdf.pdfName;
        bulkDeleteList.appendChild(item);
    }

    bulkDeleteModal.classList.add('show');
}

function hideBulkDeleteModal() {
    bulkDeleteModal.classList.remove('show');
}

async function performBulkDelete() {
    const pdfsToDelete = Array.from(selectedPdfs.values());
    let successCount = 0;
    let failCount = 0;

    hideBulkDeleteModal();

    for (const pdf of pdfsToDelete) {
        try {
            const response = await fetch(`/api/folders/${encodeURIComponent(pdf.folderName)}/pdf/${encodeURIComponent(pdf.pdfName)}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                successCount++;
            } else {
                failCount++;
            }
        } catch (error) {
            console.error('Error deleting PDF:', error);
            failCount++;
        }
    }

    // Clear selection and reload
    clearSelection();
    await loadFolders();
    await selectFolder(selectedFolder);

    // Show result
    if (failCount === 0) {
        alert(`Successfully deleted ${successCount} PDF(s)`);
    } else {
        alert(`Deleted ${successCount} PDF(s), ${failCount} failed`);
    }
}

// Bulk Move Functions
function showBulkMoveModal() {
    if (selectedPdfs.size === 0) {
        alert('No PDFs selected');
        return;
    }

    // Populate folder select - exclude folders that contain selected PDFs
    const selectedFolders = new Set(Array.from(selectedPdfs.values()).map(pdf => pdf.folderName));
    moveFolderSelect.innerHTML = '<option value="">Select destination folder...</option>';

    folders.forEach(folder => {
        // Skip folders that have selected PDFs (can't move to same folder)
        if (!selectedFolders.has(folder.name)) {
            const option = document.createElement('option');
            option.value = folder.name;
            option.textContent = folder.name;
            moveFolderSelect.appendChild(option);
        }
    });

    movePdfName.textContent = `Move ${selectedPdfs.size} PDF(s) to:`;
    moveModal.classList.add('show');
}

async function performBulkMove() {
    const destination = moveFolderSelect.value;

    if (!destination) {
        alert('Please select a destination folder');
        return;
    }

    const pdfsToMove = Array.from(selectedPdfs.values());
    let successCount = 0;
    let failCount = 0;

    hideMoveModal();

    for (const pdf of pdfsToMove) {
        try {
            const response = await fetch(`/api/folders/${encodeURIComponent(pdf.folderName)}/pdf/${encodeURIComponent(pdf.pdfName)}/move`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ destinationFolderName: destination })
            });

            if (response.ok) {
                successCount++;
            } else {
                failCount++;
            }
        } catch (error) {
            console.error('Error moving PDF:', error);
            failCount++;
        }
    }

    // Clear selection and reload
    clearSelection();
    await loadFolders();

    // Refresh the current view
    if (selectedFolder && !isGlobalSearch) {
        await selectFolder(selectedFolder);
    } else {
        filterPdfs();
    }

    // Show result
    if (failCount === 0) {
        alert(`Successfully moved ${successCount} PDF(s) to ${destination}`);
    } else {
        alert(`Moved ${successCount} PDF(s), ${failCount} failed`);
    }
}

// Bulk Duplicate Functions
async function bulkDuplicatePdfs() {
    if (selectedPdfs.size === 0) {
        alert('No PDFs selected');
        return;
    }

    if (!confirm(`Duplicate ${selectedPdfs.size} PDF(s)?`)) {
        return;
    }

    const pdfsToDuplicate = Array.from(selectedPdfs.values());
    let successCount = 0;
    let failCount = 0;

    for (const pdf of pdfsToDuplicate) {
        try {
            const response = await fetch(`/api/folders/${encodeURIComponent(pdf.folderName)}/pdf/${encodeURIComponent(pdf.pdfName)}/duplicate`, {
                method: 'POST'
            });

            if (response.ok) {
                successCount++;
            } else {
                failCount++;
            }
        } catch (error) {
            console.error('Error duplicating PDF:', error);
            failCount++;
        }
    }

    // Clear selection and reload
    clearSelection();
    await loadFolders();
    await selectFolder(selectedFolder);

    // Show result
    if (failCount === 0) {
        alert(`Successfully duplicated ${successCount} PDF(s)`);
    } else {
        alert(`Duplicated ${successCount} PDF(s), ${failCount} failed`);
    }
}

// Bulk Rename Functions
function showBulkRenameModal() {
    if (selectedPdfs.size === 0) {
        alert('No PDFs selected');
        return;
    }

    bulkRenameCount.textContent = selectedPdfs.size;
    bulkPrefixInput.value = '';
    bulkSuffixInput.value = '';

    // Initial preview
    updateBulkRenamePreview();

    bulkRenameModal.classList.add('show');
}

function hideBulkRenameModal() {
    bulkRenameModal.classList.remove('show');
}

function updateBulkRenamePreview() {
    const prefix = bulkPrefixInput.value;
    const suffix = bulkSuffixInput.value;

    bulkRenamePreview.innerHTML = '';

    for (const [key, pdf] of selectedPdfs) {
        const oldName = pdf.pdfName;
        const baseName = oldName.replace(/\.pdf$/i, '');
        const newName = `${prefix}${baseName}${suffix}.pdf`;

        const item = document.createElement('div');
        item.className = 'preview-item';

        const oldSpan = document.createElement('span');
        oldSpan.className = 'preview-old';
        oldSpan.textContent = oldName;

        const arrow = document.createElement('span');
        arrow.className = 'preview-arrow';
        arrow.textContent = '→';

        const newSpan = document.createElement('span');
        newSpan.className = 'preview-new';
        newSpan.textContent = newName;

        item.appendChild(oldSpan);
        item.appendChild(arrow);
        item.appendChild(newSpan);

        bulkRenamePreview.appendChild(item);
    }
}

async function performBulkRename() {
    const prefix = bulkPrefixInput.value;
    const suffix = bulkSuffixInput.value;

    if (!prefix && !suffix) {
        alert('Please enter a prefix and/or suffix');
        return;
    }

    const pdfsToRename = Array.from(selectedPdfs.values());
    let successCount = 0;
    let failCount = 0;

    hideBulkRenameModal();

    for (const pdf of pdfsToRename) {
        const oldName = pdf.pdfName;
        const baseName = oldName.replace(/\.pdf$/i, '');
        const newName = `${prefix}${baseName}${suffix}.pdf`;

        try {
            const response = await fetch(`/api/folders/${encodeURIComponent(pdf.folderName)}/pdf/${encodeURIComponent(oldName)}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ newPdfName: newName })
            });

            if (response.ok) {
                successCount++;
            } else {
                failCount++;
            }
        } catch (error) {
            console.error('Error renaming PDF:', error);
            failCount++;
        }
    }

    // Clear selection and reload
    clearSelection();
    await loadFolders();
    await selectFolder(selectedFolder);

    // Show result
    if (failCount === 0) {
        alert(`Successfully renamed ${successCount} PDF(s)`);
    } else {
        alert(`Renamed ${successCount} PDF(s), ${failCount} failed`);
    }
}

// Event listeners
searchInput.addEventListener('input', (e) => {
    searchQuery = /** @type {HTMLInputElement} */ (e.target).value;
    filterPdfs();
});

globalSearchCheckbox.addEventListener('change', (e) => {
    isGlobalSearch = /** @type {HTMLInputElement} */ (e.target).checked;

    // Clear selections when toggling search mode
    if (selectedPdfs.size > 0) {
        clearSelection();
    }

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

newHeadingBtn.addEventListener('click', showHeadingModal);
cancelHeadingBtn.addEventListener('click', hideHeadingModal);
createHeadingBtn.addEventListener('click', createHeadingFromModal);

headingNameInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        createHeadingFromModal();
    }
});

headingModal.addEventListener('click', (e) => {
    if (e.target === headingModal) {
        hideHeadingModal();
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

downloadPdfBtn.addEventListener('click', () => {
    if (currentViewingFolder && currentViewingPdf) {
        const pdfUrl = `/api/pdf/${encodeURIComponent(currentViewingFolder)}/${encodeURIComponent(currentViewingPdf)}`;
        const link = document.createElement('a');
        link.href = pdfUrl;
        link.download = currentViewingPdf;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
});

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
moveConfirmBtn.addEventListener('click', () => {
    // Check if this is a bulk operation or single PDF operation
    if (selectedPdfs.size > 0) {
        performBulkMove();
    } else {
        performMovePdf();
    }
});

moveModal.addEventListener('click', (e) => {
    if (e.target === moveModal) {
        hideMoveModal();
    }
});

// Assign folder modal event listeners
assignCancelBtn.addEventListener('click', hideAssignFolderModal);
assignConfirmBtn.addEventListener('click', performAssignFolder);

assignFolderModal.addEventListener('click', (e) => {
    if (e.target === assignFolderModal) {
        hideAssignFolderModal();
    }
});

// Bulk selection event listeners
bulkSelectBtn.addEventListener('click', toggleBulkMode);
clearSelectionBtn.addEventListener('click', clearSelection);

// Bulk operation button listeners
bulkRenameBtn.addEventListener('click', showBulkRenameModal);
bulkDuplicateBtn.addEventListener('click', bulkDuplicatePdfs);
bulkMoveBtn.addEventListener('click', showBulkMoveModal);
bulkDeleteBtn.addEventListener('click', showBulkDeleteModal);

// Bulk rename modal event listeners
bulkRenameCancelBtn.addEventListener('click', hideBulkRenameModal);
bulkRenameConfirmBtn.addEventListener('click', performBulkRename);

bulkRenameModal.addEventListener('click', (e) => {
    if (e.target === bulkRenameModal) {
        hideBulkRenameModal();
    }
});

// Bulk delete modal event listeners
bulkDeleteCancelBtn.addEventListener('click', hideBulkDeleteModal);
bulkDeleteConfirmBtn.addEventListener('click', performBulkDelete);

bulkDeleteModal.addEventListener('click', (e) => {
    if (e.target === bulkDeleteModal) {
        hideBulkDeleteModal();
    }
});

// Live preview for bulk rename
bulkPrefixInput.addEventListener('input', updateBulkRenamePreview);
bulkSuffixInput.addEventListener('input', updateBulkRenamePreview);

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

// Notes modal event listeners
notesBtn.addEventListener('click', showNotesModal);
notesCancelBtn.addEventListener('click', hideNotesModal);
notesSaveBtn.addEventListener('click', saveNote);

notesModal.addEventListener('click', (e) => {
    if (e.target === notesModal) {
        hideNotesModal();
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
    folderSortPreference = /** @type {HTMLSelectElement} */ (e.target).value;
    localStorage.setItem('folderSort', folderSortPreference);
    renderFolders();
});

pdfSortSelect.addEventListener('change', (e) => {
    pdfSortPreference = /** @type {HTMLSelectElement} */ (e.target).value;
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

// Theme toggle functionality
function toggleTheme() {
    const body = document.body;
    const isDarkMode = body.classList.toggle('dark-mode');

    // Update icon and text
    themeIcon.textContent = isDarkMode ? '☀️' : '🌙';
    const themeText = themeToggleBtn.querySelector('.toolbar-btn-text');
    themeText.textContent = isDarkMode ? 'Light Mode' : 'Dark Mode';

    // Save preference to localStorage
    localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
}

function loadThemePreference() {
    const savedTheme = localStorage.getItem('theme');
    const themeText = themeToggleBtn.querySelector('.toolbar-btn-text');

    if (savedTheme === 'dark') {
        document.body.classList.add('dark-mode');
        themeIcon.textContent = '☀️';
        themeText.textContent = 'Light Mode';
    } else {
        document.body.classList.remove('dark-mode');
        themeIcon.textContent = '🌙';
        themeText.textContent = 'Dark Mode';
    }
}

// Theme toggle event listener
themeToggleBtn.addEventListener('click', toggleTheme);

// Initialize the application
async function init() {
    loadThemePreference(); // Load theme preference first
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
