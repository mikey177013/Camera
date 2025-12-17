import CameraStream from './camera-stream.js';
import PhotoCapture from './photo-capture.js';
import CameraSwitch from './camera-switch.js';

class CameraController {
    constructor() {
        this.cameraStream = new CameraStream();
        this.photoCapture = new PhotoCapture();
        this.cameraSwitch = new CameraSwitch();
        this.overlayManager = null;
        
        this.videoElement = document.getElementById('camera-preview');
        this.currentAspectRatio = '4:3';
        this.currentCamera = 'environment';
        
        this.bindEvents();
    }

    bindEvents() {
        // Aspect ratio change
        document.addEventListener('aspectRatioChanged', (e) => {
            this.setAspectRatio(e.detail.ratio);
        });

        // Camera switch
        document.addEventListener('cameraSwitch', () => {
            this.toggleCamera();
        });
    }

    async init() {
        try {
            await this.cameraStream.init(this.videoElement);
            this.photoCapture.init(this.videoElement);
            this.cameraSwitch.init();
            
            // Set default aspect ratio
            this.setAspectRatio(this.currentAspectRatio);
            
            console.log('Camera controller initialized');
        } catch (error) {
            console.error('Camera controller init failed:', error);
            throw error;
        }
    }

    setOverlayManager(overlayManager) {
        this.overlayManager = overlayManager;
        this.photoCapture.setOverlayManager(overlayManager);
    }

    setAspectRatio(ratio) {
        this.currentAspectRatio = ratio;
        
        // Calculate and apply crop to video element
        const container = this.videoElement.parentElement;
        const containerWidth = container.clientWidth;
        const containerHeight = container.clientHeight;
        
        const [w, h] = ratio.split(':').map(Number);
        const targetRatio = w / h;
        const containerRatio = containerWidth / containerHeight;
        
        let width, height;
        
        if (containerRatio > targetRatio) {
            // Container is wider than target - black bars on sides
            height = containerHeight;
            width = height * targetRatio;
        } else {
            // Container is taller than target - black bars on top/bottom
            width = containerWidth;
            height = width / targetRatio;
        }
        
        this.videoElement.style.width = `${width}px`;
        this.videoElement.style.height = `${height}px`;
        this.videoElement.style.left = `${(containerWidth - width) / 2}px`;
        this.videoElement.style.top = `${(containerHeight - height) / 2}px`;
        this.videoElement.style.position = 'absolute';
        
        // Update overlay if exists
        if (this.overlayManager) {
            this.overlayManager.updateAspectRatio(ratio, width, height);
        }
        
        console.log(`Aspect ratio changed to ${ratio} (${width}x${height})`);
    }

    async toggleCamera() {
        try {
            const newCamera = this.currentCamera === 'environment' ? 'user' : 'environment';
            await this.cameraStream.switchCamera(newCamera);
            this.currentCamera = newCamera;
            
            // Trigger camera switch animation
            this.triggerCameraSwitchAnimation();
        } catch (error) {
            console.error('Failed to switch camera:', error);
            this.showToast('Failed to switch camera');
        }
    }

    triggerCameraSwitchAnimation() {
        const animation = document.createElement('div');
        animation.className = 'camera-switch-animation';
        document.querySelector('.camera-container').appendChild(animation);
        
        setTimeout(() => {
            animation.classList.add('active');
            setTimeout(() => {
                animation.remove();
            }, 500);
        }, 10);
    }

    async capturePhoto() {
        try {
            const photoData = await this.photoCapture.capture();
            return photoData;
        } catch (error) {
            console.error('Photo capture failed:', error);
            this.showToast('Failed to capture photo');
            throw error;
        }
    }

    showToast(message) {
        const event = new CustomEvent('showToast', {
            detail: { message }
        });
        document.dispatchEvent(event);
    }

    getCurrentAspectRatio() {
        return this.currentAspectRatio;
    }

    getCurrentStream() {
        return this.cameraStream.getStream();
    }

    stop() {
        this.cameraStream.stop();
    }
}

export default CameraController;