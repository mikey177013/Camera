class FileUtils {
    constructor() {
        this.maxFileSize = 10 * 1024 * 1024; // 10MB default
        this.supportedFormats = {
            images: ['image/png', 'image/jpeg', 'image/webp', 'image/gif'],
            overlays: ['image/png']
        };
    }

    // File validation
    validateFile(file, options = {}) {
        const {
            maxSize = this.maxFileSize,
            allowedTypes = this.supportedFormats.overlays,
            requiredDimensions = null
        } = options;

        // Check file exists
        if (!file) {
            return { valid: false, error: 'No file provided' };
        }

        // Check file type
        if (!allowedTypes.includes(file.type)) {
            return { 
                valid: false, 
                error: `Unsupported file type. Allowed: ${allowedTypes.join(', ')}` 
            };
        }

        // Check file size
        if (file.size > maxSize) {
            return { 
                valid: false, 
                error: `File too large. Maximum size: ${this.formatFileSize(maxSize)}` 
            };
        }

        // Additional validation for images
        if (file.type.startsWith('image/')) {
            return this.validateImageFile(file, requiredDimensions);
        }

        return { valid: true };
    }

    async validateImageFile(file, requiredDimensions = null) {
        return new Promise((resolve) => {
            const img = new Image();
            const reader = new FileReader();

            reader.onload = (e) => {
                img.onload = () => {
                    const result = { 
                        valid: true, 
                        dimensions: { width: img.width, height: img.height } 
                    };

                    // Check dimensions if required
                    if (requiredDimensions) {
                        const { minWidth, minHeight, maxWidth, maxHeight } = requiredDimensions;
                        
                        if (minWidth && img.width < minWidth) {
                            result.valid = false;
                            result.error = `Image width must be at least ${minWidth}px`;
                        } else if (maxWidth && img.width > maxWidth) {
                            result.valid = false;
                            result.error = `Image width must be at most ${maxWidth}px`;
                        } else if (minHeight && img.height < minHeight) {
                            result.valid = false;
                            result.error = `Image height must be at least ${minHeight}px`;
                        } else if (maxHeight && img.height > maxHeight) {
                            result.valid = false;
                            result.error = `Image height must be at most ${maxHeight}px`;
                        }
                    }

                    resolve(result);
                };

                img.onerror = () => {
                    resolve({ 
                        valid: false, 
                        error: 'Failed to load image' 
                    });
                };

                img.src = e.target.result;
            };

            reader.onerror = () => {
                resolve({ 
                    valid: false, 
                    error: 'Failed to read file' 
                });
            };

            reader.readAsDataURL(file);
        });
    }

    // File reading utilities
    readAsDataURL(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = () => reject(reader.error);
            reader.readAsDataURL(file);
        });
    }

    readAsArrayBuffer(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = () => reject(reader.error);
            reader.readAsArrayBuffer(file);
        });
    }

    readAsText(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = () => reject(reader.error);
            reader.readAsText(file);
        });
    }

    // Image processing utilities
    async resizeImage(file, options = {}) {
        const {
            maxWidth = 1920,
            maxHeight = 1080,
            quality = 0.8,
            type = 'image/jpeg'
        } = options;

        return new Promise((resolve, reject) => {
            const img = new Image();
            const reader = new FileReader();

            reader.onload = (e) => {
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');

                    // Calculate new dimensions
                    let width = img.width;
                    let height = img.height;

                    if (width > height) {
                        if (width > maxWidth) {
                            height = Math.round((height * maxWidth) / width);
                            width = maxWidth;
                        }
                    } else {
                        if (height > maxHeight) {
                            width = Math.round((width * maxHeight) / height);
                            height = maxHeight;
                        }
                    }

                    // Set canvas dimensions
                    canvas.width = width;
                    canvas.height = height;

                    // Draw and resize image
                    ctx.drawImage(img, 0, 0, width, height);

                    // Convert to blob
                    canvas.toBlob(
                        (blob) => {
                            if (blob) {
                                resolve(new File([blob], file.name, { type }));
                            } else {
                                reject(new Error('Canvas to Blob conversion failed'));
                            }
                        },
                        type,
                        quality
                    );
                };

                img.onerror = () => {
                    reject(new Error('Failed to load image'));
                };

                img.src = e.target.result;
            };

            reader.onerror = () => {
                reject(new Error('Failed to read file'));
            };

            reader.readAsDataURL(file);
        });
    }

    async convertToPNG(file) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            const reader = new FileReader();

            reader.onload = (e) => {
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    canvas.width = img.width;
                    canvas.height = img.height;

                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0);

                    // Convert to PNG
                    canvas.toBlob(
                        (blob) => {
                            if (blob) {
                                const pngFile = new File(
                                    [blob],
                                    file.name.replace(/\.[^/.]+$/, '') + '.png',
                                    { type: 'image/png' }
                                );
                                resolve(pngFile);
                            } else {
                                reject(new Error('Failed to convert to PNG'));
                            }
                        },
                        'image/png'
                    );
                };

                img.onerror = () => {
                    reject(new Error('Failed to load image'));
                };

                img.src = e.target.result;
            };

            reader.onerror = () => {
                reject(new Error('Failed to read file'));
            };

            reader.readAsDataURL(file);
        });
    }

    // Utility functions
    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    getFileExtension(filename) {
        return filename.slice((filename.lastIndexOf('.') - 1 >>> 0) + 2);
    }

    sanitizeFilename(filename) {
        // Remove invalid characters and limit length
        return filename
            .replace(/[<>:"/\\|?*]/g, '_')
            .replace(/\s+/g, '_')
            .substring(0, 100);
    }

    generateUniqueFilename(originalName) {
        const timestamp = Date.now();
        const random = Math.random().toString(36).substring(2, 8);
        const extension = this.getFileExtension(originalName);
        const name = originalName.replace(/\.[^/.]+$/, '');
        
        return `${this.sanitizeFilename(name)}_${timestamp}_${random}.${extension}`;
    }

    // Download utilities
    downloadDataURL(dataURL, filename) {
        const link = document.createElement('a');
        link.href = dataURL;
        link.download = filename;
        link.style.display = 'none';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    downloadBlob(blob, filename) {
        const url = URL.createObjectURL(blob);
        this.downloadDataURL(url, filename);
        URL.revokeObjectURL(url);
    }
}

export default FileUtils;