class PhotoCapture {
    constructor() {
        this.videoElement = null;
        this.overlayManager = null;
        this.canvas = document.createElement('canvas');
        this.ctx = this.canvas.getContext('2d');
    }

    init(videoElement) {
        this.videoElement = videoElement;
    }

    setOverlayManager(overlayManager) {
        this.overlayManager = overlayManager;
    }

    async capture() {
        if (!this.videoElement || this.videoElement.readyState !== 4) {
            throw new Error('Video not ready');
        }

        try {
            // Get video dimensions
            const videoWidth = this.videoElement.videoWidth;
            const videoHeight = this.videoElement.videoHeight;
            
            // Set canvas to video dimensions
            this.canvas.width = videoWidth;
            this.canvas.height = videoHeight;
            
            // Draw video frame
            this.ctx.drawImage(this.videoElement, 0, 0, videoWidth, videoHeight);
            
            // Apply overlay if enabled
            if (this.overlayManager && this.overlayManager.isOverlayEnabled()) {
                await this.overlayManager.drawOverlayOnPhoto(this.ctx, videoWidth, videoHeight);
            }
            
            // Get image data
            const imageData = this.canvas.toDataURL('image/jpeg', 0.92);
            
            // Trigger shutter animation
            this.triggerShutterAnimation();
            
            // Trigger vibration if available
            this.triggerVibration();
            
            // Download the photo
            this.downloadPhoto(imageData);
            
            return imageData;
        } catch (error) {
            console.error('Photo capture error:', error);
            throw error;
        }
    }

    triggerShutterAnimation() {
        const flash = document.getElementById('shutter-flash');
        if (flash) {
            flash.classList.remove('active');
            // Trigger reflow
            void flash.offsetWidth;
            flash.classList.add('active');
        }
    }

    triggerVibration() {
        if ('vibrate' in navigator) {
            navigator.vibrate(50);
        }
    }

    downloadPhoto(imageData) {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `composition-camera-${timestamp}.jpg`;
        
        const link = document.createElement('a');
        link.href = imageData;
        link.download = filename;
        link.style.display = 'none';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Show success message
        this.showToast('Photo saved!');
    }

    showToast(message) {
        const event = new CustomEvent('showToast', {
            detail: { message }
        });
        document.dispatchEvent(event);
    }

    getCanvas() {
        return this.canvas;
    }
}

export default PhotoCapture;