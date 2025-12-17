class MenuController {
    constructor() {
        this.menuOverlay = document.getElementById('menu-overlay');
        this.closeMenuButton = document.getElementById('close-menu');
        this.overlayList = document.getElementById('overlay-list');
        this.uploadButton = document.getElementById('upload-overlay');
        this.clearButton = document.getElementById('clear-overlay');
        
        this.overlayManager = null;
        this.fileInput = document.getElementById('overlay-file-input');
        
        this.isOpen = false;
    }

    init() {
        this.setupEventListeners();
        this.setupFileUpload();
    }

    setOverlayManager(overlayManager) {
        this.overlayManager = overlayManager;
    }

    setupEventListeners() {
        // Close menu button
        if (this.closeMenuButton) {
            this.closeMenuButton.addEventListener('click', () => {
                this.closeMenu();
            });
        }

        // Close menu on background click
        if (this.menuOverlay) {
            this.menuOverlay.addEventListener('click', (e) => {
                if (e.target === this.menuOverlay) {
                    this.closeMenu();
                }
            });
        }

        // Clear overlay button
        if (this.clearButton) {
            this.clearButton.addEventListener('click', () => {
                this.clearActiveOverlay();
            });
        }

        // Handle escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isOpen) {
                this.closeMenu();
            }
        });
    }

    setupFileUpload() {
        if (!this.fileInput) return;
        
        // Use the upload button to trigger file input
        if (this.uploadButton) {
            this.uploadButton.addEventListener('click', () => {
                this.fileInput.click();
            });
        }
        
        // Handle file selection
        this.fileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                this.handleFileUpload(file);
            }
            // Reset input
            this.fileInput.value = '';
        });
    }

    toggleMenu() {
        if (this.isOpen) {
            this.closeMenu();
        } else {
            this.openMenu();
        }
    }

    openMenu() {
        if (this.menuOverlay) {
            this.menuOverlay.setAttribute('data-state', 'visible');
            this.isOpen = true;
            document.body.style.overflow = 'hidden';
        }
    }

    closeMenu() {
        if (this.menuOverlay) {
            this.menuOverlay.setAttribute('data-state', 'hidden');
            this.isOpen = false;
            document.body.style.overflow = '';
        }
    }

    updateOverlayList(overlays, activeOverlay) {
        if (!this.overlayList) return;
        
        this.overlayList.innerHTML = '';
        
        // Add "None" option
        const noneItem = this.createOverlayItem({
            id: 'none',
            name: 'None',
            type: 'builtin'
        }, activeOverlay);
        this.overlayList.appendChild(noneItem);
        
        // Add other overlays
        overlays.forEach(overlay => {
            if (overlay.id !== 'none') {
                const item = this.createOverlayItem(overlay, activeOverlay);
                this.overlayList.appendChild(item);
            }
        });
    }

    createOverlayItem(overlay, activeOverlay) {
        const item = document.createElement('div');
        item.className = 'overlay-item';
        if (overlay.type === 'builtin') {
            item.classList.add('built-in');
        }
        
        if (activeOverlay && activeOverlay.id === overlay.id) {
            item.classList.add('active');
        }
        
        item.innerHTML = `
            <span class="overlay-name">${overlay.name}</span>
            ${overlay.type === 'custom' ? 
                '<button class="overlay-delete" aria-label="Delete overlay">×</button>' : 
                ''
            }
        `;
        
        // Click to select overlay
        item.addEventListener('click', (e) => {
            if (!e.target.classList.contains('overlay-delete')) {
                this.selectOverlay(overlay.id);
            }
        });
        
        // Delete button for custom overlays
        if (overlay.type === 'custom') {
            const deleteButton = item.querySelector('.overlay-delete');
            deleteButton.addEventListener('click', (e) => {
                e.stopPropagation();
                this.deleteOverlay(overlay.id);
            });
        }
        
        return item;
    }

    selectOverlay(overlayId) {
        const event = new CustomEvent('overlaySelected', {
            detail: { id: overlayId }
        });
        document.dispatchEvent(event);
        this.closeMenu();
    }

    deleteOverlay(overlayId) {
        if (confirm('Delete this overlay?')) {
            if (this.overlayManager) {
                this.overlayManager.deleteOverlay(overlayId);
            }
        }
    }

    clearActiveOverlay() {
        const event = new CustomEvent('clearOverlay');
        document.dispatchEvent(event);
        this.closeMenu();
    }

    async handleFileUpload(file) {
        if (!this.overlayManager) return;
        
        try {
            await this.overlayManager.handleUploadedOverlay(file);
            this.closeMenu();
        } catch (error) {
            console.error('File upload failed:', error);
            this.showToast('Failed to upload overlay');
        }
    }

    showToast(message) {
        const event = new CustomEvent('showToast', {
            detail: { message }
        });
        document.dispatchEvent(event);
    }
}

export default MenuController;