class OverlayUpload {
    constructor() {
        this.fileInput = document.getElementById('overlay-file-input');
        this.maxFileSize = 5 * 1024 * 1024; // 5MB
        this.allowedTypes = ['image/png'];
        
        this.setupFileInput();
        this.setupDragAndDrop();
    }

    setupFileInput() {
        if (!this.fileInput) return;
        
        const uploadButton = document.getElementById('upload-overlay');
        if (uploadButton) {
            uploadButton.addEventListener('click', () => {
                this.fileInput.click();
            });
        }
        
        this.fileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                this.handleFile(file);
            }
            // Reset input
            this.fileInput.value = '';
        });
    }

    setupDragAndDrop() {
        const app = document.getElementById('app');
        
        app.addEventListener('dragover', (e) => {
            e.preventDefault();
            app.classList.add('dragover');
        });
        
        app.addEventListener('dragleave', (e) => {
            e.preventDefault();
            app.classList.remove('dragover');
        });
        
        app.addEventListener('drop', (e) => {
            e.preventDefault();
            app.classList.remove('dragover');
            
            const file = e.dataTransfer.files[0];
            if (file) {
                this.handleFile(file);
            }
        });
    }

    async handleFile(file) {
        // Validate file
        if (!this.validateFile(file)) {
            return;
        }
        
        try {
            // Create preview
            const preview = await this.createPreview(file);
            
            // Show confirmation dialog
            const confirmed = await this.showConfirmationDialog(preview, file.name);
            
            if (confirmed) {
                // Dispatch upload event
                const event = new CustomEvent('overlayUploaded', {
                    detail: { file }
                });
                document.dispatchEvent(event);
            }
        } catch (error) {
            console.error('File handling error:', error);
            this.showError('Failed to process overlay file');
        }
    }

    validateFile(file) {
        // Check file type
        if (!this.allowedTypes.includes(file.type)) {
            this.showError('Only PNG files are allowed');
            return false;
        }
        
        // Check file size
        if (file.size > this.maxFileSize) {
            this.showError('File size must be less than 5MB');
            return false;
        }
        
        return true;
    }

    createPreview(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                img.onload = () => resolve(img);
                img.onerror = reject;
                img.src = e.target.result;
            };
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }

    showConfirmationDialog(preview, filename) {
        return new Promise((resolve) => {
            const dialog = document.createElement('div');
            dialog.className = 'upload-dialog';
            dialog.innerHTML = `
                <div class="upload-dialog-content">
                    <h3>Confirm Overlay Upload</h3>
                    <p>Filename: ${filename}</p>
                    <div class="upload-preview">
                        <canvas id="preview-canvas"></canvas>
                    </div>
                    <div class="upload-dialog-buttons">
                        <button class="upload-cancel">Cancel</button>
                        <button class="upload-confirm">Upload</button>
                    </div>
                </div>
            `;
            
            document.body.appendChild(dialog);
            
            // Draw preview on canvas
            const canvas = dialog.querySelector('#preview-canvas');
            const ctx = canvas.getContext('2d');
            canvas.width = preview.width;
            canvas.height = preview.height;
            ctx.drawImage(preview, 0, 0);
            
            // Add event listeners
            dialog.querySelector('.upload-cancel').addEventListener('click', () => {
                dialog.remove();
                resolve(false);
            });
            
            dialog.querySelector('.upload-confirm').addEventListener('click', () => {
                dialog.remove();
                resolve(true);
            });
            
            // Close on background click
            dialog.addEventListener('click', (e) => {
                if (e.target === dialog) {
                    dialog.remove();
                    resolve(false);
                }
            });
        });
    }

    showError(message) {
        const event = new CustomEvent('showToast', {
            detail: { message, type: 'error' }
        });
        document.dispatchEvent(event);
    }
}

export default OverlayUpload;