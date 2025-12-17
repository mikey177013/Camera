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
            // Get the current aspect ratio from the camera controller
            const currentAspectRatio = this.getCurrentAspectRatio();
            const [ratioW, ratioH] = currentAspectRatio.split(':').map(Number);
            const targetRatio = ratioW / ratioH;
            
            // Get original video dimensions
            const videoWidth = this.videoElement.videoWidth;
            const videoHeight = this.videoElement.videoHeight;
            const videoAspect = videoWidth / videoHeight;
            
            let cropWidth, cropHeight, cropX, cropY;
            
            // Calculate crop area based on target aspect ratio
            if (videoAspect > targetRatio) {
                // Video is wider than target - crop width
                cropHeight = videoHeight;
                cropWidth = cropHeight * targetRatio;
                cropX = (videoWidth - cropWidth) / 2;
                cropY = 0;
            } else {
                // Video is taller than target - crop height
                cropWidth = videoWidth;
                cropHeight = cropWidth / targetRatio;
                cropX = 0;
                cropY = (videoHeight - cropHeight) / 2;
            }
            
            // Set canvas to cropped dimensions
            this.canvas.width = cropWidth;
            this.canvas.height = cropHeight;
            
            // Draw ONLY the cropped video area - NO OVERLAY
            this.ctx.drawImage(
                this.videoElement,
                cropX, cropY, cropWidth, cropHeight, // Source crop
                0, 0, cropWidth, cropHeight          // Destination
            );
            
            // IMPORTANT: NO OVERLAY IS DRAWN - IT'S JUST A GUIDE FOR THE USER
            
            // Get image data
            const imageData = this.canvas.toDataURL('image/jpeg', 0.92);
            
            // Trigger shutter animation
            this.triggerShutterAnimation();
            
            // Trigger vibration if available
            this.triggerVibration();
            
            // Download the photo with correct aspect ratio
            this.downloadPhoto(imageData, currentAspectRatio);
            
            return imageData;
        } catch (error) {
            console.error('Photo capture error:', error);
            throw error;
        }
    }

    getCurrentAspectRatio() {
        // Get active aspect ratio from UI
        const activeBtn = document.querySelector('.aspect-ratio-btn.active');
        if (activeBtn) {
            return activeBtn.dataset.ratio || '4:3';
        }
        return '4:3';
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

    downloadPhoto(imageData, aspectRatio) {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const aspectLabel = aspectRatio.replace(':', 'x');
        const filename = `photo_${aspectLabel}_${timestamp}.jpg`;
        
        const link = document.createElement('a');
        link.href = imageData;
        link.download = filename;
        link.style.display = 'none';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Show success message with aspect ratio
        this.showToast(`Photo saved! (${aspectRatio})`);
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