class OverlayRenderer {
    constructor() {
        this.canvas = document.getElementById('overlay-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.currentOverlay = null;
        this.overlayImage = null;
        
        this.width = 0;
        this.height = 0;
    }

    async setOverlay(overlaySource) {
        try {
            if (typeof overlaySource === 'string') {
                // URL or data URL
                this.overlayImage = await this.loadImage(overlaySource);
            } else if (overlaySource instanceof HTMLCanvasElement) {
                // Canvas element
                this.overlayImage = overlaySource;
            } else {
                // Image element or ImageBitmap
                this.overlayImage = overlaySource;
            }
            
            this.currentOverlay = overlaySource;
            this.render();
        } catch (error) {
            console.error('Failed to set overlay:', error);
            throw error;
        }
    }

    loadImage(src) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.onload = () => resolve(img);
            img.onerror = reject;
            img.src = src;
        });
    }

    updateSize(width, height) {
        this.width = width;
        this.height = height;
        
        if (this.canvas) {
            this.canvas.style.width = `${width}px`;
            this.canvas.style.height = `${height}px`;
            this.canvas.width = width;
            this.canvas.height = height;
            
            if (this.currentOverlay) {
                this.render();
            }
        }
    }

    render() {
        if (!this.overlayImage || !this.ctx || this.width === 0 || this.height === 0) {
            return;
        }

        // Clear canvas
        this.ctx.clearRect(0, 0, this.width, this.height);
        
        // Calculate scale to fit canvas while maintaining aspect ratio
        const imgAspect = this.overlayImage.width / this.overlayImage.height;
        const canvasAspect = this.width / this.height;
        
        let drawWidth, drawHeight, drawX, drawY;
        
        if (canvasAspect > imgAspect) {
            // Canvas is wider than image
            drawHeight = this.height;
            drawWidth = drawHeight * imgAspect;
            drawX = (this.width - drawWidth) / 2;
            drawY = 0;
        } else {
            // Canvas is taller than image
            drawWidth = this.width;
            drawHeight = drawWidth / imgAspect;
            drawX = 0;
            drawY = (this.height - drawHeight) / 2;
        }
        
        // Draw overlay
        this.ctx.globalAlpha = 0.7; // Adjust transparency as needed
        this.ctx.drawImage(this.overlayImage, drawX, drawY, drawWidth, drawHeight);
        this.ctx.globalAlpha = 1.0;
    }

    clear() {
        this.currentOverlay = null;
        this.overlayImage = null;
        
        if (this.ctx && this.canvas) {
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        }
    }

    getCanvas() {
        return this.canvas;
    }

    getContext() {
        return this.ctx;
    }

    isRendering() {
        return this.currentOverlay !== null;
    }
}

export default OverlayRenderer;